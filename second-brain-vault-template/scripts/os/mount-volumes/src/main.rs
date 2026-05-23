use serde::Deserialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process;

#[derive(Deserialize)]
struct Config {
    volumes: HashMap<String, Volume>,
    #[serde(default)]
    links: Vec<String>,
}

#[derive(Deserialize)]
struct Volume {
    path: String,
}

fn main() {
    if let Err(e) = run() {
        eprintln!("Erro: {e}");
        process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let repo_root = find_repo_root()?;
    let config_path = repo_root.join("second-brain.yaml");

    if !config_path.exists() {
        return Err(format!(
            "second-brain.yaml não encontrado em {}",
            repo_root.display()
        ).into());
    }

    let content = std::fs::read_to_string(&config_path)?;
    let config: Config = serde_yaml::from_str(&content)?;

    std::env::set_current_dir(&repo_root)?;

    if config.links.is_empty() {
        println!("Nenhum link definido em second-brain.yaml");
        return Ok(());
    }

    let mut created = 0usize;
    let mut skipped = 0usize;

    for entry in &config.links {
        let (name, link) = entry.split_once(':').ok_or_else(|| {
            format!("formato inválido em links: '{entry}' (esperado name:path)")
        })?;
        let link = link.trim_end_matches('/');

        let vol = config.volumes.get(name).ok_or_else(|| {
            format!("volume '{name}' não encontrado em second-brain.yaml")
        })?;

        let source = vol.path.trim_end_matches('/');
        let source_path = PathBuf::from(source);
        let link_path   = PathBuf::from(link);

        std::fs::create_dir_all(&source_path)?;

        if link_path.is_symlink() {
            let existing = std::fs::read_link(&link_path)?;
            if existing == source_path {
                println!("  ok    {name}:{link}  →  {source}");
                skipped += 1;
                continue;
            }
            println!("  upd   {name}:{link}  →  {source}  (era: {})", existing.display());
            std::fs::remove_file(&link_path)?;
        } else if link_path.exists() {
            eprintln!("  skip  {link} — já existe e não é symlink");
            skipped += 1;
            continue;
        }

        #[cfg(unix)]
        std::os::unix::fs::symlink(source, &link_path)?;

        #[cfg(not(unix))]
        return Err("symlinks requerem Unix".into());

        println!("  ln    {name}:{link}  →  {source}");
        created += 1;
    }

    println!("\n{created} link(s) criado(s), {skipped} já existente(s).");
    Ok(())
}

fn find_repo_root() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let output = process::Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .output()?;

    if output.status.success() {
        let root = String::from_utf8(output.stdout)?;
        return Ok(PathBuf::from(root.trim()));
    }

    // fallback: walk up from the binary looking for second-brain.yaml
    let mut dir = std::env::current_exe()?;
    loop {
        dir = match dir.parent() {
            Some(p) => p.to_path_buf(),
            None    => break,
        };
        if dir.join("second-brain.yaml").exists() {
            return Ok(dir);
        }
    }

    Err("não foi possível encontrar a raiz do repositório".into())
}
