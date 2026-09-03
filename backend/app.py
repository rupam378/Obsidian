import os
import json
import markdown
from flask import Flask, request, jsonify
from flask_cors import CORS
import lancedb
from sentence_transformers import SentenceTransformer
import numpy as np
import pandas as pd
import pyarrow as pa
from llama_cpp import Llama
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
VAULT_PATH = os.getenv('VAULT_PATH', './vault')
DB_PATH = os.getenv('DB_PATH', './lancedb')
PORT = int(os.getenv('PORT', 5000))

# LLM Configuration
LLM_ENABLED = os.getenv('LLM_ENABLED', 'false').strip().lower() in {'1', 'true', 'yes', 'on'}
LLM_MODEL_PATH = os.getenv('LLM_MODEL_PATH', '').strip()
LLM_N_CTX = int(os.getenv('LLM_N_CTX', 2048))
LLM_N_THREADS = int(os.getenv('LLM_N_THREADS', 4))


def is_llm_configured(model_path: str | None = None) -> bool:
    """Return True only when explicit LLM generation is enabled and a valid GGUF file exists."""
    if model_path is None:
        configured_path = (LLM_MODEL_PATH or '').strip()
    else:
        configured_path = model_path.strip()

    if not LLM_ENABLED or not configured_path:
        return False
    return os.path.isfile(configured_path) and configured_path.lower().endswith('.gguf')


# Initialize LanceDB with local persistence
db = lancedb.connect(DB_PATH)

# Initialize sentence transformer for embeddings
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize LLM (lazy loading)
llm = None

def get_llm():
    """Lazy load LLM only when needed and only if it is enabled and valid."""
    global llm
    if llm is not None:
        return llm

    if not is_llm_configured():
        print("LLM disabled or model path invalid; using template-based generation.")
        return None

    try:
        llm = Llama(
            model_path=LLM_MODEL_PATH,
            n_ctx=LLM_N_CTX,
            n_threads=LLM_N_THREADS,
            verbose=False
        )
        print(f"LLM loaded from {LLM_MODEL_PATH}")
    except Exception as e:
        print(f"Failed to load LLM: {e}")
        llm = None
    return llm

# Create or get table
def get_table():
    try:
        table = db.open_table("obsidian_vault")
        return table
    except:
        # Create schema
        schema = pa.schema([
            pa.field("id", pa.string()),
            pa.field("document", pa.string()),
            pa.field("path", pa.string()),
            pa.field("file", pa.string()),
            pa.field("vector", pa.list_(pa.float32(), 384))  # all-MiniLM-L6-v2 dimension
        ])
        table = db.create_table("obsidian_vault", schema=schema)
        return table

class VaultIndexer:
    def __init__(self, vault_path, db, embedder):
        self.vault_path = vault_path
        self.db = db
        self.embedder = embedder
        self.indexed_files = set()
        
    def read_markdown_files(self):
        """Read all markdown files from the vault"""
        documents = []
        metadatas = []
        ids = []
        
        if not os.path.exists(self.vault_path):
            return documents, metadatas, ids
            
        for root, dirs, files in os.walk(self.vault_path):
            # Skip .obsidian directory
            if '.obsidian' in root:
                continue
                
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, self.vault_path)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        # Extract frontmatter if present
                        metadata = {
                            'path': relative_path,
                            'file': file
                        }
                        
                        # Simple frontmatter parsing (basic text extraction)
                        if content.startswith('---'):
                            parts = content.split('---', 2)
                            if len(parts) >= 2:
                                # Skip frontmatter, use content after second ---
                                content = parts[2] if len(parts) > 2 else content
                        
                        documents.append(content)
                        metadatas.append(metadata)
                        ids.append(relative_path)
                        self.indexed_files.add(relative_path)
                        
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
                        
        return documents, metadatas, ids
    
    def index_vault(self):
        """Index the entire vault"""
        print("Indexing vault...")
        documents, metadatas, ids = self.read_markdown_files()
        
        if documents:
            # Generate embeddings
            embeddings = self.embedder.encode(documents)
            
            # Prepare data for LanceDB
            data = []
            for i, (doc, meta, id_, embedding) in enumerate(zip(documents, metadatas, ids, embeddings)):
                data.append({
                    "id": id_,
                    "document": doc,
                    "path": meta['path'],
                    "file": meta['file'],
                    "vector": embedding.tolist()
                })
            
            # Drop existing table and create new one
            try:
                self.db.drop_table("obsidian_vault")
            except:
                pass
                
            # Create new table with data
            table = get_table()
            table.add(data)
            
            print(f"Indexed {len(documents)} documents")
        else:
            print("No documents found to index")

# Initialize indexer
indexer = VaultIndexer(VAULT_PATH, db, embedder)

# Content generation using local LLM (RAG)
def generate_content(query, context_docs):
    """Generate content using RAG with local LLM"""
    llm_model = get_llm()
    
    if not llm_model:
        # Fallback to template-based generation if LLM not available
        context_text = "\n\n".join([
            f"From {doc['metadata']['path']}:\n{doc['document']}" 
            for doc in context_docs
        ])

        if not context_docs:
            return (
                "I couldn't find enough matching notes in the vault for that question. "
                "Try a broader query or add more relevant content to your notes."
            )

        return f"""Based on your notes, here's what I found about "{query}":

{context_text}

This information is drawn from {len(context_docs)} relevant notes in your vault.
(Note: local AI generation is off or unavailable, so this is a note-based summary.)"""
    
    # RAG: Create context-aware prompt
    context_text = "\n\n".join([
        f"Document: {doc['metadata']['path']}\nContent: {doc['document']}" 
        for doc in context_docs
    ])
    
    system_prompt = """You are a helpful knowledge assistant that answers questions based on the provided context from personal notes. 
Use only the information from the context to answer questions. If the context doesn't contain enough information, say so.
Be concise but thorough in your responses."""
    
    user_prompt = f"""Context from personal notes:
{context_text}

Question: {query}

Answer:"""
    
    try:
        # Generate response using LLM
        response = llm_model(
            f"{system_prompt}\n\n{user_prompt}",
            max_tokens=512,
            stop=["\n\n", "Question:", "Context:"],
            echo=False
        )
        
        # Extract generated text
        generated_text = response['choices'][0]['text'].strip()
        
        return f"""{generated_text}

---
*Generated using local LLM based on {len(context_docs)} relevant notes from your vault.*"""
        
    except Exception as e:
        print(f"LLM generation error: {e}")
        # Fallback to template-based generation
        context_text = "\n\n".join([
            f"From {doc['metadata']['path']}:\n{doc['document']}" 
            for doc in context_docs
        ])
        
        return f"""Based on your notes, here's what I found about "{query}":

{context_text}

This information is drawn from {len(context_docs)} relevant notes in your vault.
(LLM generation failed - using fallback)"""

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "vault_path": VAULT_PATH})

@app.route('/index', methods=['POST'])
def index_vault():
    """Trigger vault indexing"""
    try:
        indexer.index_vault()
        return jsonify({"status": "success", "message": "Vault indexed successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/search', methods=['POST'])
def search():
    """Semantic search across vault"""
    data = request.json
    query = data.get('query', '')
    n_results = data.get('n_results', 5)
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    try:
        # Generate query embedding
        query_embedding = embedder.encode([query])[0].tolist()
        
        # Get table and search
        table = get_table()
        results = table.search(query_embedding).limit(n_results).to_pandas()
        
        # Format results
        formatted_results = []
        for _, row in results.iterrows():
            # Handle NaN values
            doc_content = row['document'] if pd.notna(row['document']) else ""
            formatted_results.append({
                'id': row['id'],
                'document': doc_content,
                'metadata': {
                    'path': row['path'],
                    'file': row['file']
                },
                'distance': row.get('_distance', 0.0)
            })
        
        return jsonify({
            "query": query,
            "results": formatted_results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate():
    """Generate content based on query and search results"""
    data = request.json
    query = data.get('query', '')
    n_results = data.get('n_results', 3)
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    try:
        # First perform search to get context
        query_embedding = embedder.encode([query])[0].tolist()
        table = get_table()
        search_results = table.search(query_embedding).limit(n_results).to_pandas()
        
        # Format context documents
        context_docs = []
        for _, row in search_results.iterrows():
            # Handle NaN values
            doc_content = row['document'] if pd.notna(row['document']) else ""
            context_docs.append({
                'id': row['id'],
                'document': doc_content,
                'metadata': {
                    'path': row['path'],
                    'file': row['file']
                }
            })
        
        # Generate content
        generated_content = generate_content(query, context_docs)
        
        return jsonify({
            "query": query,
            "content": generated_content,
            "context": context_docs
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def stats():
    """Get vault statistics"""
    try:
        table = get_table()
        count = table.count_rows()
        llm_status = {
            "available": is_llm_configured(),
            "enabled": LLM_ENABLED,
            "model_path": LLM_MODEL_PATH if LLM_MODEL_PATH else None,
            "loaded": llm is not None
        }
        return jsonify({
            "total_documents": count,
            "vault_path": VAULT_PATH,
            "db_path": DB_PATH,
            "llm": llm_status
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Index vault on startup
    print("Starting Obsidian Knowledge Assistant Backend...")
    print(f"Vault path: {VAULT_PATH}")
    print(f"Database path: {DB_PATH}")
    
    # Create vault directory if it doesn't exist
    if not os.path.exists(VAULT_PATH):
        os.makedirs(VAULT_PATH)
        print(f"Created vault directory: {VAULT_PATH}")
    
    # Initial indexing
    indexer.index_vault()
    
    # Start Flask server
    app.run(host='127.0.0.1', port=PORT, debug=True)