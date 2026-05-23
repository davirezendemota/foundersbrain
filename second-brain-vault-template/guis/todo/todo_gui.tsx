#!/usr/bin/env bun
/**
 * Terminal GUI for browsing and editing TODO.md files across workspaces.
 * Usage: bun todo_gui.tsx
 */
import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, relative, basename } from "path";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const WORKSPACES_ROOT = join(REPO_ROOT, "workspaces");
const SKIP = new Set([".git", "node_modules", "venv", ".cursor", "volumes"]);
const LIST_HEIGHT = 16;

// ── Helpers ───────────────────────────────────────────────────────────────────

function findTodoFiles(root: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (SKIP.has(e.name as string)) continue;
      const full = join(dir, e.name as string);
      if (e.isDirectory()) walk(full);
      else if (e.name === "TODO.md") results.push(full);
    }
  }
  walk(root);
  return results.sort();
}

function getDirectorySuggestions(input: string, root: string = REPO_ROOT): string[] {
  const lastSlash = input.lastIndexOf("/");
  const parentRel = lastSlash >= 0 ? input.slice(0, lastSlash + 1) : "";
  const partial = lastSlash >= 0 ? input.slice(lastSlash + 1) : input;
  const parentAbs = join(root, parentRel);
  try {
    return readdirSync(parentAbs, { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() &&
          !SKIP.has(e.name as string) &&
          (partial === "" ||
            (e.name as string).toLowerCase().startsWith(partial.toLowerCase()))
      )
      .map((e) => parentRel + (e.name as string) + "/")
      .slice(0, 8);
  } catch {
    return [];
  }
}

type LineType = "task-open" | "task-done" | "heading" | "other";

interface ParsedLine {
  type: LineType;
  text: string;
  raw: string;
  lineIndex: number;
}

function parseLine(raw: string, lineIndex: number): ParsedLine {
  const m = raw.match(/^- \[([ x])\] (.+)$/);
  if (m) return { type: m[1] === "x" ? "task-done" : "task-open", text: m[2], raw, lineIndex };
  if (raw.startsWith("#")) return { type: "heading", text: raw, raw, lineIndex };
  return { type: "other", text: raw, raw, lineIndex };
}

function readParsedLines(path: string): ParsedLine[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((raw, lineIndex) => parseLine(raw, lineIndex))
    .filter((l) => l.raw.trim());
}

// ── File Select ───────────────────────────────────────────────────────────────

function FileSelect({
  onSelect,
  onNew,
}: {
  onSelect: (f: string) => void;
  onNew: () => void;
}) {
  const { exit } = useApp();
  const [files] = useState(() => findTodoFiles(REPO_ROOT));
  const [cursor, setCursor] = useState(0);
  const [scroll, setScroll] = useState(0);

  useInput((input, key) => {
    if (input === "q") { exit(); return; }
    if (input === "n") { onNew(); return; }
    if (key.upArrow) {
      setCursor((c) => {
        const next = Math.max(0, c - 1);
        setScroll((s) => Math.min(s, next));
        return next;
      });
    }
    if (key.downArrow) {
      setCursor((c) => {
        const next = Math.min(files.length - 1, c + 1);
        setScroll((s) => (next >= s + LIST_HEIGHT ? next - LIST_HEIGHT + 1 : s));
        return next;
      });
    }
    if (key.return && files[cursor]) onSelect(files[cursor]);
  });

  const visible = files.slice(scroll, scroll + LIST_HEIGHT);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color="cyan">TODO Manager</Text>
        <Text color="gray">↑↓ navegar  ·  Enter abrir  ·  n nova  ·  q sair</Text>
      </Box>
      <Box flexDirection="column" borderStyle="round" borderColor="blueBright" paddingX={1}>
        {files.length === 0 ? (
          <Text color="gray">  Nenhum TODO.md encontrado.</Text>
        ) : (
          visible.map((f, i) => {
            const idx = scroll + i;
            const sel = idx === cursor;
            return (
              <Text key={f} color={sel ? "blueBright" : "white"} bold={sel}>
                {sel ? " › " : "   "}{relative(REPO_ROOT, f)}
              </Text>
            );
          })
        )}
      </Box>
      {files.length > LIST_HEIGHT && (
        <Text color="gray" dimColor>
          {" "}{scroll + 1}–{Math.min(scroll + LIST_HEIGHT, files.length)} de {files.length}
        </Text>
      )}
    </Box>
  );
}

// ── New Todo Screen ───────────────────────────────────────────────────────────

function NewTodoScreen({
  onCreated,
  onCancel,
}: {
  onCreated: (path: string) => void;
  onCancel: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    getDirectorySuggestions("", WORKSPACES_ROOT)
  );
  const [suggHighlight, setSuggHighlight] = useState(-1);
  const [error, setError] = useState("");

  useEffect(() => {
    setSuggestions(getDirectorySuggestions(inputValue, WORKSPACES_ROOT));
    setSuggHighlight(-1);
  }, [inputValue]);

  const handleChange = (val: string) => {
    setInputValue(val);
    setError("");
  };

  const createTodo = useCallback(
    (pathInput: string) => {
      const dirRel = pathInput.trim().replace(/\/$/, "");
      if (!dirRel) { setError("Digite o caminho da pasta."); return; }
      const dirAbs = join(WORKSPACES_ROOT, dirRel);
      const todoPath = join(dirAbs, "TODO.md");
      if (!existsSync(dirAbs)) { setError(`Pasta não encontrada: workspaces/${dirRel}`); return; }
      if (!existsSync(todoPath)) {
        writeFileSync(todoPath, `# TODO — ${basename(dirAbs)}\n\n`);
      }
      onCreated(todoPath);
    },
    [onCreated]
  );

  useInput((_input, key) => {
    if (key.escape) { onCancel(); return; }
    if (key.upArrow) setSuggHighlight((h) => Math.max(-1, h - 1));
    if (key.downArrow && suggestions.length > 0) {
      setSuggHighlight((h) => Math.min(suggestions.length - 1, h + 1));
    }
    if (key.tab) {
      const target =
        suggHighlight >= 0 ? suggestions[suggHighlight] : suggestions[0];
      if (target) setInputValue(target);
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color="cyan">TODO Manager</Text>
        <Text color="gray">↑↓ sugestões  ·  Tab completar  ·  Enter criar  ·  Esc cancelar</Text>
      </Box>
      <Text bold color="white">Nova TODO.md</Text>
      <Box marginTop={1} borderStyle="round" borderColor="green" paddingX={1}>
        <Text color="green" dimColor>~/workspaces/  </Text>
        <TextInput
          value={inputValue}
          onChange={handleChange}
          onSubmit={createTodo}
          focus={true}
          placeholder="caminho/da/pasta/"
        />
      </Box>
      {error ? (
        <Text color="red">{" "}{error}</Text>
      ) : (
        <Text color="gray" dimColor>{" "}relativo a {WORKSPACES_ROOT}</Text>
      )}
      {suggestions.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={suggHighlight >= 0 ? "blueBright" : "gray"}
          paddingX={1}
          marginTop={1}
        >
          {suggestions.map((s, i) => (
            <Text
              key={s}
              color={i === suggHighlight ? "white" : "gray"}
              backgroundColor={i === suggHighlight ? "blue" : undefined}
            >
              {i === suggHighlight ? " › " : "   "}{s}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Task View ─────────────────────────────────────────────────────────────────

function TaskView({ filePath, onBack }: { filePath: string; onBack: () => void }) {
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [cursor, setCursor] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [inputMode, setInputMode] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const reload = useCallback(() => {
    setLines(() => {
      const parsed = readParsedLines(filePath);
      setCursor((c) => Math.min(c, Math.max(0, parsed.length - 1)));
      return parsed;
    });
  }, [filePath]);

  useEffect(() => { reload(); }, [reload]);

  // keep cursor in view
  useEffect(() => {
    setScroll((s) => {
      if (cursor < s) return cursor;
      if (cursor >= s + LIST_HEIGHT) return cursor - LIST_HEIGHT + 1;
      return s;
    });
  }, [cursor]);

  const toggleTask = useCallback(() => {
    setLines((current) => {
      const line = current[cursor];
      if (line?.type !== "task-open" && line?.type !== "task-done") return current;
      const fileLines = readFileSync(filePath, "utf8").split("\n");
      if (line.type === "task-open") {
        fileLines[line.lineIndex] = fileLines[line.lineIndex].replace("- [ ]", "- [x]");
      } else {
        fileLines[line.lineIndex] = fileLines[line.lineIndex].replace("- [x]", "- [ ]");
      }
      writeFileSync(filePath, fileLines.join("\n"));
      return readParsedLines(filePath);
    });
  }, [filePath, cursor]);

  const confirmDelete = useCallback(() => {
    setLines((current) => {
      const line = current[cursor];
      if (!line) return current;
      const fileLines = readFileSync(filePath, "utf8").split("\n");
      fileLines.splice(line.lineIndex, 1);
      writeFileSync(filePath, fileLines.join("\n"));
      const parsed = readParsedLines(filePath);
      setCursor((c) => Math.min(c, Math.max(0, parsed.length - 1)));
      return parsed;
    });
    setPendingDelete(false);
  }, [filePath, cursor]);

  const handleSubmit = (value: string) => {
    const text = value.trim();
    setInputValue("");
    setInputMode(false);
    if (!text) return;
    let content = readFileSync(filePath, "utf8");
    if (!content.endsWith("\n")) content += "\n";
    writeFileSync(filePath, content + `- [ ] ${text}\n`);
    reload();
  };

  useInput((input, key) => {
    if (inputMode) {
      if (key.escape) { setInputValue(""); setInputMode(false); }
      return;
    }
    if (key.escape) {
      if (pendingDelete) { setPendingDelete(false); return; }
      onBack();
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
      setPendingDelete(false);
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(lines.length - 1, c + 1));
      setPendingDelete(false);
    }
    if (input === "x") { toggleTask(); setPendingDelete(false); }
    if (input === "d") {
      if (pendingDelete) { confirmDelete(); }
      else { setPendingDelete(true); }
    }
    if (input === "a" || key.return) { setPendingDelete(false); setInputMode(true); }
  });

  const visible = lines.slice(scroll, scroll + LIST_HEIGHT);

  const hint = inputMode
    ? "Enter adicionar  ·  Esc cancelar"
    : pendingDelete
    ? "d confirmar exclusão  ·  Esc cancelar"
    : "↑↓ navegar  ·  x toggle  ·  d deletar  ·  a nova tarefa  ·  Esc voltar";

  const hintColor = inputMode ? "green" : pendingDelete ? "red" : "gray";

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1} gap={2}>
        <Text bold color="cyan">TODO Manager</Text>
        <Text color={hintColor} bold={pendingDelete}>{hint}</Text>
      </Box>
      <Text color="gray" dimColor>{" "}{relative(REPO_ROOT, filePath)}</Text>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={pendingDelete ? "red" : "blueBright"}
        paddingX={1}
        marginTop={1}
        minHeight={LIST_HEIGHT + 2}
      >
        {visible.map((line, i) => {
          const idx = scroll + i;
          const sel = idx === cursor && !inputMode;
          const delSel = sel && pendingDelete;
          const prefix = sel ? " › " : "   ";
          const bg = delSel ? "red" : sel ? "blue" : undefined;

          if (line.type === "heading") {
            return (
              <Box key={i}>
                <Text bold color={sel ? "white" : "yellow"} backgroundColor={bg}>
                  {prefix}{line.text}
                </Text>
              </Box>
            );
          }
          if (line.type === "task-open") {
            return (
              <Box key={i}>
                <Text color={sel ? "white" : undefined} backgroundColor={bg}>
                  {prefix}{"○  "}{line.text}
                </Text>
              </Box>
            );
          }
          if (line.type === "task-done") {
            return (
              <Box key={i}>
                <Text color={sel ? "white" : "gray"} dimColor={!sel} backgroundColor={bg}>
                  {prefix}{"✓  "}<Text strikethrough={!sel}>{line.text}</Text>
                </Text>
              </Box>
            );
          }
          return (
            <Box key={i}>
              <Text color={sel ? "white" : "gray"} backgroundColor={bg}>
                {prefix}{line.text}
              </Text>
            </Box>
          );
        })}
      </Box>
      {lines.length > LIST_HEIGHT && (
        <Text color="gray" dimColor>
          {" "}{scroll + 1}–{Math.min(scroll + LIST_HEIGHT, lines.length)} de {lines.length}
        </Text>
      )}
      <Box marginTop={1} borderStyle="round" borderColor={inputMode ? "green" : "gray"} paddingX={1}>
        <Text color={inputMode ? "green" : "gray"} bold>+{"  "}</Text>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          focus={inputMode}
          placeholder={inputMode ? "Nova tarefa…" : "a ou Enter para adicionar"}
        />
      </Box>
    </Box>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  if (selected) {
    return <TaskView filePath={selected} onBack={() => setSelected(null)} />;
  }
  if (creatingNew) {
    return (
      <NewTodoScreen
        onCreated={(path) => { setCreatingNew(false); setSelected(path); }}
        onCancel={() => setCreatingNew(false)}
      />
    );
  }
  return <FileSelect onSelect={setSelected} onNew={() => setCreatingNew(true)} />;
}

render(<App />);
