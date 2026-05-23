#!/usr/bin/env bun
/**
 * Second Brain — launcher principal.
 * Dashboard + navegador de features + gerenciador de terminais.
 *
 * Usage: bun main.tsx
 */
import React, { useState } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import { AsciiArtHeader } from "./AsciiArtHeader";
import { spawnSync } from "child_process";
import { join } from "path";

const REPO_ROOT  = join(import.meta.dir, "..", "..");
const GUIS_DIR   = join(REPO_ROOT, "second-brain", "guis");
const DASHBOARD  = join(import.meta.dir, "..", "..", "scripts", "os", "dashboard", "target", "release", "dashboard");

const USE_AGENT_USERS = process.env.SB_USE_AGENT_USERS === "1";

function claudeLaunchCommand(): string[] {
  if (USE_AGENT_USERS) {
    return [join(REPO_ROOT, "scripts", "os", "agent-users", "run-as-claude.sh")];
  }
  return ["claude"];
}

function cursorLaunchCommand(): string[] {
  if (USE_AGENT_USERS) {
    return [join(REPO_ROOT, "scripts", "os", "agent-users", "run-as-cursor.sh"), "agent"];
  }
  return ["cursor", "agent"];
}

// ── Data collection ───────────────────────────────────────────────────────────

function runWidget(subcmd: string, args: string[] = []): Record<string, unknown> {
  const result = spawnSync(DASHBOARD, [subcmd, ...args], {
    encoding: "utf8",
    timeout: 5000,
  });
  try {
    return JSON.parse(result.stdout ?? "{}");
  } catch {
    return {};
  }
}

const claude  = runWidget("claude-usage")                          as { prompts_today?: number; sessions_today?: number };
const cursor  = runWidget("cursor-usage")                          as { conversations?: number };
const os_info = runWidget("os-info")                               as { date?: string; weekday?: string; cpu_percent?: number; mem_used_gb?: number; mem_total_gb?: number };
const todos   = runWidget("todos-count", ["--root", REPO_ROOT])    as { pending?: number; done?: number; files?: number };
const agentData = runWidget("agent-tokens", ["--root", REPO_ROOT]) as {
  agents?: Array<{ agent: string; input_tokens: number; output_tokens: number; total_tokens: number; percent: number }>;
  total_today?: number;
};

// ── Menu Items ────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  type: "gui" | "terminal-new" | "terminal-existing";
  name: string;
  description?: string;
  emoji: string;
  command?: string[];
  cwd?: string;
  sessionName?: string;
}

function getTmuxSessions(): Array<{ name: string; windowCount: number }> {
  const result = spawnSync("tmux", ["list-sessions", "-F", "#{session_name}:#{session_windows}"], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) return [];
  return result.stdout
    .trim()
    .split("\n")
    .filter(line => line)
    .map(line => {
      const [name, windowCount] = line.split(":");
      return { name, windowCount: parseInt(windowCount) || 0 };
    });
}

function buildMenuItems(): MenuItem[] {
  const items: MenuItem[] = [];

  // GUIs section
  items.push({
    id: "gui-todo",
    type: "gui",
    name: "TODO Manager",
    description: "Navegar e editar arquivos TODO.md nos workspaces",
    emoji: "✅",
    command: ["bun", "todo_gui.tsx"],
    cwd: join(GUIS_DIR, "todo"),
  });

  // Terminais section
  items.push({
    id: "terminal-new",
    type: "terminal-new",
    name: "novo terminal",
    description: "Criar uma nova sessão tmux",
    emoji: "➕",
  });

  const sessions = getTmuxSessions();
  sessions.forEach(session => {
    items.push({
      id: `terminal-${session.name}`,
      type: "terminal-existing",
      name: session.name,
      description: `${session.windowCount} janela${session.windowCount !== 1 ? "s" : ""}`,
      emoji: "•",
      sessionName: session.name,
    });
  });

  return items;
}

let selectedItem: MenuItem | null = null;

/** Set when Enter is pressed on dashboard rows (handled in runApp). */
let pendingDashboardLaunch: "claude" | "cursor" | null = null;

/** First N focus indices are Claude (0) and Cursor (1) in the dashboard; then menu items. */
const DASHBOARD_FOCUS_ROWS = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTok(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function shortenModel(name: string): string {
  const m = name.match(/claude-(\w+)-\d/);
  if (m) return m[1];
  return name.toLowerCase().split("-")[0];
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard(props: { claudeFocused: boolean; cursorFocused: boolean }) {
  const { claudeFocused, cursorFocused } = props;
  const pendingTodos = todos.pending ?? 0;
  const todoFiles    = todos.files   ?? 0;
  const todosColor   = pendingTodos > 10 ? "yellow" : pendingTodos > 0 ? "white" : "green";

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={2}
      paddingY={0}
      marginBottom={1}
    >
      {/* Date row */}
      <Box justifyContent="space-between" marginBottom={0}>
        <Text bold color="white">
          {os_info.date ?? "—"}
        </Text>
        <Text color="gray">{os_info.weekday ?? ""}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} gap={0}>
        {/* Claude */}
        {(() => {
          const BAR_WIDTH = 16;
          const COLORS = ["magenta", "cyan", "yellow", "green", "blue", "red"] as const;
          const agents = (agentData.agents ?? []).slice(0, 6);
          let usedWidth = 0;
          const segs = agents.map((a, i) => {
            const w = i < agents.length - 1
              ? Math.round(a.percent / 100 * BAR_WIDTH)
              : BAR_WIDTH - usedWidth;
            usedWidth += w;
            return { width: Math.max(0, w), color: COLORS[i % COLORS.length], agent: a.agent, percent: a.percent };
          });
          return (
            <Box gap={2}>
              <Box width={2}>
                <Text color={claudeFocused ? "blueBright" : "magenta"} bold={claudeFocused}>
                  {claudeFocused ? "›" : " "}
                </Text>
              </Box>
              <Text color={claudeFocused ? "blueBright" : "magenta"} bold>Claude</Text>
              <Box flexGrow={1} flexDirection="column" gap={0}>
                <Box justifyContent="space-between" alignItems="flex-start">
                  <Text>
                    <Text bold>{claude.prompts_today ?? "—"}</Text>
                    <Text color="gray"> prompts  ·  </Text>
                    <Text bold>{claude.sessions_today ?? "—"}</Text>
                    <Text color="gray"> sessões hoje</Text>
                  </Text>
                  {segs.length > 0 && (
                    <Box flexDirection="row" alignItems="center" gap={2} flexWrap="wrap" justifyContent="flex-end">
                      <Box>
                        {segs.map((s, i) => (
                          <Text key={i} color={s.color}>{"█".repeat(s.width)}</Text>
                        ))}
                      </Box>
                      <Text color="gray">{fmtTok(agentData.total_today ?? 0)}</Text>
                      {segs.map((s, i) => (
                        <Box key={i} gap={0}>
                          <Text color={s.color}>■ </Text>
                          <Text color="gray">{s.percent.toFixed(1)}% </Text>
                          <Text dimColor>{shortenModel(s.agent)}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })()}

        {/* Cursor */}
        <Box gap={2}>
          <Box width={2}>
            <Text color={cursorFocused ? "blueBright" : "cyan"} bold={cursorFocused}>
              {cursorFocused ? "›" : " "}
            </Text>
          </Box>
          <Text color={cursorFocused ? "blueBright" : "cyan"} bold>Cursor</Text>
          <Text>
            <Text bold>{cursor.conversations ?? "—"}</Text>
            <Text color="gray"> conversas totais</Text>
          </Text>
        </Box>

        {/* TODOs */}
        <Box gap={2}>
          <Text color={todosColor} bold>TODOs </Text>
          <Text color={todosColor}>
            <Text bold>{pendingTodos}</Text>
            <Text color="gray"> pendentes em </Text>
            <Text bold>{todoFiles}</Text>
            <Text color="gray"> arquivo{todoFiles !== 1 ? "s" : ""}</Text>
          </Text>
        </Box>

        {/* System (optional — only if psutil available) */}
        {os_info.cpu_percent !== undefined && (
          <Box gap={2}>
            <Text color="gray" bold>Sistema</Text>
            <Text color="gray">
              CPU <Text>{os_info.cpu_percent}%</Text>
              {"  "}RAM <Text>{os_info.mem_used_gb}/{os_info.mem_total_gb} GB</Text>
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Menu ──────────────────────────────────────────────────────────────────────

function killTmuxSession(sessionName: string): boolean {
  const r = spawnSync("tmux", ["kill-session", "-t", sessionName], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return r.status === 0;
}

function Menu() {
  const { exit } = useApp();
  const [, setMenuTick] = useState(0);
  const items = buildMenuItems();
  const totalFocus = DASHBOARD_FOCUS_ROWS + items.length;
  /** 0 = Claude, 1 = Cursor, 2+ = menu. Default first menu row (TODO Manager). */
  const [focusIdx, setFocusIdx] = useState(DASHBOARD_FOCUS_ROWS);
  /** Sessão tmux aguardando [y] para encerrar (cancelar: [n], [Esc], [d] de novo, ou ↑↓). */
  const [pendingDeleteSession, setPendingDeleteSession] = useState<string | null>(null);

  useInput((input, key) => {
    const menuIdx = focusIdx - DASHBOARD_FOCUS_ROWS;
    const focusedMenuItem = menuIdx >= 0 ? items[menuIdx] : undefined;

    if (key.upArrow) {
      setPendingDeleteSession(null);
      setFocusIdx((c) => Math.max(0, c - 1));
      return;
    }
    if (key.downArrow) {
      setPendingDeleteSession(null);
      setFocusIdx((c) => Math.min(totalFocus - 1, c + 1));
      return;
    }

    if (pendingDeleteSession) {
      if (key.escape) {
        setPendingDeleteSession(null);
        return;
      }
      if (input === "y" || input === "Y") {
        if (!killTmuxSession(pendingDeleteSession)) {
          setPendingDeleteSession(null);
          return;
        }
        const killedIdx = items.findIndex(
          (it) => it.type === "terminal-existing" && it.sessionName === pendingDeleteSession
        );
        const idxAfterKill = killedIdx >= 0 ? killedIdx : menuIdx;
        setPendingDeleteSession(null);
        const newLen = buildMenuItems().length;
        setFocusIdx(DASHBOARD_FOCUS_ROWS + Math.max(0, Math.min(idxAfterKill, newLen - 1)));
        setMenuTick((t) => t + 1);
        return;
      }
      if (input === "n" || input === "N") {
        setPendingDeleteSession(null);
        return;
      }
    }

    if (key.escape) {
      exit();
      return;
    }

    if (
      (input === "d" || input === "D") &&
      focusedMenuItem?.type === "terminal-existing" &&
      focusedMenuItem.sessionName
    ) {
      if (pendingDeleteSession === focusedMenuItem.sessionName) {
        setPendingDeleteSession(null);
      } else {
        setPendingDeleteSession(focusedMenuItem.sessionName);
      }
      return;
    }

    if (key.return && pendingDeleteSession) return;

    if (key.return) {
      if (focusIdx === 0) {
        pendingDashboardLaunch = "claude";
        selectedItem = null;
      } else if (focusIdx === 1) {
        pendingDashboardLaunch = "cursor";
        selectedItem = null;
      } else {
        pendingDashboardLaunch = null;
        selectedItem = items[focusIdx - DASHBOARD_FOCUS_ROWS];
      }
      exit();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <AsciiArtHeader />

      {/* Navigation hints */}
      <Box marginBottom={1} justifyContent="center">
        <Text color="gray">↑↓ Claude · Cursor · menu  ·  Enter = abrir  ·  [d] excluir sessão tmux (pede confirmação: [y] sim · [n]/[Esc] cancelar)  ·  [Esc sair]  ·  tmux Ctrl+b: [s switch] [d detach] [w windows] [? help] [| split right] [- split down] [hjkl panes]</Text>
      </Box>

      {/* Dashboard */}
      <Dashboard claudeFocused={focusIdx === 0} cursorFocused={focusIdx === 1} />

      {pendingDeleteSession && (
        <Box marginBottom={1} paddingX={1}>
          <Text color="yellow" bold>
            Excluir sessão &quot;{pendingDeleteSession}&quot;? [y] sim  ·  [n] ou [Esc] cancelar  ·  [d] de novo na linha cancela
          </Text>
        </Box>
      )}

      {/* Menu items: grupo GUIs separado de Terminais */}
      <Box flexDirection="column" borderStyle="round" borderColor="blueBright" paddingX={1} paddingY={1}>
        {items.map((item, i) => {
          const sel = focusIdx === i + DASHBOARD_FOCUS_ROWS;
          const showGuiGroup = i === 0 && item.type === "gui";
          const showTerminalGroup = item.id === "terminal-new";
          const confirmingThis =
            item.type === "terminal-existing" &&
            item.sessionName &&
            pendingDeleteSession === item.sessionName &&
            sel;

          return (
            <Box key={`${item.id}-${i}`} flexDirection="column" marginBottom={i < items.length - 1 ? 1 : 0}>
              {showGuiGroup && (
                <Box marginBottom={1}>
                  <Text bold color="blueBright">GUIs</Text>
                </Box>
              )}
              {showTerminalGroup && (
                <Box marginBottom={1} marginTop={showGuiGroup ? 0 : 1}>
                  <Text bold color="blueBright">Terminais</Text>
                </Box>
              )}
              <Box gap={1}>
                <Text color={sel ? "blueBright" : "white"} bold={sel}>
                  {sel ? "›" : " "}
                </Text>
                <Text color={sel ? "blueBright" : "white"} bold={sel}>
                  {item.emoji}  {item.name}
                </Text>
              </Box>
              {item.description && (
                <Text color="gray" dimColor>
                  {"     "}{item.description}
                </Text>
              )}
              {item.type === "terminal-existing" && sel && !confirmingThis && (
                <Text color="gray" dimColor>
                  {"     "}[d] pedir exclusão desta sessão
                </Text>
              )}
              {confirmingThis && (
                <Text color="yellow">
                  {"     "}[y] confirmar exclusão  ·  [n]/[Esc] cancelar  ·  [d] cancelar
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {items.length} item{items.length !== 1 ? "s" : ""} disponível{items.length !== 1 ? "s" : ""}
        </Text>
      </Box>
    </Box>
  );
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleGuiSelection(item: MenuItem) {
  if (item.type === "gui" && item.command && item.cwd) {
    spawnSync(item.command[0], item.command.slice(1), { stdio: "inherit", cwd: item.cwd });
  }
}

function tmuxConfPath(): string {
  return join(import.meta.dir, "tmux", "tmux.conf");
}

function attachTmuxSession(sessionName: string) {
  const conf = tmuxConfPath();
  spawnSync("tmux", ["source-file", conf], { stdio: "inherit" });
  spawnSync("tmux", ["-f", conf, "attach-session", "-t", sessionName], { stdio: "inherit" });
}

function handleTerminalNew() {
  const sessionName = `sb-${Date.now()}`;
  const conf = tmuxConfPath();
  spawnSync("tmux", ["-f", conf, "new-session", "-d", "-s", sessionName, "-c", REPO_ROOT], { stdio: "inherit" });
  attachTmuxSession(sessionName);
}

function handleTerminalWithCommand(sessionPrefix: string, command: string[]) {
  const sessionName = `${sessionPrefix}-${Date.now()}`;
  const conf = tmuxConfPath();
  spawnSync("tmux", ["-f", conf, "new-session", "-d", "-s", sessionName, "-c", REPO_ROOT, ...command], { stdio: "inherit" });
  attachTmuxSession(sessionName);
}

function handleDashboardClaude() {
  handleTerminalWithCommand("claude", claudeLaunchCommand());
}

function handleDashboardCursorAgent() {
  handleTerminalWithCommand("cursor", cursorLaunchCommand());
}

function handleTerminalExisting(sessionName: string) {
  attachTmuxSession(sessionName);
}

// ── Entry ─────────────────────────────────────────────────────────────────────

async function runApp() {
  while (true) {
    selectedItem = null;
    pendingDashboardLaunch = null;
    const { waitUntilExit } = render(<Menu />);
    await waitUntilExit();

    if (pendingDashboardLaunch === "claude") {
      handleDashboardClaude();
      continue;
    }
    if (pendingDashboardLaunch === "cursor") {
      handleDashboardCursorAgent();
      continue;
    }

    if (!selectedItem) break;

    if (selectedItem.type === "gui") {
      handleGuiSelection(selectedItem);
    } else if (selectedItem.type === "terminal-new") {
      handleTerminalNew();
    } else if (selectedItem.type === "terminal-existing") {
      handleTerminalExisting(selectedItem.sessionName!);
    }
  }
}

await runApp();
