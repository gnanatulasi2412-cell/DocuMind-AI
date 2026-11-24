import os
from pathlib import Path
from uuid import uuid4, UUID

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from .embedding_generator import generate_embeddings_for_pdf
from .vector_store import store_embeddings, get_chroma_client
from .rag_qa import generate_answer

from .database import (
    DATA_DIR,
    initialize_database,
    save_document,
    get_user_document,
    get_user_documents,
    delete_document_record
)

from .auth_routes import router as auth_router
from .auth_routes import get_current_user


app = FastAPI(
    title="DocuMind API",
    description="AI-powered Document Intelligence System",
    version="1.0.0"
)

# Frontend URLs allowed to communicate with this backend
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.on_event("startup")
def startup_event():
    initialize_database()


UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 20 * 1024 * 1024


class AskRequest(BaseModel):
    document_id: str = Field(min_length=1)
    question: str = Field(min_length=1, max_length=2000)


@app.get("/")
def home():
    return {
        "message": "Welcome to DocuMind API!",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "message": "DocuMind backend is working!"
    }


# Get only the logged-in user's documents
@app.get("/api/documents")
def list_documents(user: dict = Depends(get_current_user)):

    documents = get_user_documents(user["id"])

    return {
        "documents": documents,
        "total": len(documents)
    }


# Upload a PDF for the logged-in user
@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):

    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File is too large. Maximum size is 20 MB."
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF."
        )

    document_id = str(uuid4())
    filename = Path(file.filename).name

    file_path = UPLOAD_DIR / f"{document_id}.pdf"
    file_path.write_bytes(content)

    collection_name = "doc_" + document_id.replace("-", "_")

    try:
        chunks = await run_in_threadpool(
            generate_embeddings_for_pdf,
            str(file_path)
        )

        if not chunks:
            raise HTTPException(
                status_code=422,
                detail="No readable text could be extracted from this PDF."
            )

        storage_result = await run_in_threadpool(
            store_embeddings,
            document_id,
            chunks
        )

        save_document(
            document_id=document_id,
            user_id=user["id"],
            filename=filename,
            file_size=len(content),
            total_chunks=storage_result["total_chunks"]
        )

        return {
            "message": "PDF uploaded and processed successfully!",
            "document_id": document_id,
            "filename": filename,
            "file_size": len(content),
            "total_chunks": storage_result["total_chunks"],
            "status": "indexed"
        }

    except HTTPException:
        file_path.unlink(missing_ok=True)
        raise

    except Exception as error:
        print(f"PDF processing error: {error}")

        try:
            client = get_chroma_client()
            await run_in_threadpool(
                client.delete_collection,
                collection_name
            )
        except Exception:
            pass

        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail="PDF processing failed. Please try again."
        )


# Preview only documents owned by the logged-in user
@app.get("/api/documents/{document_id}/preview")
async def preview_document(
    document_id: str,
    user: dict = Depends(get_current_user)
):

    try:
        UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID."
        )

    document = get_user_document(document_id, user["id"])

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    file_path = UPLOAD_DIR / f"{document_id}.pdf"

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="PDF file not found."
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=document["filename"],
        content_disposition_type="inline"
    )


# Ask questions only about documents owned by the logged-in user
@app.post("/api/ask")
async def ask_document(
    request: AskRequest,
    user: dict = Depends(get_current_user)
):

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:
        UUID(request.document_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID."
        )

    document = get_user_document(
        request.document_id,
        user["id"]
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found in your account."
        )

    file_path = UPLOAD_DIR / f"{request.document_id}.pdf"

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file not found."
        )

    try:
        result = await run_in_threadpool(
            generate_answer,
            request.document_id,
            request.question.strip()
        )

        return {
            "document_id": request.document_id,
            "question": request.question,
            "answer": result["answer"],
            "sources": result["sources"],
            "status": "success"
        }

    except Exception as error:
        print(f"Question answering error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to generate an answer. Please try again."
        )


# Delete only documents owned by the logged-in user
@app.delete("/api/documents/{document_id}")
async def delete_document(
    document_id: str,
    user: dict = Depends(get_current_user)
):

    try:
        UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID."
        )

    document = get_user_document(document_id, user["id"])

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found in your account."
        )

    file_path = UPLOAD_DIR / f"{document_id}.pdf"

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file not found."
        )

    try:
        collection_name = "doc_" + document_id.replace("-", "_")

        client = get_chroma_client()

        await run_in_threadpool(
            client.delete_collection,
            collection_name
        )

        await run_in_threadpool(file_path.unlink)

        delete_document_record(
            document_id,
            user["id"]
        )

        return {
            "message": "Document and embeddings deleted successfully!",
            "document_id": document_id,
            "status": "deleted"
        }

    except Exception as error:
        print(f"Document deletion error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to delete the document. Please try again."
        )
