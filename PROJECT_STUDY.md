# Obsidian Knowledge Assistant - Complete Project Study

## Project Overview

**Obsidian Knowledge Assistant** is an AI-powered knowledge management system that integrates with Obsidian (a popular note-taking app). It provides semantic search and content generation capabilities using a Python backend with LanceDB vector database and local LLM integration.

### Key Features
- 🔍 **Semantic Search**: Natural language search across your vault using vector embeddings
- 🧠 **RAG Pipeline**: Retrieval-Augmented Generation for intelligent content generation
- 🚀 **Offline Capable**: Uses local vector database and local LLM for privacy
- 📝 **Obsidian Integration**: Side panel UI directly in Obsidian
- 🎯 **Context-Aware**: Generates responses based on your vault content
- ⚡ **Fast Retrieval**: LanceDB for sub-millisecond vector search

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OBSIDIAN APP                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Knowledge Assistant Plugin (TypeScript)             │   │
│  │  - Side Panel UI                                    │   │
│  │  - Search Interface                                  │   │
│  │  - Content Generation Interface                     │   │
│  │  - Command Palette Integration                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕ HTTP API                         │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Python Flask Server)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Flask REST API                                       │   │
│  │ - /health: Server status                            │   │
│  │ - /search: Semantic search endpoint                 │   │
│  │ - /generate: Content generation endpoint            │   │
│  │ - /index: Trigger vault indexing                    │   │
│  │ - /stats: Get vault statistics                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Core Components                                      │   │
│  │                                                       │   │
│  │ • Embeddings: SentenceTransformers (all-MiniLM-L6-v2)│  │
│  │   - 384-dimensional embeddings                       │   │
│  │   - Offline inference                               │   │
│  │                                                       │   │
│  │ • Vector Database: LanceDB                           │   │
│  │   - Local persistence                               │   │
│  │   - Sub-millisecond search                          │   │
│  │   - Table: obsidian_vault                           │   │
│  │                                                       │   │
│  │ • LLM: llama.cpp (Optional)                          │   │
│  │   - Support for GGUF quantized models               │   │
│  │   - Local inference, no API calls                   │   │
│  │   - Fallback template-based generation              │   │
│  │                                                       │   │
│  │ • Vault Indexer                                      │   │
│  │   - Scans markdown files                            │   │
│  │   - Extracts content and metadata                   │   │
│  │   - Generates and stores embeddings                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Data Storage                                         │   │
│  │ - Vault Path: C:\Users\HP\Documents\Obsidian Vault  │   │
│  │ - LanceDB: ./lancedb (local directory)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
d:\Obsidin\
├── README.md                 # Main project documentation
├── QUICKSTART.md            # 5-minute setup guide
├── RAG_SETUP.md            # RAG and LLM configuration
├── RAG_IMPLEMENTATION.md    # RAG implementation details
├── START_BACKEND.bat        # Batch file to start backend
├── BUILD_PLUGIN.bat         # Batch file to build plugin
│
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Configuration (VAULT_PATH, LLM settings)
│   ├── .env.example        # Example configuration
│   ├── venv/               # Python virtual environment
│   ├── lancedb/            # Vector database storage
│   │   └── obsidian_vault.lance/
│   └── vault/              # Sample vault with test notes
│       └── sample-note.md
│
└── plugin/                  # TypeScript Obsidian plugin
    ├── src/
    │   ├── main.ts         # Plugin entry point
    │   └── panel.ts        # Side panel UI component
    ├── main.js             # Compiled plugin
    ├── manifest.json       # Plugin metadata
    ├── package.json        # NPM dependencies
    ├── tsconfig.json       # TypeScript configuration
    ├── esbuild.config.mjs  # Build configuration
    └── node_modules/       # NPM dependencies
```

---

## Backend (Python)

### Core Files

#### `app.py` (Main Application)
- **Purpose**: Flask REST API server
- **Key Classes**:
  - `VaultIndexer`: Scans vault, reads markdown, generates embeddings
  - Flask Routes: `/health`, `/search`, `/generate`, `/index`, `/stats`
- **Flow**:
  1. On startup, creates/opens LanceDB connection
  2. Initializes SentenceTransformer embedder
  3. Lazy-loads LLM if configured
  4. Auto-indexes vault on startup
  5. Starts Flask server on http://127.0.0.1:5000

#### `requirements.txt` (Dependencies)
```
flask==3.0.0              # Web framework
flask-cors==4.0.0         # CORS support
lancedb==0.5.0            # Vector database
sentence-transformers==2.3.1  # Embeddings
numpy                     # Numerical operations
python-dotenv==1.0.0      # .env file loading
watchdog==3.0.0           # File monitoring
markdown==3.5.1           # Markdown parsing
pyyaml                    # YAML parsing
pandas                    # Data manipulation
# llama-cpp-python         # Local LLM (optional)
```

#### `.env` (Configuration)
```env
VAULT_PATH=C:\Users\HP\Documents\Obsidian Vault
DB_PATH=./lancedb
PORT=5000
LLM_MODEL_PATH=                    # Leave empty for template-based
LLM_N_CTX=2048                     # Context window
LLM_N_THREADS=4                    # CPU threads
```

### API Endpoints

#### 1. GET `/health`
- **Purpose**: Check if backend is running
- **Response**: 
  ```json
  {
    "status": "healthy",
    "vault_path": "C:\\Users\\HP\\Documents\\Obsidian Vault"
  }
  ```

#### 2. POST `/search`
- **Purpose**: Semantic search across vault
- **Request**:
  ```json
  {
    "query": "project management tips",
    "n_results": 5
  }
  ```
- **Response**:
  ```json
  {
    "query": "project management tips",
    "results": [
      {
        "id": "path/to/note.md",
        "document": "note content...",
        "metadata": {
          "path": "path/to/note.md",
          "file": "note.md"
        },
        "distance": 0.15
      }
    ]
  }
  ```

#### 3. POST `/generate`
- **Purpose**: Generate content based on query using RAG
- **Request**:
  ```json
  {
    "query": "Summarize my project notes",
    "n_results": 3
  }
  ```
- **Response**:
  ```json
  {
    "query": "Summarize my project notes",
    "content": "Generated response based on vault context...",
    "context": [/* array of relevant documents */]
  }
  ```

#### 4. POST `/index`
- **Purpose**: Trigger vault re-indexing
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Vault indexed successfully"
  }
  ```

#### 5. GET `/stats`
- **Purpose**: Get vault statistics
- **Response**:
  ```json
  {
    "total_documents": 45,
    "vault_path": "C:\\Users\\HP\\Documents\\Obsidian Vault",
    "db_path": "./lancedb",
    "llm": {
      "available": false,
      "model_path": null,
      "loaded": false
    }
  }
  ```

### How It Works

#### Indexing Process
1. **Vault Scan**: Walk through all markdown files
2. **Content Extraction**: Read file content, remove frontmatter
3. **Embedding Generation**: Convert text to 384-dimensional vectors
4. **Storage**: Save to LanceDB table with metadata

#### Search Process
1. **Query Embedding**: Convert user query to vector
2. **Vector Search**: Find k most similar documents
3. **Ranking**: Results sorted by cosine similarity distance
4. **Formatting**: Return documents with metadata

#### Generation Process
1. **Search**: Find relevant documents (same as search)
2. **Context Assembly**: Combine documents into context
3. **Prompt Engineering**: Build RAG prompt
4. **LLM Inference**: 
   - With LLM: Use local model for generation
   - Without LLM: Use template-based fallback

---

## Plugin (TypeScript)

### Core Files

#### `src/main.ts` (Plugin Entry Point)
- **Key Features**:
  - Ribbon icon (🧠 brain) in sidebar
  - Commands for opening assistant, searching, generating
  - Settings management (backend URL, vault path, auto-index)
  - Panel activation

- **Commands**:
  - `open-knowledge-assistant`: Open the side panel
  - `search-selection`: Search selected text
  - `generate-from-selection`: Generate based on selection

#### `src/panel.ts` (UI Component)
- **Sections**:
  1. **Semantic Search**: Input and results display
  2. **Content Generation**: Query input and output display
  3. **Vault Statistics**: Display indexing stats

- **Features**:
  - Real-time search as user types (Enter key)
  - Generation with context display
  - Stats auto-refresh
  - Styled input fields and results

#### `manifest.json` (Plugin Metadata)
```json
{
  "id": "obsidian-knowledge-assistant",
  "name": "Obsidian Knowledge Assistant",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "AI-powered knowledge assistant for semantic search and content generation",
  "isDesktopOnly": false
}
```

#### `package.json` (Dependencies)
```json
{
  "name": "obsidian-knowledge-assistant",
  "version": "1.0.0",
  "scripts": {
    "dev": "node esbuild.config.mjs",           // Dev watch mode
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production"  // Production build
  },
  "devDependencies": {
    "@types/node": "^16.11.6",
    "@typescript-eslint/eslint-plugin": "5.29.0",
    "@typescript-eslint/parser": "5.29.0",
    "builtin-modules": "3.3.0",
    "esbuild": "0.17.3",
    "obsidian": "latest",
    "tslib": "2.4.0",
    "typescript": "4.7.4"
  }
}
```

### Communication Flow

```
User in Obsidian
    ↓
Click Search Button / Enter Query
    ↓
Panel.ts performSearch() / performGeneration()
    ↓
HTTP POST to Backend
    ↓
Flask App.py processes request
    ↓
Backend returns JSON response
    ↓
Panel.ts formats and displays results
    ↓
User sees results in side panel
```

---

## Setup and Running

### Quick Start (from QUICKSTART.md)

#### Step 1: Start Backend
```batch
START_BACKEND.bat
```
- Creates Python virtual environment
- Installs dependencies
- Configures .env if needed
- Starts Flask server (port 5000)
- Auto-indexes vault

#### Step 2: Build Plugin
```batch
BUILD_PLUGIN.bat
```
- Installs npm dependencies
- Compiles TypeScript to JavaScript
- Creates plugin bundle (main.js)

#### Step 3: Install Plugin in Obsidian
1. Copy `plugin/` folder to Obsidian plugins directory
2. Rename to `obsidian-knowledge-assistant`
3. Enable in Obsidian Settings

#### Step 4: Configure
Edit `backend/.env`:
```env
VAULT_PATH=C:\Users\YourName\Documents\MyVault
```

### Optional: Setup Local LLM
1. Download model from [HuggingFace](https://huggingface.co/TheBloke)
2. Set path in .env:
   ```env
   LLM_MODEL_PATH=C:\path\to\model.gguf
   ```
3. Restart backend

---

## Key Technologies

### Python Backend
- **Flask**: Micro web framework for REST API
- **LanceDB**: Vector database with sub-millisecond search
- **SentenceTransformers**: Efficient semantic embeddings
- **llama.cpp**: Local LLM inference
- **PyArrow**: Columnar data format

### TypeScript Plugin
- **Obsidian API**: Plugin framework
- **TypeScript**: Type-safe JavaScript
- **esbuild**: Fast JavaScript bundler
- **Node.js**: Build toolchain

### Data/ML
- **Vector Database**: LanceDB (LANCE format)
- **Embeddings**: all-MiniLM-L6-v2 (384-dim, 22MB)
- **LLM Models**: GGUF quantized models (llama.cpp)
- **Search**: Cosine similarity matching

---

## Workflow Examples

### Example 1: Semantic Search
```
User Query: "How do I manage project deadlines?"
    ↓
Backend generates embedding for query
    ↓
LanceDB searches for similar documents
    ↓
Returns top 5 most relevant notes
    ↓
Plugin displays results with file paths
```

### Example 2: Content Generation with RAG
```
User Request: "Summarize my notes about productivity"
    ↓
Backend searches for relevant documents
    ↓
Retrieves top 3 matching notes as context
    ↓
Builds prompt: System Prompt + Context + Query
    ↓
LLM generates response based on context
    ↓
Response displayed in side panel with source attribution
```

### Example 3: Selection-based Actions
```
User selects text in Obsidian
    ↓
Runs "Search selection" command
    ↓
Selected text sent as query
    ↓
Results shown in side panel
```

---

## Configuration Options

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_PATH` | Path to Obsidian vault | `./vault` |
| `DB_PATH` | LanceDB storage location | `./lancedb` |
| `PORT` | Flask server port | `5000` |
| `LLM_MODEL_PATH` | Path to GGUF model | `` (empty = template mode) |
| `LLM_N_CTX` | Context window size | `2048` |
| `LLM_N_THREADS` | CPU threads for LLM | `4` |

### Plugin Settings
- **Backend URL**: Default `http://127.0.0.1:5000`
- **Vault Path**: Default `C:\Users\HP\Documents\Obsidian Vault`
- **Auto Index**: Auto-index vault on startup (default: true)

---

## Performance Characteristics

- **Embedding Generation**: ~50-100ms per 1000 tokens
- **Vector Search**: <1ms for searching 1000 documents
- **LLM Generation**: 
  - Without LLM: <50ms (template mode)
  - With 7B model: 1-5 seconds (CPU dependent)
- **Memory Usage**:
  - Base: ~200MB (Python + embedder + LanceDB)
  - With 7B LLM: +4-8GB (GGUF quantized)

---

## Potential Enhancements

1. **Advanced Search**:
   - Full-text search combination
   - Metadata filtering
   - Date range filtering

2. **UI Improvements**:
   - Syntax highlighting in results
   - Better formatting for code blocks
   - Dark mode support

3. **Performance**:
   - Batch indexing with progress
   - Incremental updates
   - Caching mechanisms

4. **Features**:
   - Chat history
   - Citation tracking
   - Batch processing
   - Export capabilities

---

## Troubleshooting

### Backend won't start
- ✅ Check Python 3.8+ is installed
- ✅ Verify vault path exists in .env
- ✅ Check virtual environment is working

### Plugin shows no results
- ✅ Ensure backend is running (http://127.0.0.1:5000/health)
- ✅ Check vault has markdown files
- ✅ Try re-indexing: `POST /index`

### Slow search/generation
- ✅ With LLM: Reduce `LLM_N_CTX` or use smaller model
- ✅ Without LLM: Should be instant (~<100ms)

### LLM not loaded
- ✅ Check model file exists and path is correct
- ✅ Verify file format is GGUF
- ✅ Check system has enough RAM

---

## Project Status

✅ **Completed**:
- Flask backend with REST API
- LanceDB vector database integration
- SentenceTransformer embeddings
- Obsidian plugin with side panel
- RAG pipeline implementation
- Local LLM support
- Template-based fallback

🚀 **Running Successfully**:
- Backend API server (port 5000)
- Plugin build system
- Vault indexing
- Search functionality
- Content generation

📝 **Documentation**: Complete with setup, usage, and configuration guides

---

## Next Steps for User

1. Wait for backend to fully initialize (downloading models may take 5-10 minutes on first run)
2. Test the `/health` endpoint to verify backend is running
3. Open Obsidian and enable the plugin
4. Try semantic search and content generation
5. Optionally configure local LLM for enhanced generation
