# ADR-008 — Storage de credenciais por vault

**Status:** Aceita
**Data:** 2026-05-23
**Autores:** Davi Rezende

---

## Contexto

O app precisa guardar a API key do provider de IA (OpenAI, Anthropic, etc.). Requisitos:

- **Local-first**: nada de servidor próprio para autenticação.
- **Por vault**: cada vault pode ter sua própria chave/provider (vault de trabalho vs. pessoal, por exemplo). Selecionar um vault diferente deve usar credenciais diferentes.
- **Não armazenar em texto plano**: a chave dá acesso pago direto à conta do usuário.
- **Vault portátil**: copiar a pasta do vault para outra máquina **não** deve expor a chave.
- **Sem prompts de senha mestra a cada sessão**: usabilidade é prioridade.

## Decisão

Usamos um esquema híbrido **arquivo criptografado no vault + chave mestra no keychain do OS**.

```
vault/
└── .second-brain/
    └── api-credentials.enc       ← ChaCha20-Poly1305(provider + api_key + model)
```

```
keychain do OS (macOS Keychain, Windows Credential Manager, Secret Service)
└── service "io.rmconsult.second-brain"
    └── account = SHA-256(canonical(vault_path))
        └── value = base64(32 random bytes)   ← chave mestra
```

### Formato do arquivo `api-credentials.enc`

| Bytes | Conteúdo |
|-------|----------|
| 0..4 | Magic `SBCR1` (5 bytes) |
| 5..16 | Nonce de 12 bytes (gerado por `OsRng` no save) |
| 17..N | Ciphertext + tag (Poly1305) |

Plaintext (após decrypt) é JSON serializado de `ApiCredentials`:

```json
{ "provider": "openai", "api_key": "sk-…", "model": "gpt-4o" }
```

### Fluxo

1. Usuário escolhe um vault → app gera (ou recupera) a chave mestra de 32 bytes no keychain (account = SHA-256 do path canônico).
2. Usuário configura provider + API key na UI → backend Rust serializa `ApiCredentials` em JSON, criptografa com ChaCha20-Poly1305 + nonce fresco, prepende magic e salva em `.second-brain/api-credentials.enc`.
3. A cada chamada de chat/TTS, o Rust:
   - canonicaliza o path do vault,
   - busca a chave no keychain,
   - lê e decriptografa o arquivo,
   - mergeia `api_key` + `provider` + `model` no `config` JSON passado ao sidecar Python.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| API key direto no keychain (sem arquivo) | Mais simples (zero criptografia própria) | Não vinculado ao vault — múltiplos vaults colidem; sincronizar entre máquinas requer reentrada | Não atende "por vault" |
| Arquivo em texto plano no vault | Trivial | Qualquer pessoa com acesso à pasta lê a chave; `git push` acidental vaza | Inaceitável |
| Senha mestra do usuário (PBKDF2 → key) | Vault 100% portátil sem keychain | UX ruim (digitar senha a cada sessão), risco de senha fraca | Fricção alta para uso diário |
| Variável de ambiente (`OPENAI_API_KEY`) | Padrão da indústria para CLI | Não funciona bem em app GUI com múltiplos vaults; precisaria de wrapper extra | Não escala por vault |

## Consequências

**Positivas:**

- API key nunca aparece em texto plano em disco.
- Cópia do vault para outra máquina não vaza a chave (a chave mestra não viaja).
- Trocar de provider/key na UI sobrescreve só o arquivo do vault, sem efeitos colaterais.
- Múltiplos vaults têm credenciais independentes — vault de trabalho e pessoal não se misturam.

**Negativas / trade-offs:**

- Renomear/mover o vault muda o path canônico → invalida a chave mestra → usuário tem que reconfigurar. Trade-off intencional: melhor "perder" a chave do que arriscar conflitos silenciosos com o keychain.
- Reinstalar o OS limpa o keychain → exige reconfiguração das chaves.
- Linux precisa de um Secret Service rodando (`gnome-keyring`, `kwallet`); ambientes mínimos podem falhar — log claro, sem fallback automático em texto plano por enquanto.

## Notas

- Implementação em `desktop/src-tauri/src/credentials.rs` (~160 linhas).
- Service do keychain: `io.rmconsult.second-brain`.
- O comando Tauri `save_vault_credentials` rejeita keys com `< 8` caracteres e providers fora de `{openai, anthropic}`. Adicionar novos providers exige atualizar essa whitelist.
- O sidecar Python (`chat.py`) recebe a API key apenas no JSON de `--config` (argumento de processo). Ela não vai parar em disco nem em variável de ambiente; o processo termina ao fim do stream.
