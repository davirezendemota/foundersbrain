use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq)]
pub enum Shell {
    Bash,
    Zsh,
    Fish,
    Unknown,
}

impl Shell {
    pub fn detect() -> Self {
        let shell_env = env::var("SHELL").unwrap_or_default();
        Self::from_path(&shell_env)
    }

    pub fn from_path(path: &str) -> Self {
        let name = Path::new(path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
        Self::from_name(name)
    }

    pub fn from_name(name: &str) -> Self {
        match name.to_lowercase().as_str() {
            "bash" => Shell::Bash,
            "zsh" => Shell::Zsh,
            "fish" => Shell::Fish,
            _ => Shell::Unknown,
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            Shell::Bash => "bash",
            Shell::Zsh => "zsh",
            Shell::Fish => "fish",
            Shell::Unknown => "unknown",
        }
    }
}

pub fn rc_path(shell: &Shell) -> Option<PathBuf> {
    let home = PathBuf::from(env::var("HOME").ok()?);
    rc_path_inner(shell, std::env::consts::OS, &home)
}

pub(crate) fn rc_path_inner(shell: &Shell, os: &str, home: &Path) -> Option<PathBuf> {
    match shell {
        Shell::Bash => {
            if os == "macos" {
                Some(home.join(".bash_profile"))
            } else {
                Some(home.join(".bashrc"))
            }
        }
        Shell::Zsh => {
            let zdotdir = env::var("ZDOTDIR")
                .map(PathBuf::from)
                .unwrap_or_else(|_| home.to_path_buf());
            Some(zdotdir.join(".zshrc"))
        }
        Shell::Fish => Some(home.join(".config/fish/config.fish")),
        Shell::Unknown => None,
    }
}

pub const MARKER_START: &str = "# >>> second-brain initialize >>>";
pub const MARKER_END: &str = "# <<< second-brain initialize <<<";

pub fn render_block(shell: &Shell, install_dir: &Path) -> String {
    let dir = install_dir.display();
    let export_line = match shell {
        Shell::Fish => format!("fish_add_path \"{dir}\""),
        _ => format!("export PATH=\"{dir}:$PATH\""),
    };
    format!("{MARKER_START}\n{export_line}\n{MARKER_END}\n")
}

pub fn has_block(content: &str) -> bool {
    content.contains(MARKER_START)
}

fn remove_marker_block(content: &str) -> String {
    let mut result: Vec<&str> = Vec::new();
    let mut inside = false;

    for line in content.lines() {
        if line.trim() == MARKER_START {
            inside = true;
            continue;
        }
        if line.trim() == MARKER_END {
            inside = false;
            continue;
        }
        if !inside {
            result.push(line);
        }
    }

    let joined = result.join("\n");
    let trimmed = joined.trim_end();
    if trimmed.is_empty() {
        String::new()
    } else {
        format!("{trimmed}\n")
    }
}

pub fn add_to_path(install_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let shell = Shell::detect();
    let rc = rc_path(&shell).ok_or("Shell não suportado ou RC path não detectado")?;

    let content = if rc.exists() {
        fs::read_to_string(&rc)?
    } else {
        String::new()
    };

    if has_block(&content) {
        println!("PATH já configurado em {}", rc.display());
        return Ok(());
    }

    if let Some(parent) = rc.parent() {
        fs::create_dir_all(parent)?;
    }

    if rc.exists() {
        let backup = rc.with_extension("bak");
        fs::copy(&rc, &backup)?;
    }

    let block = render_block(&shell, install_dir);
    let new_content = if content.is_empty() {
        block
    } else {
        format!("{}\n{block}", content.trim_end())
    };

    fs::write(&rc, new_content)?;
    println!("PATH configurado em {}", rc.display());
    println!("Execute: source {}", rc.display());

    Ok(())
}

pub fn remove_block(rc: &Path) -> Result<bool, Box<dyn std::error::Error>> {
    if !rc.exists() {
        return Ok(false);
    }

    let content = fs::read_to_string(rc)?;
    if !has_block(&content) {
        return Ok(false);
    }

    let backup = rc.with_extension("bak");
    fs::copy(rc, &backup)?;

    let new_content = remove_marker_block(&content);
    fs::write(rc, new_content)?;

    Ok(true)
}

pub fn uninstall() -> Result<(), Box<dyn std::error::Error>> {
    let home = PathBuf::from(env::var("HOME").unwrap_or_default());

    let zshrc = if let Ok(zdotdir) = env::var("ZDOTDIR") {
        PathBuf::from(zdotdir).join(".zshrc")
    } else {
        home.join(".zshrc")
    };

    let candidates = vec![
        home.join(".bashrc"),
        home.join(".bash_profile"),
        home.join(".config/fish/config.fish"),
        zshrc,
    ];

    let mut removed_any = false;
    for rc in &candidates {
        match remove_block(rc) {
            Ok(true) => {
                println!("Bloco removido de {}", rc.display());
                removed_any = true;
            }
            Ok(false) => {}
            Err(e) => eprintln!("Erro ao processar {}: {e}", rc.display()),
        }
    }

    if !removed_any {
        println!("Nenhum bloco second-brain encontrado nos RCs conhecidos");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn shell_from_name() {
        assert_eq!(Shell::from_name("bash"), Shell::Bash);
        assert_eq!(Shell::from_name("zsh"), Shell::Zsh);
        assert_eq!(Shell::from_name("fish"), Shell::Fish);
        assert_eq!(Shell::from_name("sh"), Shell::Unknown);
        assert_eq!(Shell::from_name(""), Shell::Unknown);
    }

    #[test]
    fn shell_from_path() {
        assert_eq!(Shell::from_path("/bin/bash"), Shell::Bash);
        assert_eq!(Shell::from_path("/usr/local/bin/zsh"), Shell::Zsh);
        assert_eq!(Shell::from_path("/usr/bin/fish"), Shell::Fish);
        assert_eq!(Shell::from_path(""), Shell::Unknown);
    }

    #[test]
    fn rc_path_bash_linux() {
        let home = Path::new("/home/user");
        let p = rc_path_inner(&Shell::Bash, "linux", home).unwrap();
        assert_eq!(p, home.join(".bashrc"));
    }

    #[test]
    fn rc_path_bash_macos() {
        let home = Path::new("/home/user");
        let p = rc_path_inner(&Shell::Bash, "macos", home).unwrap();
        assert_eq!(p, home.join(".bash_profile"));
    }

    #[test]
    fn rc_path_zsh() {
        let home = Path::new("/home/user");
        unsafe { env::remove_var("ZDOTDIR") };
        let p = rc_path_inner(&Shell::Zsh, "linux", home).unwrap();
        assert_eq!(p, home.join(".zshrc"));
    }

    #[test]
    fn rc_path_fish() {
        let home = Path::new("/home/user");
        let p = rc_path_inner(&Shell::Fish, "linux", home).unwrap();
        assert_eq!(p, home.join(".config/fish/config.fish"));
    }

    #[test]
    fn rc_path_unknown_is_none() {
        let home = Path::new("/home/user");
        assert!(rc_path_inner(&Shell::Unknown, "linux", home).is_none());
    }

    #[test]
    fn render_block_bash_zsh() {
        let dir = Path::new("/home/user/.local/bin");
        for shell in [Shell::Bash, Shell::Zsh] {
            let block = render_block(&shell, dir);
            assert!(block.contains(MARKER_START));
            assert!(block.contains(MARKER_END));
            assert!(block.contains("export PATH=\"/home/user/.local/bin:$PATH\""));
        }
    }

    #[test]
    fn render_block_fish() {
        let dir = Path::new("/home/user/.local/bin");
        let block = render_block(&Shell::Fish, dir);
        assert!(block.contains(MARKER_START));
        assert!(block.contains(MARKER_END));
        assert!(block.contains("fish_add_path \"/home/user/.local/bin\""));
        assert!(!block.contains("export PATH"));
    }

    #[test]
    fn has_block_present() {
        let content = format!("foo\n{MARKER_START}\nbar\n{MARKER_END}\nbaz");
        assert!(has_block(&content));
    }

    #[test]
    fn has_block_absent() {
        assert!(!has_block("some config without markers"));
    }

    #[test]
    fn remove_block_strips_section() {
        let content = format!("line1\n{MARKER_START}\nexport PATH\n{MARKER_END}\nline3\n");
        let result = remove_marker_block(&content);
        assert!(!result.contains(MARKER_START));
        assert!(!result.contains(MARKER_END));
        assert!(result.contains("line1"));
        assert!(result.contains("line3"));
        assert!(!result.contains("export PATH"));
    }

    #[test]
    fn idempotency_integration() {
        let dir = tempdir().unwrap();
        let rc = dir.path().join(".zshrc");
        fs::write(&rc, "# existing config\n").unwrap();
        let install_dir = Path::new("/home/user/.local/bin");

        let apply = |rc: &Path| {
            let content = fs::read_to_string(rc).unwrap();
            if !has_block(&content) {
                let block = render_block(&Shell::Zsh, install_dir);
                fs::write(rc, format!("{}\n{block}", content.trim_end())).unwrap();
            }
        };

        apply(&rc);
        let after_first = fs::read_to_string(&rc).unwrap();
        assert_eq!(after_first.matches(MARKER_START).count(), 1);

        apply(&rc);
        let after_second = fs::read_to_string(&rc).unwrap();
        assert_eq!(
            after_second.matches(MARKER_START).count(),
            1,
            "bloco deve aparecer apenas uma vez"
        );
    }

    #[test]
    fn remove_block_integration() {
        let dir = tempdir().unwrap();
        let rc = dir.path().join(".zshrc");
        let install_dir = Path::new("/home/user/.local/bin");

        let block = render_block(&Shell::Zsh, install_dir);
        fs::write(&rc, format!("# config\n{block}# more config\n")).unwrap();

        assert!(remove_block(&rc).unwrap());

        let content = fs::read_to_string(&rc).unwrap();
        assert!(!has_block(&content));
        assert!(content.contains("# config"));
        assert!(content.contains("# more config"));
    }
}
