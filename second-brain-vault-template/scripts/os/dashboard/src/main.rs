use clap::{Parser, Subcommand};
use chrono::Datelike;
use serde_json::json;
use std::collections::{HashMap, HashSet};
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process;

#[derive(Parser)]
#[command(name = "dashboard", about = "Second-brain dashboard widgets")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// OS / system snapshot (date, CPU, memory, hostname)
    OsInfo,
    /// Claude Code usage stats from ~/.claude/history.jsonl
    ClaudeUsage,
    /// Cursor AI conversation count from state.vscdb
    CursorUsage,
    /// Count pending/done tasks across TODO.md files
    TodosCount {
        #[arg(long)]
        root: Option<PathBuf>,
    },
    /// Token usage per agent type from today's Claude Code sessions
    AgentTokens {
        #[arg(long)]
        root: Option<PathBuf>,
    },
}

fn main() {
    let cli = Cli::parse();
    if let Err(e) = run(cli) {
        eprintln!("Error: {e}");
        process::exit(1);
    }
}

fn run(cli: Cli) -> Result<(), Box<dyn std::error::Error>> {
    match cli.command {
        Commands::OsInfo => os_info(),
        Commands::ClaudeUsage => claude_usage(),
        Commands::CursorUsage => cursor_usage(),
        Commands::TodosCount { root } => todos_count(root),
        Commands::AgentTokens { root } => agent_tokens(root),
    }
}

// ---------------------------------------------------------------------------
// os-info
// ---------------------------------------------------------------------------

fn os_info() -> Result<(), Box<dyn std::error::Error>> {
    use sysinfo::System;

    const MONTHS: [&str; 13] = ["", "jan", "fev", "mar", "abr", "mai", "jun",
                                  "jul", "ago", "set", "out", "nov", "dez"];
    const WEEKDAYS: [&str; 7] = ["segunda-feira", "terça-feira", "quarta-feira",
                                   "quinta-feira", "sexta-feira", "sábado", "domingo"];

    let now = chrono::Local::now();
    let date_str = format!("{} {} {}", now.day(), MONTHS[now.month() as usize], now.year());
    let weekday_str = WEEKDAYS[now.weekday().num_days_from_monday() as usize];

    let platform = match std::env::consts::OS {
        "macos"   => "Darwin",
        "linux"   => "Linux",
        "windows" => "Windows",
        other     => other,
    };

    let mut sys = System::new_all();
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_usage();

    let cpu      = round1(sys.global_cpu_info().cpu_usage() as f64);
    let used_gb  = round1(sys.used_memory()  as f64 / 1e9);
    let total_gb = round1(sys.total_memory() as f64 / 1e9);
    let mem_pct  = if sys.total_memory() > 0 {
        round1(sys.used_memory() as f64 / sys.total_memory() as f64 * 100.0)
    } else { 0.0 };

    let hostname = System::host_name()
        .unwrap_or_default()
        .split('.')
        .next()
        .unwrap_or("")
        .to_string();

    println!("{}", json!({
        "date":         date_str,
        "weekday":      weekday_str,
        "hostname":     hostname,
        "platform":     platform,
        "cpu_percent":  cpu,
        "mem_used_gb":  used_gb,
        "mem_total_gb": total_gb,
        "mem_percent":  mem_pct,
    }));
    Ok(())
}

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

// ---------------------------------------------------------------------------
// claude-usage
// ---------------------------------------------------------------------------

fn claude_usage() -> Result<(), Box<dyn std::error::Error>> {
    let history_path = dirs::home_dir()
        .ok_or("cannot find home directory")?
        .join(".claude")
        .join("history.jsonl");

    if !history_path.exists() {
        println!("{}", json!({"prompts_today": 0, "sessions_today": 0, "total_prompts": 0}));
        return Ok(());
    }

    let today = chrono::Local::now().date_naive();
    let mut prompts_today: i64 = 0;
    let mut sessions_today: HashSet<String> = HashSet::new();
    let mut total_prompts: i64 = 0;

    const SKIP: &[&str] = &["/exit", "/clear", "!clear"];

    let reader = BufReader::new(std::fs::File::open(&history_path)?);
    for line in reader.lines() {
        let line = line?;
        let line = line.trim();
        if line.is_empty() { continue; }
        let Ok(entry): Result<serde_json::Value, _> = serde_json::from_str(line) else { continue; };

        let ts      = entry["timestamp"].as_i64().unwrap_or(0);
        let sid     = entry["sessionId"].as_str().unwrap_or("").to_string();
        let display = entry["display"].as_str().unwrap_or("");

        if display.starts_with('/') && SKIP.contains(&display) { continue; }

        total_prompts += 1;

        let entry_date = chrono::DateTime::from_timestamp_millis(ts)
            .map(|dt| dt.with_timezone(&chrono::Local).date_naive());

        if entry_date == Some(today) {
            prompts_today += 1;
            if !sid.is_empty() { sessions_today.insert(sid); }
        }
    }

    println!("{}", json!({
        "prompts_today":  prompts_today,
        "sessions_today": sessions_today.len(),
        "total_prompts":  total_prompts,
    }));
    Ok(())
}

// ---------------------------------------------------------------------------
// cursor-usage
// ---------------------------------------------------------------------------

fn cursor_usage() -> Result<(), Box<dyn std::error::Error>> {
    let db_path = dirs::home_dir()
        .ok_or("cannot find home directory")?
        .join("Library/Application Support/Cursor/User/globalStorage/state.vscdb");

    if !db_path.exists() {
        println!("{}", json!({"conversations": 0}));
        return Ok(());
    }

    match rusqlite::Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY) {
        Err(e) => {
            eprintln!("cursor-usage: {e}");
            println!("{}", json!({"conversations": 0}));
        }
        Ok(conn) => {
            let count: i64 = conn.query_row(
                "SELECT COUNT(DISTINCT substr(key, 24, 36)) FROM cursorDiskKV WHERE key LIKE 'messageRequestContext:%'",
                [],
                |row| row.get(0),
            ).unwrap_or(0);
            println!("{}", json!({"conversations": count}));
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// todos-count
// ---------------------------------------------------------------------------

fn todos_count(root: Option<PathBuf>) -> Result<(), Box<dyn std::error::Error>> {
    const SKIP_DIRS: &[&str] = &[".git", "node_modules", "venv", ".cursor", "volumes", ".obsidian"];

    let root = root.unwrap_or_else(repo_root);

    let mut pending: i64 = 0;
    let mut done:    i64 = 0;
    let mut files:   i64 = 0;

    for entry in walkdir::WalkDir::new(&root)
        .into_iter()
        .filter_entry(|e| {
            !e.file_type().is_dir()
                || !SKIP_DIRS.contains(&e.file_name().to_str().unwrap_or(""))
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() { continue; }
        if entry.file_name().to_str() != Some("TODO.md") { continue; }

        let Ok(text) = std::fs::read_to_string(entry.path()) else { continue; };
        let mut had_tasks = false;
        for line in text.lines() {
            if line.starts_with("- [ ]") {
                pending += 1;
                had_tasks = true;
            } else if line.len() >= 5 && line[..5].eq_ignore_ascii_case("- [x]") {
                done += 1;
                had_tasks = true;
            }
        }
        if had_tasks { files += 1; }
    }

    println!("{}", json!({"pending": pending, "done": done, "files": files}));
    Ok(())
}

fn repo_root() -> PathBuf {
    process::Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .output()
        .ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| PathBuf::from(s.trim()))
        .unwrap_or_else(|| PathBuf::from("."))
}

// ---------------------------------------------------------------------------
// agent-tokens
// ---------------------------------------------------------------------------

fn agent_tokens(root: Option<PathBuf>) -> Result<(), Box<dyn std::error::Error>> {
    let cwd = root
        .map(|p| std::fs::canonicalize(&p).unwrap_or(p))
        .or_else(|| std::env::current_dir().ok())
        .unwrap_or_default();

    let slug = cwd.to_string_lossy().replace('/', "-");
    let project_dir = dirs::home_dir()
        .ok_or("no home dir")?
        .join(".claude/projects")
        .join(&slug);

    if !project_dir.exists() {
        println!("{}", json!({"agents": [], "total_today": 0}));
        return Ok(());
    }

    let today = chrono::Local::now().date_naive();
    // agent -> (input+cache_creation, output)
    let mut usage: HashMap<String, (i64, i64)> = HashMap::new();

    for entry in std::fs::read_dir(&project_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) == Some("jsonl") {
            // Main session — group by model name
            let (inp, out, model) = parse_session_tokens(&path, today)?;
            if inp + out > 0 {
                let key = model.unwrap_or_else(|| "main".to_string());
                let e = usage.entry(key).or_insert((0, 0));
                e.0 += inp;
                e.1 += out;
            }
        } else if path.is_dir() {
            // Session directory — look for subagents
            let subagents_dir = path.join("subagents");
            if !subagents_dir.exists() { continue; }
            for sub in std::fs::read_dir(&subagents_dir)? {
                let sub = sub?;
                let sub_path = sub.path();
                if sub_path.extension().and_then(|e| e.to_str()) != Some("jsonl") { continue; }

                let meta_path = sub_path.with_extension("meta.json");
                let agent_type = if meta_path.exists() {
                    let meta: serde_json::Value =
                        serde_json::from_str(&std::fs::read_to_string(&meta_path)?)?;
                    meta["agentType"].as_str().unwrap_or("agent").to_string()
                } else {
                    "agent".to_string()
                };

                let (inp, out, _) = parse_session_tokens(&sub_path, today)?;
                if inp + out > 0 {
                    let e = usage.entry(agent_type).or_insert((0, 0));
                    e.0 += inp;
                    e.1 += out;
                }
            }
        }
    }

    let total_today: i64 = usage.values().map(|(i, o)| i + o).sum();

    let mut agents: Vec<serde_json::Value> = usage
        .into_iter()
        .map(|(name, (inp, out))| {
            let total = inp + out;
            let pct = if total_today > 0 {
                round1(total as f64 / total_today as f64 * 100.0)
            } else { 0.0 };
            json!({
                "agent":        name,
                "input_tokens": inp,
                "output_tokens": out,
                "total_tokens": total,
                "percent":      pct,
            })
        })
        .collect();

    agents.sort_by(|a, b| {
        b["total_tokens"].as_i64().unwrap_or(0)
            .cmp(&a["total_tokens"].as_i64().unwrap_or(0))
    });

    println!("{}", json!({"agents": agents, "total_today": total_today}));
    Ok(())
}

fn parse_session_tokens(
    path: &PathBuf,
    today: chrono::NaiveDate,
) -> Result<(i64, i64, Option<String>), Box<dyn std::error::Error>> {
    let reader = BufReader::new(std::fs::File::open(path)?);
    let mut inp: i64 = 0;
    let mut out: i64 = 0;
    let mut model: Option<String> = None;

    for line in reader.lines() {
        let line = line?;
        let line = line.trim();
        if line.is_empty() { continue; }
        let Ok(entry): Result<serde_json::Value, _> = serde_json::from_str(line) else { continue; };

        if entry["type"].as_str() != Some("assistant") { continue; }

        let ts = entry["timestamp"].as_str()
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.with_timezone(&chrono::Local).date_naive());
        if ts != Some(today) { continue; }

        // Capture model name from first assistant message of today
        if model.is_none() {
            if let Some(m) = entry["message"]["model"].as_str() {
                model = Some(m.to_string());
            }
        }

        if let Some(u) = entry["message"]["usage"].as_object() {
            inp += u.get("input_tokens").and_then(|v| v.as_i64()).unwrap_or(0);
            inp += u.get("cache_creation_input_tokens").and_then(|v| v.as_i64()).unwrap_or(0);
            out += u.get("output_tokens").and_then(|v| v.as_i64()).unwrap_or(0);
        }
    }

    Ok((inp, out, model))
}
