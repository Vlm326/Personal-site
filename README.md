# Personal Site

CRT terminal-style portfolio site. Rust backend (axum) serves the frontend and proxies GitHub API data.

## Structure

- `backend/` — Rust/axum API (GitHub data, system info)
- `frontend/` — terminal-style site (HTML/CSS/JS)
- `frontend/legacy/` — old Bootstrap version

## Run

```sh
cd backend
cp Config.example.toml Config.toml   # add your GitHub token
cargo run
```

Then open http://localhost:3000
