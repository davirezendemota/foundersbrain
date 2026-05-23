// src-tauri/src/main.rs
//
// Tauri backend — chama script Python via Command e faz stream dos chunks para o frontend.
// O Python cuida de toda a lógica de API (Anthropic, OpenAI, Ollama, etc.).
// O Rust só gerencia o processo e repassa os eventos via emit().
//
// Dependências em Cargo.toml:
//   [dependencies]
//   tauri = { version = "2", features = ["process-command-api"] }
//   serde = { version = "1", features = ["derive"] }
//   serde_json = "1"
//   tokio = { version = "1", features = ["full"] }

use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use serde::{Deserialize, Serialize};

// ─── Tipos compartilhados com o frontend ──────────────────────────────────────

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

/// Evento emitido para o frontend a cada linha do stdout do Python.
/// O Python escreve JSON em cada linha — o frontend faz o parse.
#[derive(Debug, Serialize, Clone)]
pub struct ChatEvent {
    pub r#type: String,         // "text" | "tool_call" | "done" | "error"
    pub content: Option<String>,
    pub tool_call: Option<ToolCall>,
    pub error: Option<String>,
}

// ─── Comando principal ────────────────────────────────────────────────────────

/// Invocado pelo React via: invoke("chat", { messages, config })
/// Spawna o script Python e faz stream linha a linha via evento "chat-event".
#[tauri::command]
pub async fn chat(
    app: AppHandle,
    messages: Vec<Message>,
    config: serde_json::Value, // { provider, model, api_key, base_url }
) -> Result<(), String> {
    // Serializa as mensagens para passar como argumento JSON
    let messages_json = serde_json::to_string(&messages)
        .map_err(|e| format!("Erro ao serializar mensagens: {e}"))?;

    let config_json = serde_json::to_string(&config)
        .map_err(|e| format!("Erro ao serializar config: {e}"))?;

    // Resolve o caminho do script Python relativo ao bundle Tauri
    // Em dev: usa caminho relativo. Em produção: usa resource_dir().
    let script_path = app
        .path()
        .resource_dir()
        .map(|p| p.join("scripts/chat.py"))
        .unwrap_or_else(|_| std::path::PathBuf::from("scripts/chat.py"));

    // Spawna o processo Python com streaming de stdout
    let mut child = Command::new("python3")
        .arg(&script_path)
        .arg("--messages")
        .arg(&messages_json)
        .arg("--config")
        .arg(&config_json)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Falha ao iniciar Python: {e}"))?;

    let stdout = child.stdout.take()
        .ok_or("Falha ao capturar stdout do Python")?;

    let stderr = child.stderr.take()
        .ok_or("Falha ao capturar stderr do Python")?;

    // Lê stderr em background para debug
    let app_err = app.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            eprintln!("[python stderr] {line}");
            let _ = app_err.emit("chat-event", ChatEvent {
                r#type: "error".into(),
                content: None,
                tool_call: None,
                error: Some(line),
            });
        }
    });

    // Lê stdout linha a linha e emite evento para o frontend
    // O Python escreve uma linha JSON por chunk/evento
    let mut reader = BufReader::new(stdout).lines();

    while let Ok(Some(line)) = reader.next_line().await {
        let line = line.trim().to_string();
        if line.is_empty() {
            continue;
        }

        // Tenta parsear a linha como ChatEvent
        match serde_json::from_str::<ChatEvent>(&line) {
            Ok(event) => {
                app.emit("chat-event", event.clone())
                    .map_err(|e| format!("Erro ao emitir evento: {e}"))?;

                // Para quando o Python sinaliza fim do stream
                if event.r#type == "done" {
                    break;
                }
            }
            Err(e) => {
                eprintln!("[parse error] linha: {line} | erro: {e}");
            }
        }
    }

    // Aguarda o processo terminar
    child.wait().await
        .map_err(|e| format!("Erro ao aguardar processo Python: {e}"))?;

    Ok(())
}

// ─── Registro dos commands ────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![chat])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar aplicação Tauri");
}
