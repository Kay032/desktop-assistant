// src-tauri/src/commands/clipboard.rs
use arboard::Clipboard;
use tauri::command;
use std::sync::Mutex;

pub struct ClipboardHistory {
    history: Vec<String>,
    max_size: usize,
}

impl ClipboardHistory {
    pub fn new() -> Self {
        Self {
            history: Vec::new(),
            max_size: 50,
        }
    }
    
    pub fn add(&mut self, text: String) {
        if !text.is_empty() && self.history.last() != Some(&text) {
            self.history.push(text);
            if self.history.len() > self.max_size {
                self.history.remove(0);
            }
        }
    }
}

#[command]
pub fn get_clipboard_history(state: tauri::State<Mutex<ClipboardHistory>>) -> Result<Vec<String>, String> {
    let history = state.lock().unwrap();
    Ok(history.history.clone())
}

#[command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().unwrap();
    clipboard.set_text(text).map_err(|e| e.to_string())
}