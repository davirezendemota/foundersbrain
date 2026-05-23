# Slash Commands no Chat

## Context
O chat da second-brain-app precisa de uma feature de slash commands: ao digitar `/` no textarea, um popup deve aparecer listando os comandos disponíveis. O único comando built-in é `/add-command`, que abre um editor inline para o usuário criar comandos personalizados com uma chave e um prompt. Comandos personalizados são persistidos em localStorage e, quando selecionados no popup, seu prompt substitui o conteúdo do textarea.

## Arquivo crítico
`second-brain-app/frontend/src/components/HomeContent.tsx` — único arquivo a modificar.

---

## Implementação

### 1. Novo tipo e constante
```ts
interface CustomCommand { key: string; prompt: string; }

const BUILTIN_COMMANDS = [
  { key: 'add-command', description: 'Criar comando personalizado' },
];
```

### 2. Novos estados (dentro de HomeContent)
```ts
const [customCommands, setCustomCommands] = useState<CustomCommand[]>([]);
const [slashMenuOpen, setSlashMenuOpen] = useState(false);
const [slashQuery, setSlashQuery] = useState('');
const [slashMenuIndex, setSlashMenuIndex] = useState(0);
const [addCommandEditorOpen, setAddCommandEditorOpen] = useState(false);
const [newCommandKey, setNewCommandKey] = useState('');
const [newCommandPrompt, setNewCommandPrompt] = useState('');
```

### 3. Persistência em localStorage
- `useEffect` on mount: carrega `slash_commands` do localStorage → `setCustomCommands`
- `useEffect` on `customCommands`: salva no localStorage

### 4. Lógica do textarea `onChange`
```ts
function handleDraftChange(value: string) {
  setDraft(value);
  if (value.startsWith('/')) {
    setSlashQuery(value.slice(1));
    setSlashMenuOpen(true);
    setSlashMenuIndex(0);
  } else {
    setSlashMenuOpen(false);
  }
}
```

### 5. Filtro dos comandos no popup
```ts
const filteredCommands = useMemo(() => {
  const q = slashQuery.toLowerCase();
  const builtins = BUILTIN_COMMANDS.filter(c => c.key.includes(q));
  const customs = customCommands
    .filter(c => c.key.includes(q))
    .map(c => ({ key: c.key, description: c.prompt.slice(0, 60) }));
  return [...builtins, ...customs];
}, [slashQuery, customCommands]);
```

### 6. Seleção de comando
```ts
function selectCommand(key: string) {
  setSlashMenuOpen(false);
  if (key === 'add-command') {
    setDraft('');
    setNewCommandKey('');
    setNewCommandPrompt('');
    setAddCommandEditorOpen(true);
  } else {
    const cmd = customCommands.find(c => c.key === key);
    if (cmd) setDraft(cmd.prompt);
  }
}
```

### 7. Salvar novo comando
```ts
function saveNewCommand() {
  const key = newCommandKey.trim().replace(/^\//, '').replace(/\s+/g, '-');
  if (!key || !newCommandPrompt.trim()) return;
  setCustomCommands(prev => {
    const filtered = prev.filter(c => c.key !== key);
    return [...filtered, { key, prompt: newCommandPrompt.trim() }];
  });
  setAddCommandEditorOpen(false);
}
```

### 8. Navegação por teclado no popup
No `onKeyDown` do textarea, adicionar tratamento de `ArrowUp`, `ArrowDown`, `Enter` e `Escape` quando `slashMenuOpen` estiver ativo, usando `slashMenuIndex` para rastrear a seleção.

---

## UI

### Popup de slash commands
- Posição: `absolute bottom-full left-0 mb-2` dentro do `div.relative` do compositor
- Lista de itens: `/key` em destaque (fg-primary) + descrição abreviada em muted
- Item selecionado com `bg-[var(--bg-elevated)]`
- Renderizado apenas quando `slashMenuOpen && filteredCommands.length > 0`

### Editor de add-command
- Renderizado como painel condicional **entre a lista de mensagens e o formulário** (`shrink-0`, com `border-t`)
- Linha superior: label "Novo comando" + campo input para a chave (ex: `summarize`)
- Área inferior: textarea para o prompt do comando
- Rodapé: botões "Salvar" (primary) + "Cancelar" (secondary)
- Controlado por `addCommandEditorOpen`

---

## Verificação
1. `pnpm dev` no diretório `second-brain-app/frontend`
2. Digitar `/` no textarea → popup deve aparecer com "add-command"
3. Digitar `/add` → lista filtra para "add-command"
4. Selecionar → editor aparece acima do compositor
5. Preencher chave (`teste`) e prompt (`Resuma o seguinte texto:`) → Salvar
6. Digitar `/teste` → popup mostra o comando criado
7. Selecionar → draft recebe o prompt salvo
8. Recarregar → comandos persistem via localStorage
