// src/hooks/useGenerativeChat.ts
//
// Hook que invoca o command Tauri "chat" e consome os eventos streaming.
// Compatível com qualquer provider — basta mudar o config passado.

import { invoke } from "@tauri-apps/api/core"
import { listen, UnlistenFn } from "@tauri-apps/api/event"
import { useState, useCallback, useRef } from "react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  toolInvocations?: ToolInvocation[]
}

export interface ToolInvocation {
  toolName: string
  toolCallId: string
  state: "call"
  args: Record<string, unknown>
}

export interface ProviderConfig {
  provider: "anthropic" | "openai" | "groq" | "together" | "ollama" | "lm_studio"
  model: string
  api_key?: string
  base_url?: string    // para providers locais: "http://localhost:11434/v1"
  system_prompt?: string
}

// Evento recebido do Python via Tauri emit()
interface ChatEvent {
  type: "text" | "tool_call" | "done" | "error"
  content?: string
  tool_call?: {
    tool_name: string
    tool_call_id: string
    args: Record<string, unknown>
  }
  error?: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGenerativeChat(config: ProviderConfig) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unlistenRef = useRef<UnlistenFn | null>(null)

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    setError(null)
    setIsLoading(true)
    setInput("")

    // Adiciona mensagem do usuário
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }

    // Placeholder da mensagem do assistente (será preenchida via stream)
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolInvocations: [],
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])

    // Serializa histórico para o Python (formato OpenAI/Anthropic)
    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Escuta eventos do Python via Tauri
    const unlisten = await listen<ChatEvent>("chat-event", (event) => {
      const { type, content, tool_call, error: err } = event.payload

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m

          if (type === "text" && content) {
            return { ...m, content: m.content + content }
          }

          if (type === "tool_call" && tool_call) {
            const invocation: ToolInvocation = {
              toolName: tool_call.tool_name,
              toolCallId: tool_call.tool_call_id,
              state: "call",
              args: tool_call.args,
            }
            return {
              ...m,
              toolInvocations: [...(m.toolInvocations ?? []), invocation],
            }
          }

          if (type === "error" && err) {
            setError(err)
          }

          return m
        })
      )

      if (type === "done" || type === "error") {
        setIsLoading(false)
        unlisten()
      }
    })

    unlistenRef.current = unlisten

    // Invoca o command Rust que spawna o Python
    try {
      await invoke("chat", { messages: history, config })
    } catch (e) {
      setError(String(e))
      setIsLoading(false)
      unlisten()
    }
  }, [messages, isLoading, config])

  const reset = useCallback(() => {
    unlistenRef.current?.()
    setMessages([])
    setInput("")
    setIsLoading(false)
    setError(null)
  }, [])

  return { messages, input, setInput, send, isLoading, error, reset }
}


// ─── Exemplo de uso ───────────────────────────────────────────────────────────
//
// import { useGenerativeChat } from "@/hooks/useGenerativeChat"
// import { ToolRenderer } from "@/components/chat/ToolRenderer"
//
// const config = {
//   provider: "anthropic",
//   model: "claude-sonnet-4-20250514",
//   api_key: import.meta.env.VITE_API_KEY,
// }
//
// // Ou para Ollama local (sem key):
// const config = {
//   provider: "ollama",
//   model: "llama3.2",
//   base_url: "http://localhost:11434/v1",
// }
//
// export function Chat() {
//   const { messages, input, setInput, send, isLoading, error } = useGenerativeChat(config)
//
//   return (
//     <div>
//       {messages.map((m) => (
//         <div key={m.id} className={m.role}>
//           {m.content}
//           {m.toolInvocations?.map((t) => (
//             <ToolRenderer key={t.toolCallId} invocation={t} />
//           ))}
//         </div>
//       ))}
//       {error && <p className="error">{error}</p>}
//       <input
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && send(input)}
//         disabled={isLoading}
//       />
//       <button onClick={() => send(input)} disabled={isLoading}>
//         {isLoading ? "..." : "Enviar"}
//       </button>
//     </div>
//   )
// }
