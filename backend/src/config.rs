use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub github: GithubConfig,
    pub server: ServerConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GithubConfig {
    pub username: String,
    pub token: String,
    pub user_agent: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

impl Config {
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = concat!(env!("CARGO_MANIFEST_DIR"), "/Config.toml");
        let contents = std::fs::read_to_string(config_path)?;
        let config: Config = toml::from_str(&contents)?;
        Ok(config)
    }
}
