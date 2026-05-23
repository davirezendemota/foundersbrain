mod shell;

use chrono::Local;
use std::fs::OpenOptions;
use std::io::{self, Write};
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{self, Command};
use std::{env, fs};

const RELEASES_URL: &str = "https://github.com/davirezendemota/second-brain-cli/releases/latest/download";

// ---------------------------------------------------------------------------
// Repo root discovery
// ---------------------------------------------------------------------------

fn find_repo_root() -> Option<PathBuf> {
    let mut dir = env::current_dir().ok()?;
    loop {
        if dir.join("second-brain.yaml").exists() {
            return Some(dir);
        }
        if !dir.pop() {
            return None;
        }
    }
}

fn require_repo_root() -> PathBuf {
    find_repo_root().unwrap_or_else(|| {
        eprintln!("Erro: não está dentro de um vault second-brain.");
        eprintln!("Entre na pasta do vault ou crie um novo com: sb --setup");
        process::exit(1);
    })
}

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

fn load_env(root: &Path) {
    let env_file = root.join("scripts/os/.env");
    if !env_file.exists() {
        return;
    }
    let Ok(content) = fs::read_to_string(env_file) else {
        return;
    };
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((key, val)) = line.split_once('=') {
            let key = key.trim();
            let val = val.trim().trim_matches('"').trim_matches('\'');
            if env::var(key).is_err() {
                env::set_var(key, val);
            }
        }
    }
    if let Ok(cursor_path) = env::var("PATH_CURSOR_APP") {
        if Path::new(&cursor_path).is_dir() {
            let current = env::var("PATH").unwrap_or_default();
            env::set_var("PATH", format!("{}:{}", cursor_path, current));
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn is_executable(path: &Path) -> bool {
    fs::metadata(path)
        .map(|m| m.permissions().mode() & 0o111 != 0)
        .unwrap_or(false)
}

fn find_in_path(name: &str) -> Option<PathBuf> {
    env::var("PATH").ok()?.split(':').find_map(|dir| {
        let p = PathBuf::from(dir).join(name);
        if is_executable(&p) { Some(p) } else { None }
    })
}

fn have(cmd: &str) -> bool {
    find_in_path(cmd).is_some()
}

fn run(program: &str, args: &[&str]) -> bool {
    Command::new(program)
        .args(args)
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn run_sh(script: &str) -> bool {
    Command::new("sh")
        .args(["-c", script])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn log(msg: &str) {
    println!("\x1b[0;34m[second-brain]\x1b[0m {msg}");
}

fn warn(msg: &str) {
    eprintln!("\x1b[1;33m[second-brain]\x1b[0m {msg}");
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

fn resolve_bun() -> Option<PathBuf> {
    if let Ok(val) = env::var("BUN_EXE") {
        let p = PathBuf::from(&val);
        if is_executable(&p) {
            return Some(p);
        }
    }
    if let Some(p) = find_in_path("bun") {
        return Some(p);
    }
    if let Ok(home) = env::var("HOME") {
        let p = PathBuf::from(home).join(".bun/bin/bun");
        if is_executable(&p) {
            return Some(p);
        }
    }
    None
}

// ---------------------------------------------------------------------------
// Setup — macOS
// ---------------------------------------------------------------------------

fn setup_macos() {
    log("Sistema detectado: macOS");

    // Homebrew
    if !have("brew") {
        log("Instalando Homebrew…");
        run_sh(
            r#"/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)""#,
        );
        // Apple Silicon: adiciona brew ao PATH imediatamente
        let brew_path = "/opt/homebrew/bin";
        if Path::new(brew_path).exists() {
            let current = env::var("PATH").unwrap_or_default();
            env::set_var("PATH", format!("{brew_path}:{current}"));
        }
    } else {
        log("Homebrew já instalado");
    }

    // Pacotes via brew
    for pkg in &["tmux", "git"] {
        if !have(pkg) {
            log(&format!("Instalando {pkg} via brew…"));
            run("brew", &["install", pkg]);
        } else {
            log(&format!("{pkg} já instalado"));
        }
    }

    // Rust
    if !have("cargo") {
        log("Instalando Rust via rustup…");
        run_sh("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y");
        let cargo_bin = format!("{}/.cargo/bin", env::var("HOME").unwrap_or_default());
        let current = env::var("PATH").unwrap_or_default();
        env::set_var("PATH", format!("{cargo_bin}:{current}"));
    } else {
        log("Rust já instalado");
    }

    setup_common_tools();
    configure_path_macos();
}

// ---------------------------------------------------------------------------
// Setup — Linux
// ---------------------------------------------------------------------------

fn setup_linux() {
    log("Sistema detectado: Linux");

    // Pacotes apt
    log("Atualizando apt e instalando dependências…");
    run("sudo", &["apt-get", "update", "-qq"]);
    run(
        "sudo",
        &[
            "apt-get", "install", "-y",
            "tmux", "git", "zip", "unzip", "python3",
        ],
    );

    // Rust (necessário para compilar sb a partir do fonte)
    if !have("cargo") {
        log("Instalando Rust via rustup…");
        run_sh("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y");
        let cargo_bin = format!("{}/.cargo/bin", env::var("HOME").unwrap_or_default());
        let current = env::var("PATH").unwrap_or_default();
        env::set_var("PATH", format!("{cargo_bin}:{current}"));
    } else {
        log("Rust já instalado");
    }

    setup_common_tools();
    configure_path_linux();
}

// ---------------------------------------------------------------------------
// Setup — ferramentas comuns (Mac + Linux)
// ---------------------------------------------------------------------------

fn setup_common_tools() {
    // Bun
    if resolve_bun().is_none() {
        log("Instalando Bun…");
        run_sh("curl -fsSL https://bun.sh/install | bash");
        let bun_bin = format!("{}/.bun/bin", env::var("HOME").unwrap_or_default());
        let current = env::var("PATH").unwrap_or_default();
        env::set_var("PATH", format!("{bun_bin}:{current}"));
    } else {
        log("Bun já instalado");
    }

    // Claude CLI
    if !have("claude") {
        log("Instalando Claude Code CLI…");
        run_sh("curl -fsSL https://claude.ai/install.sh | bash");
        let local_bin = format!("{}/.local/bin", env::var("HOME").unwrap_or_default());
        let current = env::var("PATH").unwrap_or_default();
        env::set_var("PATH", format!("{local_bin}:{current}"));
    } else {
        log("Claude CLI já instalado");
    }

    // Cursor
    if !have("cursor") {
        log("Instalando Cursor CLI…");
        if !run_sh("curl -fsSL https://cursor.com/install | bash") {
            warn("Cursor não instalado automaticamente — instale manualmente: https://www.cursor.com/download");
        }
    } else {
        log("Cursor já instalado");
    }
}

// ---------------------------------------------------------------------------
// Configuração de PATH
// ---------------------------------------------------------------------------

fn append_to_shell_file(path: &Path, line: &str) {
    if !path.exists() {
        return;
    }
    let content = fs::read_to_string(path).unwrap_or_default();
    if content.contains(".local/bin") {
        return;
    }
    if let Ok(mut f) = OpenOptions::new().append(true).open(path) {
        let _ = writeln!(f, "\n{line}");
        log(&format!("PATH configurado em {}", path.display()));
    }
}

fn configure_path_linux() {
    let entry = r#"export PATH="$HOME/.local/bin:$HOME/.bun/bin:$HOME/.cargo/bin:$PATH""#;
    let home = PathBuf::from(env::var("HOME").unwrap_or_default());
    append_to_shell_file(&home.join(".bashrc"), entry);
    append_to_shell_file(&home.join(".zshrc"), entry);
}

fn configure_path_macos() {
    let entry =
        r#"export PATH="/opt/homebrew/bin:$HOME/.local/bin:$HOME/.bun/bin:$PATH""#;
    let home = PathBuf::from(env::var("HOME").unwrap_or_default());
    append_to_shell_file(&home.join(".zshrc"), entry);
    append_to_shell_file(&home.join(".bash_profile"), entry);
}

// ---------------------------------------------------------------------------
// Clone do repo (fresh install)
// ---------------------------------------------------------------------------

fn clone_repo_if_needed(folder_name: &str) -> PathBuf {
    // Se já estamos dentro do vault, usa a raiz existente
    if let Some(root) = find_repo_root() {
        log("Vault já presente neste diretório");
        return root;
    }

    let cwd = env::current_dir().unwrap_or_else(|_| {
        eprintln!("Erro: não foi possível obter o diretório atual.");
        process::exit(1);
    });

    let root = cwd.join(folder_name);

    if root.exists() {
        eprintln!("Erro: a pasta '{}' já existe.", root.display());
        process::exit(1);
    }

    log(&format!("Inicializando vault em {}…", root.display()));

    if !have("git") {
        eprintln!("Erro: git não encontrado. Instale git e tente novamente.");
        process::exit(1);
    }

    let repo_url = "https://github.com/davirezendemota/second-brain.git";

    let status = Command::new("git")
        .args(["clone", repo_url, root.to_str().unwrap_or(folder_name)])
        .status()
        .expect("falha ao executar git clone");

    if !status.success() {
        eprintln!("Erro: falha ao clonar o template do vault.");
        process::exit(1);
    }

    log(&format!("Vault inicializado em {}", root.display()));
    root
}

// ---------------------------------------------------------------------------
// GUI install
// ---------------------------------------------------------------------------

fn download_gui() -> bool {
    let gui_dest = cli_install_dir().join("gui");
    let url = format!("{RELEASES_URL}/gui.zip");
    let tmp_zip = cli_install_dir().join("gui.zip");
    let _ = fs::create_dir_all(cli_install_dir());

    log("Baixando GUI…");
    let downloaded = if have("curl") {
        Command::new("curl")
            .args(["-fsSL", &url, "-o", tmp_zip.to_str().unwrap_or("")])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    } else if have("wget") {
        Command::new("wget")
            .args(["-qO", tmp_zip.to_str().unwrap_or(""), &url])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    } else {
        false
    };

    if !downloaded {
        warn("Não foi possível baixar a GUI");
        return false;
    }

    let _ = fs::remove_dir_all(&gui_dest);
    let _ = fs::create_dir_all(&gui_dest);
    let ok = Command::new("unzip")
        .args(["-q", tmp_zip.to_str().unwrap_or(""), "-d", gui_dest.to_str().unwrap_or("")])
        .status()
        .map(|s| s.success())
        .unwrap_or(false);

    let _ = fs::remove_file(&tmp_zip);

    if ok {
        log(&format!("GUI instalada em {}", gui_dest.display()));
    } else {
        warn("Não foi possível extrair a GUI");
    }
    ok
}

fn install_gui() {
    let gui_dest = cli_install_dir().join("gui");

    // Dev local: se gui/main.tsx já existe perto do binário, não sobrescreve
    if let Some(existing) = resolve_main_gui_dir() {
        if existing == gui_dest {
            log("GUI já instalada");
            return;
        }
    }

    download_gui();
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------

fn release_bin_name() -> &'static str {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => "sb-aarch64-apple-darwin",
        ("macos", "x86_64")  => "sb-x86_64-apple-darwin",
        ("linux", "x86_64")  => "sb-x86_64-unknown-linux-gnu",
        ("linux", "aarch64") => "sb-aarch64-unknown-linux-gnu",
        _                    => "",
    }
}

fn cmd_update() {
    let bin_name = release_bin_name();
    if bin_name.is_empty() {
        let os = std::env::consts::OS;
        let arch = std::env::consts::ARCH;
        eprintln!("❌ Plataforma não suportada para atualização automática: {os}-{arch}");
        process::exit(1);
    }

    log(&format!("Atualizando sb {}…", env!("CARGO_PKG_VERSION")));

    let cli_dir = cli_install_dir();
    let sb_install = cli_dir.join("sb");
    let tmp_bin = cli_dir.join("sb.tmp");
    let _ = fs::create_dir_all(&cli_dir);

    let url = format!("{RELEASES_URL}/{bin_name}");
    log(&format!("Baixando {bin_name}…"));

    let downloaded = if have("curl") {
        Command::new("curl")
            .args(["-fsSL", &url, "-o", tmp_bin.to_str().unwrap_or("")])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    } else if have("wget") {
        Command::new("wget")
            .args(["-qO", tmp_bin.to_str().unwrap_or(""), &url])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    } else {
        eprintln!("❌ curl ou wget são necessários para baixar a atualização");
        process::exit(1);
    };

    if !downloaded {
        let _ = fs::remove_file(&tmp_bin);
        eprintln!("❌ Falha ao baixar atualização de {url}");
        process::exit(1);
    }

    let _ = fs::set_permissions(&tmp_bin, fs::Permissions::from_mode(0o755));

    // rename falha se src e dst estiverem em filesystems diferentes; usa copy como fallback
    if fs::rename(&tmp_bin, &sb_install).is_err() {
        if let Err(e) = fs::copy(&tmp_bin, &sb_install) {
            let _ = fs::remove_file(&tmp_bin);
            eprintln!("❌ Não foi possível substituir o binário: {e}");
            process::exit(1);
        }
        let _ = fs::set_permissions(&sb_install, fs::Permissions::from_mode(0o755));
        let _ = fs::remove_file(&tmp_bin);
    }

    log(&format!("Binário atualizado: {}", sb_install.display()));

    download_gui();

    log("✅ Atualização concluída! Reinicie o terminal se necessário.");
}

fn cmd_setup(folder_name: &str) {
    let os = std::env::consts::OS;
    match os {
        "macos" => setup_macos(),
        "linux" => setup_linux(),
        _ => {
            eprintln!("Sistema operacional não suportado: {os}");
            process::exit(1);
        }
    }

    let root = clone_repo_if_needed(folder_name);

    // Instala o binário sb em ~/.second-brain-cli/sb e cria symlink em ~/.local/bin/sb
    let cli_dir = cli_install_dir();
    let _ = fs::create_dir_all(&cli_dir);
    let sb_install = cli_dir.join("sb");
    let local_bin = PathBuf::from(env::var("HOME").unwrap_or_default()).join(".local/bin");
    let _ = fs::create_dir_all(&local_bin);
    let sb_link = local_bin.join("sb");

    if let Ok(current_exe) = env::current_exe() {
        if current_exe != sb_install {
            match fs::copy(&current_exe, &sb_install) {
                Ok(_) => {
                    let _ = fs::set_permissions(&sb_install, fs::Permissions::from_mode(0o755));
                    log(&format!("sb instalado em {}", sb_install.display()));
                    // Cria symlink em ~/.local/bin/sb → ~/.second-brain-cli/sb
                    let _ = fs::remove_file(&sb_link);
                    if let Err(e) = std::os::unix::fs::symlink(&sb_install, &sb_link) {
                        warn(&format!("Não foi possível criar symlink em ~/.local/bin/sb: {e}"));
                        // Fallback: copia direto
                        let _ = fs::copy(&sb_install, &sb_link);
                        let _ = fs::set_permissions(&sb_link, fs::Permissions::from_mode(0o755));
                    } else {
                        log(&format!("symlink criado: {} → {}", sb_link.display(), sb_install.display()));
                    }
                    // Remove o binário original após instalação bem-sucedida
                    if current_exe != sb_link {
                        if let Err(e) = fs::remove_file(&current_exe) {
                            warn(&format!(
                                "Não foi possível remover o binário original em {}: {e}",
                                current_exe.display()
                            ));
                        } else {
                            log(&format!("Binário original removido: {}", current_exe.display()));
                        }
                    }
                }
                Err(e) => warn(&format!("Não foi possível instalar sb em ~/.second-brain-cli: {e}")),
            }
        }
    }

    // Instala a GUI principal em ~/.second-brain-cli/gui/ a partir do release
    install_gui();

    // Configura PATH automaticamente no RC do shell detectado
    if let Err(e) = shell::add_to_path(&local_bin) {
        warn(&format!("Não foi possível configurar PATH automaticamente: {e}"));
        warn("Adicione manualmente ao seu RC: export PATH=\"$HOME/.local/bin:$PATH\"");
    }

    log("✅ Setup concluído!");
    log(&format!("   Repositório em:  {}", root.display()));
    log(&format!("   CLI instalado em: {}", cli_install_dir().display()));
    log("   Reinicie o terminal ou execute: source ~/.bashrc  (ou ~/.zshrc)");
}

fn cmd_check(root: &Path) {
    let script = root.join("scripts/os/setup-dependencies.sh");
    let status = Command::new("bash")
        .arg(script)
        .status()
        .unwrap_or_else(|e| {
            eprintln!("Erro: {e}");
            process::exit(1);
        });
    process::exit(status.code().unwrap_or(1));
}

fn cmd_think(root: &Path, message: &str) {
    let stream = root.join("consciousness/stream.md");
    let timestamp = Local::now().format("%Y-%m-%d %H:%M").to_string();
    let entry = format!("\n## {timestamp}\n{message}\n\n---\n");

    let mut file = OpenOptions::new()
        .append(true)
        .open(&stream)
        .unwrap_or_else(|e| {
            eprintln!("Erro ao abrir consciousness/stream.md: {e}");
            process::exit(1);
        });

    file.write_all(entry.as_bytes()).unwrap_or_else(|e| {
        eprintln!("Erro ao escrever no stream: {e}");
        process::exit(1);
    });

    println!("✓ Registrado em consciousness/stream.md");
}

fn cli_install_dir() -> PathBuf {
    PathBuf::from(env::var("HOME").unwrap_or_default()).join(".second-brain-cli")
}

// Resolve a GUI principal do CLI:
// 1. ~/.second-brain-cli/gui/main.tsx  (instalação de produção)
// 2. Sobe até 5 níveis a partir do binário procurando gui/main.tsx (dev local)
fn resolve_main_gui_dir() -> Option<PathBuf> {
    let prod = cli_install_dir().join("gui");
    if prod.join("main.tsx").exists() {
        return Some(prod);
    }

    if let Ok(exe) = env::current_exe() {
        let mut dir = exe.parent()?.to_path_buf();
        for _ in 0..5 {
            let candidate = dir.join("gui/main.tsx");
            if candidate.exists() {
                return Some(dir.join("gui"));
            }
            match dir.parent() {
                Some(p) => dir = p.to_path_buf(),
                None => break,
            }
        }
    }

    None
}

// Resolve o diretório base das GUIs auxiliares do second-brain:
// ~/.second-brain/guis
fn resolve_guis_base() -> Option<PathBuf> {
    if let Ok(home) = env::var("HOME") {
        let p = PathBuf::from(home).join(".second-brain/guis");
        if p.is_dir() {
            return Some(p);
        }
    }
    None
}

// Resolve (dir, entry_file) de uma GUI auxiliar pelo nome.
// Convenção: guis/<name>/<name>_gui.tsx, fallback main.tsx
fn resolve_aux_gui(base: &Path, name: &str) -> Option<(PathBuf, String)> {
    let dir = base.join(name);
    let entry = format!("{name}_gui.tsx");
    if dir.join(&entry).exists() {
        return Some((dir, entry));
    }
    if dir.join("main.tsx").exists() {
        return Some((dir, "main.tsx".to_string()));
    }
    None
}

fn cmd_main_gui() {
    let bun = resolve_bun().unwrap_or_else(|| {
        eprintln!("❌ Bun não encontrado. Execute: sb --setup");
        process::exit(1);
    });

    let gui_dir = resolve_main_gui_dir().unwrap_or_else(|| {
        eprintln!("❌ GUI principal não encontrada em ~/.second-brain-cli/gui. Execute: sb --setup");
        process::exit(1);
    });

    let status = Command::new(bun)
        .arg("main.tsx")
        .current_dir(&gui_dir)
        .status()
        .unwrap_or_else(|e| {
            eprintln!("Erro ao iniciar GUI: {e}");
            process::exit(1);
        });
    process::exit(status.code().unwrap_or(1));
}

fn cmd_aux_gui(name: &str) {
    let bun = resolve_bun().unwrap_or_else(|| {
        eprintln!("❌ Bun não encontrado. Execute: sb --setup");
        process::exit(1);
    });

    let base = resolve_guis_base().unwrap_or_else(|| {
        eprintln!("❌ Diretório ~/.second-brain/guis não encontrado. Verifique a instalação do second-brain.");
        process::exit(1);
    });

    let (gui_dir, entry) = resolve_aux_gui(&base, name).unwrap_or_else(|| {
        eprintln!("❌ GUI '{name}' não encontrada em {}", base.display());
        process::exit(1);
    });

    let status = Command::new(bun)
        .arg(&entry)
        .current_dir(&gui_dir)
        .status()
        .unwrap_or_else(|e| {
            eprintln!("Erro ao iniciar GUI '{name}': {e}");
            process::exit(1);
        });
    process::exit(status.code().unwrap_or(1));
}

fn cmd_init(shell_name: &str) {
    let sh = shell::Shell::from_name(shell_name);
    if sh == shell::Shell::Unknown {
        eprintln!("Shell não suportado: {shell_name}");
        eprintln!("Suportados: bash, zsh, fish");
        process::exit(1);
    }
    let local_bin = PathBuf::from(env::var("HOME").unwrap_or_default()).join(".local/bin");
    print!("{}", shell::render_block(&sh, &local_bin));
}

fn cmd_uninstall() {
    if let Err(e) = shell::uninstall() {
        eprintln!("Erro ao desinstalar: {e}");
        process::exit(1);
    }
}

fn cmd_doctor() {
    let version = env!("CARGO_PKG_VERSION");
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;

    println!("second-brain doctor");
    println!("-------------------");
    println!("Versão: {version} ({os}-{arch})");
    println!();

    // Repo
    let repo_ok = find_repo_root().is_some();
    println!(
        "Repositório   {}",
        if repo_ok { "✅ encontrado em ~/.second-brain" } else { "❌ não encontrado" }
    );

    // sb no PATH
    println!(
        "sb no PATH    {}",
        if have("sb") { "✅" } else { "❌  — execute: sb --setup" }
    );

    // RC configurado
    let sh = shell::Shell::detect();
    if let Some(rc) = shell::rc_path(&sh) {
        let configured = rc.exists()
            && fs::read_to_string(&rc)
                .map(|c| shell::has_block(&c))
                .unwrap_or(false);
        println!(
            "RC ({})  {}",
            rc.display(),
            if configured { "✅ configurado" } else { "❌ não configurado — execute: sb --setup" }
        );
    } else {
        println!("Shell ({}) não suportado para configuração automática de PATH", sh.name());
    }

    println!();
    println!("Dependências:");
    for dep in &["git", "tmux", "bun", "claude", "cursor"] {
        println!(
            "  {dep:<10} {}",
            if have(dep) { "✅" } else { "❌  não instalado" }
        );
    }
}

fn print_version() {
    let version = env!("CARGO_PKG_VERSION");
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    println!("sb {version} ({os}-{arch})");
}

fn print_help() {
    println!(
        "Second Brain CLI

Uso:
  sb                       Abre a GUI principal (~/.second-brain-cli/gui/main.tsx)
  sb <nome>                Abre uma GUI auxiliar do second-brain (ex: sb todo)
  sb think \"mensagem\"      Captura um pensamento no stream de consciência
  sb t \"mensagem\"          Alias para think
  sb init <shell>          Imprime o bloco de configuração de PATH para o shell
  sb uninstall             Remove o bloco de PATH de todos os RCs conhecidos
  sb doctor                Diagnóstico: PATH, RC, dependências
  sb --check               Verifica dependências instaladas
  sb --setup [pasta]       Instala dependências e cria vault em ./pasta (padrão: second-brain)
  sb --update              Atualiza o CLI e a GUI para a versão mais recente
  sb --version             Mostra versão e plataforma
  sb --help                Mostra esta ajuda

Exemplos:
  sb todo
  sb think \"#reflexao preciso definir critério para rejeitar projetos\"
  sb think \"#ideia pricing do rmconsult com 3 tiers\"
  sb init zsh | source /dev/stdin
  eval \"$(sb init bash)\""
    );
}

// ---------------------------------------------------------------------------
// Clear terminal
// ---------------------------------------------------------------------------

fn clear_terminal() {
    print!("\x1b[2J\x1b[H");
    let _ = io::stdout().flush();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

fn main() {
    let args: Vec<String> = env::args().collect();

    // --update não precisa do repo root
    if matches!(args.get(1).map(|s| s.as_str()), Some("--update") | Some("-u")) {
        cmd_update();
        return;
    }

    // --setup não precisa do repo root (pode ser fresh install)
    if matches!(args.get(1).map(|s| s.as_str()), Some("--setup") | Some("-s")) {
        let folder_name = args.get(2).map(|s| s.as_str()).unwrap_or("second-brain");
        cmd_setup(folder_name);
        return;
    }

    // --help não precisa do repo root
    if matches!(args.get(1).map(|s| s.as_str()), Some("--help") | Some("-h")) {
        print_help();
        return;
    }

    // --version não precisa do repo root
    if matches!(args.get(1).map(|s| s.as_str()), Some("--version") | Some("-V")) {
        print_version();
        return;
    }

    // init/uninstall/doctor não precisam do repo root
    match args.get(1).map(|s| s.as_str()) {
        Some("init") => {
            let shell_name = args.get(2).map(|s| s.as_str()).unwrap_or("");
            if shell_name.is_empty() {
                eprintln!("Uso: sb init <shell>  (bash, zsh, fish)");
                process::exit(1);
            }
            cmd_init(shell_name);
            return;
        }
        Some("uninstall") => {
            cmd_uninstall();
            return;
        }
        Some("doctor") => {
            cmd_doctor();
            return;
        }
        _ => {}
    }

    let root = require_repo_root();
    load_env(&root);

    match args.get(1).map(|s| s.as_str()) {
        Some("--check") | Some("-c") => cmd_check(&root),
        Some("think") | Some("t") => {
            let message = args[2..].join(" ");
            if message.trim().is_empty() {
                eprintln!("Uso: sb think \"seu pensamento aqui\"");
                process::exit(1);
            }
            cmd_think(&root, &message);
        }
        None => {
            clear_terminal();
            cmd_main_gui();
        }
        Some(name) => cmd_aux_gui(name),
    }
}
