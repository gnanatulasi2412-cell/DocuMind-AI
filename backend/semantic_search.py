
from .embedding_generator import get_embedding_model
from .vector_store import get_document_collection


def search_document(document_id: str, query: str, top_k: int = 3):

    if not query or not query.strip():
        raise ValueError("Search query cannot be empty.")

    # Get the correct document collection
    collection = get_document_collection(document_id)

    total_chunks = collection.count()

    if total_chunks == 0:
        return []

    # Load the shared embedding model
    model = get_embedding_model()

    # Convert question into an embedding
    query_embedding = model.encode(query).tolist()

    # Search for similar chunks
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, total_chunks)
    )

    # Prepare search results
    search_results = []

    for i in range(len(results["documents"][0])):

        search_results.append({
            "page": results["metadatas"][0][i]["page"],
            "chunk_id": results["metadatas"][0][i]["chunk_id"],
            "text": results["documents"][0][i],
            "distance": results["distances"][0][i]
        })

    return search_results
