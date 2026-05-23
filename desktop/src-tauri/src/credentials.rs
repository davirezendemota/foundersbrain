use std::fs;
use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chacha20poly1305::aead::{Aead, AeadCore, KeyInit};
use chacha20poly1305::{ChaCha20Poly1305, Nonce};
use keyring::Entry;
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

const CREDENTIALS_FILE: &str = "api-credentials.enc";
const KEYRING_SERVICE: &str = "io.rmconsult.second-brain";
const FILE_MAGIC: &[u8; 5] = b"SBCR1";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiCredentials {
    pub provider: String,
    pub api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialsStatus {
    pub configured: bool,
    pub provider: Option<String>,
}

pub fn second_brain_dir(vault_path: &Path) -> PathBuf {
    vault_path.join(".second-brain")
}

pub fn ensure_second_brain_dir(vault_path: &Path) -> Result<PathBuf, String> {
    if !vault_path.is_dir() {
        return Err("O caminho do vault não é um diretório válido.".into());
    }

    let dir = second_brain_dir(vault_path);
    fs::create_dir_all(&dir).map_err(|error| format!("Falha ao criar .second-brain: {error}"))?;
    Ok(dir)
}

fn credentials_path(vault_path: &Path) -> PathBuf {
    second_brain_dir(vault_path).join(CREDENTIALS_FILE)
}

fn vault_key_id(vault_path: &Path) -> Result<String, String> {
    let canonical = vault_path
        .canonicalize()
        .map_err(|error| format!("Vault inválido: {error}"))?;
    let digest = Sha256::digest(canonical.to_string_lossy().as_bytes());
    Ok(hex::encode(digest))
}

fn keyring_entry(vault_path: &Path) -> Result<Entry, String> {
    let vault_id = vault_key_id(vault_path)?;
    Entry::new(KEYRING_SERVICE, &vault_id).map_err(|error| format!("Keychain indisponível: {error}"))
}

fn encryption_key(vault_path: &Path) -> Result<[u8; 32], String> {
    let entry = keyring_entry(vault_path)?;

    if let Ok(encoded) = entry.get_password() {
        let bytes = BASE64
            .decode(encoded.trim())
            .map_err(|error| format!("Chave local inválida: {error}"))?;
        if bytes.len() != 32 {
            return Err("Chave local corrompida.".into());
        }
        let mut key = [0u8; 32];
        key.copy_from_slice(&bytes);
        return Ok(key);
    }

    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    entry
        .set_password(&BASE64.encode(key))
        .map_err(|error| format!("Falha ao salvar chave no keychain: {error}"))?;
    Ok(key)
}

fn encrypt_payload(key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = ChaCha20Poly1305::new_from_slice(key).map_err(|error| error.to_string())?;
    let nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|error| format!("Falha ao criptografar credenciais: {error}"))?;

    let mut output = Vec::with_capacity(FILE_MAGIC.len() + nonce.len() + ciphertext.len());
    output.extend_from_slice(FILE_MAGIC);
    output.extend_from_slice(&nonce);
    output.extend_from_slice(&ciphertext);
    Ok(output)
}

fn decrypt_payload(key: &[u8; 32], payload: &[u8]) -> Result<Vec<u8>, String> {
    if payload.len() < FILE_MAGIC.len() + 12 {
        return Err("Arquivo de credenciais inválido.".into());
    }

    if &payload[..FILE_MAGIC.len()] != FILE_MAGIC {
        return Err("Arquivo de credenciais corrompido.".into());
    }

    let nonce_start = FILE_MAGIC.len();
    let nonce = Nonce::from_slice(&payload[nonce_start..nonce_start + 12]);
    let ciphertext = &payload[nonce_start + 12..];

    let cipher = ChaCha20Poly1305::new_from_slice(key).map_err(|error| error.to_string())?;
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|error| format!("Falha ao descriptografar credenciais: {error}"))
}

pub fn credentials_status(vault_path: &Path) -> Result<CredentialsStatus, String> {
    let path = credentials_path(vault_path);
    if !path.is_file() {
        return Ok(CredentialsStatus {
            configured: false,
            provider: None,
        });
    }

    let credentials = load_api_credentials(vault_path)?;
    Ok(CredentialsStatus {
        configured: credentials.is_some(),
        provider: credentials.map(|value| value.provider),
    })
}

pub fn load_api_credentials(vault_path: &Path) -> Result<Option<ApiCredentials>, String> {
    let path = credentials_path(vault_path);
    if !path.is_file() {
        return Ok(None);
    }

    let payload = fs::read(&path).map_err(|error| format!("Falha ao ler credenciais: {error}"))?;
    let key = encryption_key(vault_path)?;
    let plaintext = decrypt_payload(&key, &payload)?;
    let credentials: ApiCredentials =
        serde_json::from_slice(&plaintext).map_err(|error| format!("Credenciais inválidas: {error}"))?;
    Ok(Some(credentials))
}

pub fn save_api_credentials(vault_path: &Path, credentials: ApiCredentials) -> Result<(), String> {
    ensure_second_brain_dir(vault_path)?;

    let plaintext = serde_json::to_vec(&credentials)
        .map_err(|error| format!("Falha ao serializar credenciais: {error}"))?;
    let key = encryption_key(vault_path)?;
    let encrypted = encrypt_payload(&key, &plaintext)?;

    fs::write(credentials_path(vault_path), encrypted)
        .map_err(|error| format!("Falha ao salvar credenciais: {error}"))?;

    Ok(())
}
