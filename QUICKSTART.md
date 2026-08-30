# Quick Start Guide - Obsidian Knowledge Assistant

Get your Knowledge Assistant up and running in 5 minutes!

## Step 1: Start the Backend

1. Double-click `START_BACKEND.bat`
2. Wait for dependencies to install (first time only)
3. You should see: `Running on http://127.0.0.1:5000`
4. The backend will automatically index your vault

## Step 2: Configure Your Vault

1. Edit `backend/.env` file
2. Set `VAULT_PATH` to your actual Obsidian vault path
   - Example: `VAULT_PATH=C:\Users\YourName\Documents\MyVault`
3. Restart the backend after changing the path

### Optional: Enable AI-Powered Generation (Full RAG)

For true AI content generation instead of template-based responses:

1. Download a quantized LLM model (e.g., from [TheBloke on HuggingFace](https://huggingface.co/TheBloke))
2. Add the model path to `.env`:
   ```
   LLM_MODEL_PATH=C:\path\to\llama-2-7b-chat.Q4_K_M.gguf
   ```
3. Restart the backend

**Note**: The system works without LLM using template-based generation.

## Step 3: Build the Plugin

1. Double-click `BUILD_PLUGIN.bat`
2. Wait for dependencies to install (first time only)
3. You should see: `Plugin built successfully!`

## Step 4: Install Plugin in Obsidian

1. Copy the entire `plugin` folder to your Obsidian plugins directory:
   - **Windows**: `%APPDATA%\obsidian\plugins\`
   - **Mac**: `~/Library/Application Support/obsidian/plugins/`
   - **Linux**: `~/.config/obsidian/plugins/`

2. Rename the folder to `obsidian-knowledge-assistant`

3. Enable in Obsidian:
   - Open Obsidian Settings → Community Plugins
   - Turn on "Community Plugins"
   - Find and enable "Knowledge Assistant"

## Step 5: Use the Assistant

1. Click the brain icon 🧠 in Obsidian's ribbon
2. Or use Command Palette (Ctrl/Cmd + P) → "Open Knowledge Assistant"
3. Try searching: "What features does this system have?"
4. Try generating: "Summarize my notes about project management"

## Common Issues

**Backend won't start:**
- Make sure Python 3.8+ is installed
- Check that the vault path in `.env` is correct

**Plugin won't connect:**
- Ensure the backend is running (you should see the Flask server)
- Check the backend URL in plugin settings (default: `http://127.0.0.1:5000`)

**No search results:**
- Make sure your vault has markdown files
- Try re-indexing: Settings → Knowledge Assistant → Index Vault Now

## What's Next?

- Add more notes to your vault
- Experiment with different search queries
- Customize the plugin settings
- Try the quick actions: search/generate from selected text

## Support

For detailed documentation, see `README.md`