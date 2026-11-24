
from sentence_transformers import SentenceTransformer
from .text_chunker import process_pdf_into_chunks


# Keep one shared model instance
_model = None


def get_embedding_model():
    global _model

    if _model is None:
        print("Loading embedding model...")

        _model = SentenceTransformer("all-MiniLM-L6-v2")

        print("Embedding model loaded successfully!")

    return _model


def generate_embeddings(chunks):

    if not chunks:
        return []

    model = get_embedding_model()

    texts = [chunk["text"] for chunk in chunks]

    print("Generating embeddings...")

    embeddings = model.encode(texts)

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i].tolist()

    print(f"Generated {len(chunks)} embeddings.")

    return chunks


def generate_embeddings_for_pdf(file_path: str):

    chunks = process_pdf_into_chunks(file_path)

    chunks_with_embeddings = generate_embeddings(chunks)

    return chunks_with_embeddings
