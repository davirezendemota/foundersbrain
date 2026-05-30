mod credentials;
mod settings;

use std::path::PathBuf;
use std::process::{Command, Stdio};

use credentials::{
    load_api_credentials, save_api_credentials, ApiCredentials, CredentialsStatus,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use settings::{load_settings, save_settings, AppSettings};
use tauri::{async_runtime::spawn_blocking, AppHandle, Emitter};
#[cfg(not(debug_assertions))]
use tauri::Manager;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as AsyncCommand;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolCall {
    pub tool_name: String,
    pub tool_call_id: String,
    pub args: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub content: Option<String>,
    pub tool_call: Option<ToolCall>,
    pub error: Option<String>,
}

fn scripts_dir() -> PathBuf {
    #[cfg(debug_assertions)]
    {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("scripts")
    }
    #[cfg(not(debug_assertions))]
    {
        PathBuf::from("scripts")
    }
}

fn resolve_chat_script(app: &AppHandle) -> PathBuf {
    #[cfg(debug_assertions)]
    {
        let _ = app;
        scripts_dir().join("chat.py")
    }
    #[cfg(not(debug_assertions))]
    {
        app.path()
            .resource_dir()
            .map(|dir| dir.join("scripts/chat.py"))
            .unwrap_or_else(|_| scripts_dir().join("chat.py"))
    }
}

fn vault_path_from_string(vault_path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(vault_path);
    if !path.is_dir() {
        return Err("Selecione uma pasta de vault válida.".into());
    }
    Ok(path)
}

fn merge_credentials_into_config(config: &mut Value, credentials: &ApiCredentials) -> Result<(), String> {
    let provider = credentials.provider.trim();
    if provider != "openai" && provider != "anthropic" {
        return Err(format!("Provider inválido: {provider}"));
    }

    if let Some(object) = config.as_object_mut() {
        object.insert("provider".into(), json!(provider));
        object.insert("api_key".into(), json!(credentials.api_key));
        if let Some(model) = &credentials.model {
            object.insert("model".into(), json!(model));
        }
        return Ok(());
    }

    Err("Configuração de chat inválida.".into())
}

fn python_output(script: &str, args: Vec<String>) -> Result<String, String> {
    let dir = scripts_dir();
    let output = Command::new("pipenv")
        .args(["run", "python3", script])
        .args(&args)
        .current_dir(&dir)
        .output()
        .map_err(|e| format!("failed to spawn pipenv: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("script exited with error: {stderr}"));
    }

    String::from_utf8(output.stdout).map_err(|e| format!("invalid utf-8 output: {e}"))
}

#[tauri::command]
fn get_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    load_settings(&app)
}

#[tauri::command]
fn set_active_vault(app: AppHandle, vault_path: String) -> Result<(), String> {
    let _ = vault_path_from_string(&vault_path)?;
    let mut settings = load_settings(&app)?;
    settings.last_vault_path = Some(vault_path);
    save_settings(&app, &settings)
}

#[tauri::command]
async fn pick_vault_folder(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app
        .dialog()
        .file()
        .set_title("Selecionar vault")
        .blocking_pick_folder();

    Ok(folder.map(|path| path.to_string()))
}

#[tauri::command]
fn get_vault_credentials_status(vault_path: String) -> Result<CredentialsStatus, String> {
    let path = vault_path_from_string(&vault_path)?;
    credentials::credentials_status(&path)
}

#[tauri::command]
fn save_vault_credentials(
    vault_path: String,
    provider: String,
    api_key: String,
) -> Result<CredentialsStatus, String> {
    let path = vault_path_from_string(&vault_path)?;
    let provider = provider.trim().to_lowercase();

    if provider != "openai" && provider != "anthropic" {
        return Err("Provider deve ser openai ou anthropic.".into());
    }

    let api_key = api_key.trim().to_string();
    if api_key.len() < 8 {
        return Err("Informe uma API key válida.".into());
    }

    let default_model = if provider == "anthropic" {
        "claude-sonnet-4-20250514"
    } else {
        "gpt-4o"
    };

    save_api_credentials(
        &path,
        ApiCredentials {
            provider: provider.clone(),
            api_key,
            model: Some(default_model.into()),
        },
    )?;

    Ok(CredentialsStatus {
        configured: true,
        provider: Some(provider),
    })
}

#[tauri::command]
fn check_stale_credentials(vault_path: String) -> Result<(), String> {
    let path = vault_path_from_string(&vault_path)?;
    credentials::check_stale_credentials(&path)
}

#[tauri::command]
async fn chat(
    app: AppHandle,
    vault_path: String,
    messages: Vec<Message>,
    config: Value,
) -> Result<(), String> {
    let vault = vault_path_from_string(&vault_path)?;
    let credentials = load_api_credentials(&vault)?.ok_or(
        "API key não configurada. Configure OpenAI ou Anthropic nas configurações do vault.",
    )?;

    let mut config = config;
    merge_credentials_into_config(&mut config, &credentials)?;

    let messages_json =
        serde_json::to_string(&messages).map_err(|e| format!("failed to serialize messages: {e}"))?;
    let config_json =
        serde_json::to_string(&config).map_err(|e| format!("failed to serialize config: {e}"))?;

    let script_path = resolve_chat_script(&app);
    let scripts_path = scripts_dir();

    let mut child = AsyncCommand::new("pipenv")
        .args(["run", "python3"])
        .arg(&script_path)
        .arg("--messages")
        .arg(&messages_json)
        .arg("--config")
        .arg(&config_json)
        .current_dir(&scripts_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to start chat.py: {e}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or("failed to capture chat.py stdout")?;
    let stderr = child
        .stderr
        .take()
        .ok_or("failed to capture chat.py stderr")?;

    let app_err = app.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            log::warn!("[chat.py stderr] {line}");
            let _ = app_err.emit(
                "chat-event",
                ChatEvent {
                    event_type: "error".into(),
                    content: None,
                    tool_call: None,
                    error: Some(line),
                },
            );
        }
    });

    let mut reader = BufReader::new(stdout).lines();
    while let Ok(Some(line)) = reader.next_line().await {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        match serde_json::from_str::<ChatEvent>(line) {
            Ok(event) => {
                let is_done = event.event_type == "done";
                app.emit("chat-event", event)
                    .map_err(|e| format!("failed to emit chat-event: {e}"))?;
                if is_done {
                    break;
                }
            }
            Err(error) => {
                log::warn!("[chat.py parse error] line={line} error={error}");
            }
        }
    }

    child
        .wait()
        .await
        .map_err(|e| format!("failed waiting for chat.py: {e}"))?;

    Ok(())
}

#[tauri::command]
async fn speech(vault_path: String, text: String) -> Result<String, String> {
    let vault = vault_path_from_string(&vault_path)?;
    let credentials = load_api_credentials(&vault)?.ok_or(
        "API key não configurada. Configure OpenAI ou Anthropic nas configurações do vault.",
    )?;

    if credentials.provider != "openai" {
        return Err("TTS requer provider OpenAI neste vault.".into());
    }

    spawn_blocking(move || {
        python_output(
            "speech.py",
            vec![
                "--text".into(),
                text,
                "--api-key".into(),
                credentials.api_key,
            ],
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map(|s| s.trim().to_string())
}

#[tauri::command]
async fn fetch_content_metadata(url: String) -> Result<serde_json::Value, String> {
    let raw = spawn_blocking(move || python_output("content.py", vec!["--url".into(), url]))
        .await
        .map_err(|e| e.to_string())??;

    serde_json::from_str(&raw).map_err(|e| format!("invalid JSON from content.py: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_settings,
            set_active_vault,
            pick_vault_folder,
            get_vault_credentials_status,
            save_vault_credentials,
            check_stale_credentials,
            chat,
            speech,
            fetch_content_metadata,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
