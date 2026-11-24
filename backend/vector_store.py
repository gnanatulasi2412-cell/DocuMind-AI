
import chromadb

from .database import DATA_DIR


# Store ChromaDB inside the configurable persistent data directory.
CHROMA_DIR = DATA_DIR / "chroma_db"

CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# Reuse one ChromaDB client.
_client = None


def get_chroma_client():

    global _client

    if _client is None:
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR)
        )

    return _client


# Get a separate collection for each uploaded document.
def get_document_collection(document_id: str):

    client = get_chroma_client()

    collection_name = (
        "doc_" + document_id.replace("-", "_")
    )

    collection = client.get_or_create_collection(
        name=collection_name
    )

    return collection


# Store chunks and their embeddings.
def store_embeddings(document_id: str, chunks: list):

    if not chunks:
        raise ValueError("No chunks available to store.")

    collection = get_document_collection(document_id)

    collection.upsert(
        ids=[
            f"chunk_{chunk['chunk_id']}"
            for chunk in chunks
        ],

        documents=[
            chunk["text"]
            for chunk in chunks
        ],

        embeddings=[
            chunk["embedding"]
            for chunk in chunks
        ],

        metadatas=[
            {
                "document_id": document_id,
                "page": chunk["page"],
                "chunk_id": chunk["chunk_id"]
            }
            for chunk in chunks
        ]
    )

    return {
        "document_id": document_id,
        "collection_name": collection.name,
        "total_chunks": collection.count(),
        "status": "stored"
    }


# Retrieve a document's collection.
def get_collection_by_document_id(document_id: str):

    client = get_chroma_client()

    collection_name = (
        "doc_" + document_id.replace("-", "_")
    )

    return client.get_collection(
        name=collection_name
    )
