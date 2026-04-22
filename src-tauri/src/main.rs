// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tempfile::tempdir;

#[derive(Serialize, Deserialize)]
struct CompileResult {
    success: bool,
    output: String,
    elapsed_ms: u64,
}

#[tauri::command]
fn compile_rust(code: String) -> Result<CompileResult, String> {
    let start_time = std::time::Instant::now();
    
    // Create a temp directory
    let dir = tempdir().map_err(|e| e.to_string())?;
    let src_file = dir.path().join("morphism.rs");
    let out_file = dir.path().join("morphism");

    // Write code to temp file
    fs::write(&src_file, code).map_err(|e| e.to_string())?;

    // Prepare command
    let mut cmd = Command::new("rustc");
    cmd.arg("--edition").arg("2021")
       .arg("--crate-type").arg("lib")
       .arg("--emit=metadata")
       .arg("-o").arg(&out_file)
       .arg(&src_file);

    // Ensure .cargo/bin is in PATH for Windows users
    #[cfg(target_os = "windows")]
    {
        if let Some(home) = std::env::var_os("USERPROFILE") {
            let mut bin_path = PathBuf::from(home);
            bin_path.push(".cargo");
            bin_path.push("bin");
            
            if let Some(path) = std::env::var_os("PATH") {
                let mut paths = std::env::split_paths(&path).collect::<Vec<_>>();
                paths.insert(0, bin_path); // Priority to cargo bin
                let new_path = std::env::join_paths(paths).unwrap();
                cmd.env("PATH", new_path);
            }
        }
    }

    let output = cmd.output().map_err(|e| format!("Failed to execute rustc: {}", e))?;
    
    let elapsed = start_time.elapsed().as_millis() as u64;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}{}", stdout, stderr);

    Ok(CompileResult {
        success: output.status.success(),
        output: combined.trim().to_string(),
        elapsed_ms: elapsed,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![compile_rust])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
