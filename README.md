# Obsidian Vault Knowledge Assistant

An AI-powered knowledge assistant for Obsidian that provides semantic search and content generation using your personal vault. Built with Approach 2 architecture: Python backend with local vector database + Obsidian plugin integration.

## Features

- **Semantic Search**: Find relevant notes using natural language queries
- **Full RAG Pipeline**: Retrieval-Augmented Generation with local LLM integration
- **Content Generation**: AI-powered insights and content based on your vault knowledge
- **Offline Capable**: Uses local vector database (LanceDB) and sentence transformers
- **Local LLM Support**: Optional integration with llama.cpp for true AI generation
- **Obsidian Integration**: Side panel interface within Obsidian
- **Vault Indexing**: Automatic indexing of your markdown notes
- **Context-Aware**: Uses your existing notes as context for generation

## Architecture

- **Backend**: Python Flask server with LanceDB for vector storage
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2) for offline embeddings
- **RAG Pipeline**: Full Retrieval-Augmented Generation with local LLM support
- **Frontend**: Obsidian plugin (TypeScript) with side panel UI
- **Communication**: HTTP API between plugin and backend
- **Vector Database**: LanceDB for local vector storage and retrieval
- **LLM Integration**: Optional llama.cpp for AI-powered generation

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- Obsidian app
- Your Obsidian vault

## Installation

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` file and set your vault path:

```env
VAULT_PATH=/path/to/your/obsidian/vault
DB_PATH=./lancedb
PORT=5000

# Optional: Configure local LLM for full RAG
LLM_MODEL_PATH=/path/to/your/model.gguf
LLM_N_CTX=2048
LLM_N_THREADS=4
```

### Optional: Setup Local LLM for Full RAG

For AI-powered content generation, download a quantized LLM model:

1. Download a model from [HuggingFace](https://huggingface.co/TheBloke):
   - Recommended: `LLaMA-2-7B-GGUF` or `Mistral-7B-GGUF`
   - Example: `llama-2-7b-chat.Q4_K_M.gguf`

2. Set the model path in your `.env` file:
   ```env
   LLM_MODEL_PATH=/path/to/llama-2-7b-chat.Q4_K_M.gguf
   ```

3. Restart the backend - it will automatically load the LLM

**Note**: Without LLM configuration, the system uses template-based generation (fallback mode).

Start the backend server:

```bash
python app.py
```

The backend will:
- Automatically index your vault on startup
- Start HTTP server on `http://127.0.0.1:5000`
- Create local LanceDB instance in `lancedb` directory

### 2. Plugin Setup

Navigate to the plugin directory:

```bash
cd plugin
```

Install dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

### 3. Install Plugin in Obsidian

1. Copy the entire plugin folder to your Obsidian vault's plugins directory:
   - Windows: `%APPDATA%\obsidian\plugins\`
   - Mac: `~/Library/Application Support/obsidian/plugins/`
   - Linux: `~/.config/obsidian/plugins/`

2. Rename the folder to `obsidian-knowledge-assistant`

3. Enable the plugin in Obsidian:
   - Open Obsidian Settings → Community Plugins
   - Turn on "Community Plugins"
   - Browse and enable "Knowledge Assistant"

## Usage

### Basic Search

1. Click the brain icon in the ribbon or use the command palette (Ctrl/Cmd + P)
2. Type "Open Knowledge Assistant"
3. In the side panel, enter your search query
4. Click "Search" or press Enter
5. Results will show with similarity scores and file links

### Content Generation

1. Open the Knowledge Assistant panel
2. In the "Content Generation" section, enter your question or topic
3. Click "Generate"
4. The assistant will provide a response based on your vault content

### Quick Actions

- **Search Selection**: Highlight text in any note, then use the command "Search selection in vault"
- **Generate from Selection**: Highlight text, then use "Generate content from selection"

### Settings

Access plugin settings via:
- Settings → Community Plugins → Knowledge Assistant

Configure:
- **Backend URL**: URL of the Python backend (default: `http://127.0.0.1:5000`)
- **Vault Path**: Path to your vault (for backend reference)
- **Auto-index**: Automatically index vault on plugin load
- **Manual Index**: Trigger vault indexing manually
- **Connection Status**: Check if backend is running

## API Endpoints

The Python backend provides the following endpoints:

### `GET /health`
Check backend health status

### `POST /index`
Trigger vault indexing

### `POST /search`
Semantic search across vault
```json
{
  "query": "your search query",
  "n_results": 5
}
```

### `POST /generate`
Generate content based on query
```json
{
  "query": "your question",
  "n_results": 3
}
```

### `GET /stats`
Get vault statistics

## Offline Capability

This system is designed to work offline:

- **Embeddings**: Uses sentence-transformers with local model files
- **Vector Database**: LanceDB stores embeddings locally
- **No API Keys**: No external API calls required for core functionality
- **Local LLM**: Optional llama.cpp integration for full RAG without internet

For enhanced content generation, you can optionally integrate local LLMs like:
- llama.cpp
- Ollama
- LocalAI

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
python app.py
```

### Plugin Development

```bash
cd plugin
npm run dev
```

This will watch for changes and rebuild automatically.

## Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Ensure all dependencies are installed
- Verify vault path in `.env` file

### Plugin can't connect to backend
- Ensure backend is running
- Check backend URL in plugin settings
- Verify firewall isn't blocking localhost connections

### Search returns no results
- Make sure vault has been indexed
- Check that vault path is correct
- Try re-indexing the vault

### Poor search results
- Ensure your notes have meaningful content
- Consider using more specific queries
- The embedding model works best with English text

## File Structure

```
obsidian-knowledge-assistant/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   ├── lancedb/            # Vector database (created automatically)
│   └── vault/              # Your Obsidian vault (configured in .env)
├── plugin/
│   ├── src/
│   │   ├── main.ts         # Plugin main file
│   │   └── panel.ts        # Side panel UI
│   ├── manifest.json       # Plugin manifest
│   ├── package.json       # Node dependencies
│   ├── tsconfig.json      # TypeScript config
│   └── esbuild.config.mjs # Build configuration
└── README.md
```

## Performance Considerations

- **Initial Indexing**: May take several minutes for large vaults
- **Memory Usage**: LanceDB and sentence transformers use RAM (~500MB-2GB)
- **Search Speed**: Typically <1 second for queries
- **Model Size**: all-MiniLM-L6-v2 is ~80MB
- **LLM Performance** (if configured):
  - 7B parameter models require ~4-8GB RAM
  - Generation speed: ~10-30 tokens/second on CPU
  - First-time model loading: ~10-30 seconds

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Future Enhancements

- [ ] Integration with local LLMs for advanced generation
- [ ] Real-time vault watching and re-indexing
- [ ] Advanced filtering options (by tag, folder, date)
- [ ] Query suggestions and autocomplete
- [ ] Export search results
- [ ] Multi-vault support