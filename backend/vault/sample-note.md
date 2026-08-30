# Sample Note

This is a sample note to demonstrate the Obsidian Knowledge Assistant.

## Features

The knowledge assistant can:
- Search across all your notes using semantic search
- Generate content based on your existing knowledge
- Work offline using local vector databases

## How it Works

1. **Indexing**: The backend reads all markdown files in your vault
2. **Embeddings**: Text is converted to vector embeddings using sentence transformers
3. **Storage**: Embeddings are stored in ChromaDB for fast retrieval
4. **Search**: Queries are converted to embeddings and matched against your notes
5. **Generation**: The system uses relevant notes as context for generating responses

## Usage Tips

- Write clear, descriptive notes for better search results
- Use frontmatter to add metadata to your notes
- The system works best with English text
- Regular re-indexing ensures search results are up to date