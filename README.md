
# DocuMind — AI-Powered Document Intelligence

DocuMind is an AI-powered document intelligence platform that allows users to upload PDF documents, ask natural-language questions, and receive context-aware answers using Retrieval-Augmented Generation (RAG).

## Features

- User registration and login
- Secure, user-specific document access
- PDF upload and processing
- Text extraction and document chunking
- Semantic search using vector embeddings
- AI-powered question answering
- Document preview and deletion
- Separate document libraries for individual users

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Lucide React

### Backend
- Python
- FastAPI
- SQLite
- JWT Authentication
- PyMuPDF
- Tesseract OCR

### AI and RAG
- Google Gemini API
- Sentence Transformers
- ChromaDB
- Semantic Search
- Retrieval-Augmented Generation (RAG)

## Project Structure

```text
DocuMind-AI/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── auth_routes.py
│   ├── database.py
│   ├── embedding_generator.py
│   ├── pdf_reader.py
│   ├── rag_qa.py
│   ├── semantic_search.py
│   ├── text_chunker.py
│   └── vector_store.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11 or newer
- Node.js and npm
- Tesseract OCR
- Gemini API key

### Backend Setup

1. Clone the repository.
2. Create and activate a Python virtual environment.
3. Install the backend dependencies.
4. Create a `.env` file using `.env.example`.
5. Add your own Gemini API key and JWT secret.

Run the backend:

```bash
python -m uvicorn backend.app:app --reload
```

### Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## How It Works

1. A user registers or logs into DocuMind.
2. The user uploads a PDF document.
3. The backend extracts and chunks the document text.
4. Sentence Transformers generate embeddings.
5. ChromaDB stores the document vectors.
6. Semantic search retrieves relevant document chunks.
7. Gemini generates an answer using the retrieved context.

## Team

- Sravya — Frontend development, UI/UX, API integration and testing.
- Tulasi — Backend development, RAG pipeline and AI integration.

## Project Status

Core authentication, PDF processing, document management, user isolation and AI question answering have been tested locally.

Deployment is in progress.
