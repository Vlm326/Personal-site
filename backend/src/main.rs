use std::collections::HashMap;
mod config;
mod system_info_utils;
use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, HeaderValue, StatusCode},
    routing::get,
};
use reqwest::{self, header::AUTHORIZATION};
use serde_json;
use std::path::PathBuf;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let mut headers = HeaderMap::new();
    let config = config::Config::load().expect("Не удалось загрузить Config.toml");
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(format!("Bearer {}", config.github.token).as_str())
            .expect("incorrect config"),
    );
    let client = reqwest::Client::builder()
        .user_agent(config.github.user_agent.clone())
        .default_headers(headers)
        .build()
        .unwrap();

    let frontend_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("backend must live inside the project")
        .join("frontend");

    let app = Router::new()
        .route("/api/main", get(fetch_main_data))
        .route("/api/repos", get(fetch_repos))
        .route(
            "/api/languages_percents",
            get(programming_languages_by_repo),
        )
        .route("/api/languages_by_LOC", get(programming_languages_by_loc))
        .route("/api/system_info", get(get_system_info_endpoint))
        .fallback_service(ServeDir::new(frontend_dir))
        .with_state(client);

    println!("Server is running on http://localhost:3000");
    let listener =
        tokio::net::TcpListener::bind(config.server.host + ":" + &config.server.port.to_string())
            .await
            .unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn fetch_main_data(
    State(client): State<reqwest::Client>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let response = client
        .get("https://api.github.com/users/Vlm326")
        .send()
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to connect to GitHub".into(),
            )
        })
        .and_then(|resp| {
            resp.error_for_status().map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "GitHub API returned an error".into(),
                )
            })
        })?;
    let json: serde_json::Value = response.json().await.map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to parse JSON".into(),
        )
    })?;
    Ok(Json(json))
}

async fn fetch_repos(
    State(client): State<reqwest::Client>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let response = client
        .get("https://api.github.com/users/Vlm326/repos")
        .send()
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to connect to GitHub".into(),
            )
        })
        .and_then(|resp| {
            resp.error_for_status().map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "GitHub API returned an error".into(),
                )
            })
        })?;
    let json: serde_json::Value = response.json().await.map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to parse JSON".into(),
        )
    })?;
    Ok(Json(json))
}

async fn programming_languages_by_repo(
    State(client): State<reqwest::Client>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let repos = fetch_repos(State(client.clone())).await?;

    let mut languages = HashMap::new();

    for repo in repos.0.as_array().unwrap_or(&vec![]) {
        let language = repo
            .get("language")
            .and_then(|l| l.as_str())
            .unwrap_or("Unknown");
        *languages.entry(language.to_string()).or_insert(0) += 1;
    }
    println!("Languages: {:?}", languages);
    let total: i32 = languages.values().sum();
    let percents: HashMap<&String, f64> = HashMap::from_iter(
        languages
            .iter()
            .map(|(key, &value)| (key, value as f64 / total as f64 * 100.0)),
    );

    Ok(Json(serde_json::to_value(percents).unwrap()))
}

async fn programming_languages_by_loc(
    State(client): State<reqwest::Client>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let repos = fetch_repos(State(client.clone())).await?;

    let mut total_bytes_by_language: HashMap<String, u64> = HashMap::new();

    for repo in repos.0.as_array().unwrap_or(&vec![]) {
        let repo_name = match repo.get("name").and_then(|n| n.as_str()) {
            Some(name) => name,
            None => continue,
        };
        let response = match client
            .get(format!(
                "https://api.github.com/repos/Vlm326/{}/languages",
                repo_name
            ))
            .send()
            .await
        {
            Ok(resp) => match resp.error_for_status() {
                Ok(r) => r,
                Err(_) => continue,
            },
            Err(_) => continue,
        };

        let lang_bytes: serde_json::Value = match response.json().await {
            Ok(v) => v,
            Err(_) => continue,
        };

        if let Some(obj) = lang_bytes.as_object() {
            for (lang, bytes) in obj {
                if let Some(b) = bytes.as_u64() {
                    *total_bytes_by_language.entry(lang.clone()).or_insert(0) += b;
                }
            }
        }
    }

    let total_bytes: u64 = total_bytes_by_language.values().sum();
    let percents: HashMap<&String, f64> = if total_bytes > 0 {
        HashMap::from_iter(
            total_bytes_by_language
                .iter()
                .map(|(lang, &bytes)| (lang, bytes as f64 / total_bytes as f64 * 100.0)),
        )
    } else {
        HashMap::new()
    };

    Ok(Json(serde_json::to_value(percents).unwrap()))
}

async fn get_system_info_endpoint() -> Result<Json<HashMap<String, String>>, (StatusCode, String)> {
    let system_info = system_info_utils::get_system_info();
    Ok(Json(system_info))
}
