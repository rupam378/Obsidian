# RAG Setup Guide - Full AI-Powered Generation

This guide explains how to set up full Retrieval-Augmented Generation (RAG) with local LLM integration for the Obsidian Knowledge Assistant.

## What is RAG?

RAG (Retrieval-Augmented Generation) combines:
1. **Retrieval**: Finding relevant documents from your vault using semantic search
2. **Augmented Generation**: Using those documents as context for an LLM to generate intelligent responses

## Current Implementation Status

- ✅ **Retrieval**: Fully implemented with semantic search
- ✅ **Context-Aware Prompts**: Proper RAG prompt engineering
- ✅ **Local LLM Integration**: llama.cpp support for offline AI generation
- ✅ **Fallback System**: Template-based generation when LLM not configured

## Setting Up Local LLM

### Step 1: Choose a Model

Recommended models for local use (download from [HuggingFace](https://huggingface.co/TheBloke)):

**For Balanced Performance/Quality:**
- `LLaMA-2-7B-Chat-GGUF` (4.3GB) - Good balance of speed and quality
- `Mistral-7B-Instruct-GGUF` (4.1GB) - Excellent performance, smaller size

**For Better Quality (slower):**
- `LLaMA-2-13B-Chat-GGUF` (8.0GB) - Higher quality responses
- `Mixtral-8x7B-GGUF` (26GB) - Best quality, requires more RAM

**For Maximum Speed:**
- `Phi-3-mini-GGUF` (2.3GB) - Very fast, decent quality
- `TinyLlama-1.1B-Chat-GGUF` (1.0GB) - Fastest, basic quality

### Step 2: Download the Model

Example using direct download:
```bash
# Example: Download LLaMA-2-7B-Chat (4-bit quantized)
# Visit: https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF
# Download: llama-2-7b-chat.Q4_K_M.gguf
```

### Step 3: Configure in `.env`

Edit `backend/.env`:
```env
# Path to your downloaded GGUF model
LLM_MODEL_PATH=C:\Models\llama-2-7b-chat.Q4_K_M.gguf

# Context window size (higher = more context, more memory)
LLM_N_CTX=2048

# Number of CPU threads for inference
LLM_N_THREADS=4
```

### Step 4: Restart Backend

Stop and restart the backend using `START_BACKEND.bat`. You should see:
```
LLM loaded from C:\Models\llama-2-7b-chat.Q4_K_M.gguf
```

## How RAG Works in This System

### 1. Query Processing
```
User Query → Embedding Generation → Vector Search
```

### 2. Context Retrieval
```
Vector Search → Top-K Relevant Documents → Context Assembly
```

### 3. Prompt Engineering
```
System Prompt + User Query + Retrieved Context → LLM Input
```

### 4. Response Generation
```
LLM Inference → Context-Aware Response → User Display
```

## Example RAG Pipeline

**User Query:** "What are the main features of the knowledge assistant?"

**Retrieval Phase:**
1. Convert query to embedding
2. Search vector database for similar notes
3. Retrieve top 3 most relevant documents

**Context Assembly:**
```
Document: sample-note.md
Content: # Sample Note... The knowledge assistant can search across all your notes...

Document: features.md  
Content: # Features... Semantic search, content generation...
```

**Prompt Generation:**
```
System: You are a helpful knowledge assistant that answers questions based on provided context...

User: Context from personal notes: [retrieved documents]
Question: What are the main features of the knowledge assistant?
Answer:
```

**LLM Response:**
```
Based on your notes, the knowledge assistant has several main features:

1. Semantic Search - It can search across all your notes using natural language queries
2. Content Generation - It can generate insights and content based on your vault knowledge  
3. Offline Capability - Uses local vector database and embeddings
4. Obsidian Integration - Side panel interface within the app
```

## Performance Optimization

### Memory Management
- **Context Size**: Reduce `LLM_N_CTX` if you have limited RAM
- **Model Size**: Use smaller quantized models (Q4_K_M, Q3_K_M)
- **Thread Count**: Set `LLM_N_THREADS` to your CPU core count

### Speed Optimization
- **Model Choice**: Smaller models generate faster
- **Quantization**: Q4_K_M offers good speed/quality balance
- **Context Limit**: Smaller context = faster generation

### Quality Optimization
- **Model Size**: Larger models (13B+) provide better responses
- **Context Size**: More context = better understanding
- **Prompt Engineering**: The system uses optimized prompts

## Troubleshooting

### LLM Won't Load
- **Issue**: Model path incorrect or file corrupted
- **Solution**: Verify path in `.env` and re-download model

### Out of Memory
- **Issue**: Model too large for available RAM
- **Solution**: Use smaller model or reduce `LLM_N_CTX`

### Slow Generation
- **Issue**: Model too large or CPU limited
- **Solution**: Use smaller model, increase threads, or use GPU (if available)

### Poor Quality Responses
- **Issue**: Insufficient context or small model
- **Solution**: Increase `LLM_N_CTX`, use larger model, or improve note quality

## Comparison: Template vs RAG

### Template-Based (Fallback)
- **Speed**: Instant
- **Quality**: Basic concatenation of retrieved text
- **Requirements**: No LLM needed
- **Use Case**: Quick reference, simple queries

### Full RAG with LLM
- **Speed**: 5-30 seconds per response
- **Quality**: AI-powered synthesis and reasoning
- **Requirements**: Local LLM model (4-8GB RAM)
- **Use Case**: Complex queries, synthesis, explanations

## Advanced Configuration

### Custom System Prompts
You can modify the system prompt in `backend/app.py` to customize the AI's behavior:

```python
system_prompt = """You are a specialized assistant for [your domain].
Focus on [specific aspects] and provide [type of responses]."""
```

### Context Window Tuning
- **Research**: 4096+ tokens for comprehensive analysis
- **Daily Use**: 2048 tokens for balanced performance
- **Quick Queries**: 1024 tokens for fast responses

### Multiple Models
You can switch between models by changing `LLM_MODEL_PATH` and restarting.

## Future Enhancements

Potential improvements for the RAG system:

- [ ] Streaming responses for better UX
- [ ] Conversation history/context
- [ ] Multi-step reasoning
- [ ] Citation generation
- [ ] GPU acceleration support
- [ ] Model fine-tuning on personal notes