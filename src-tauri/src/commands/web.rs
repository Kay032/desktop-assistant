use tauri::command;
use serde::{Deserialize, Serialize};
use reqwest;
use scraper::{Html, Selector};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    title: String,
    url: String,
    description: String,
}

#[command]
pub fn search_web(query: String) -> Result<Vec<SearchResult>, String> {
    // Create a reqwest client - use blocking client
    let client = reqwest::blocking::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    // Use DuckDuckGo HTML API
    let search_url = format!("https://html.duckduckgo.com/html/?q={}", query.replace(" ", "+"));
    
    println!("Searching for: {}", query);
    
    let response = client
        .get(&search_url)
        .send()
        .map_err(|e| format!("Search request failed: {}", e))?;
    
    let body = response.text()
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    let document = Html::parse_document(&body);
    
    // Parse DuckDuckGo results
    let result_selector = Selector::parse(".result").unwrap();
    let title_selector = Selector::parse(".result__a").unwrap();
    let url_selector = Selector::parse(".result__url").unwrap();
    let desc_selector = Selector::parse(".result__snippet").unwrap();
    
    let mut results = Vec::new();
    
    for result in document.select(&result_selector).take(10) {
        let title = result
            .select(&title_selector)
            .next()
            .map(|t| t.text().collect::<String>())
            .unwrap_or_else(|| "No title".to_string());
        
        let url = result
            .select(&url_selector)
            .next()
            .map(|u| u.text().collect::<String>())
            .unwrap_or_else(|| "No URL".to_string());
        
        let description = result
            .select(&desc_selector)
            .next()
            .map(|d| d.text().collect::<String>())
            .unwrap_or_else(|| "No description".to_string());
        
        results.push(SearchResult {
            title: clean_text(&title),
            url: clean_url(&url),
            description: clean_text(&description),
        });
    }
    
    // If DuckDuckGo fails, provide fallback
    if results.is_empty() {
        results.push(SearchResult {
            title: "Search Results".to_string(),
            url: format!("https://duckduckgo.com/?q={}", query.replace(" ", "+")),
            description: "Click to search on DuckDuckGo".to_string(),
        });
    }
    
    println!("Found {} results", results.len());
    Ok(results)
}

#[command]
pub fn get_webpage_preview(url: String) -> Result<String, String> {
    Ok(format!("Preview of {} (coming soon)", url))
}

// Helper function to clean text
fn clean_text(text: &str) -> String {
    text.split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
        .replace("  ", " ")
}

// Helper function to clean URL
fn clean_url(url: &str) -> String {
    url.trim()
        .replace(" ", "")
        .replace("\n", "")
}