@echo off
echo Starting Obsidian Knowledge Assistant Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
if not exist .env (
    echo Creating .env file from example...
    copy .env.example .env
    echo Please edit .env and set your VAULT_PATH to your Obsidian vault
    pause
)
echo Installing dependencies...
venv\Scripts\python.exe -m pip install -r requirements.txt
echo Installing llama-cpp-python (for optional LLM support)...
venv\Scripts\python.exe -m pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
echo Starting backend server...
venv\Scripts\python.exe app.py
pause