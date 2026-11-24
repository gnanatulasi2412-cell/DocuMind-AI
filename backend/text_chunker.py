
from .pdf_reader import (
    extract_text_from_pdf,
    extract_images_text_from_pdf
)


def chunk_text(text, chunk_size=500, overlap=100):

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be between zero and chunk_size.")

    chunks = []

    start = 0
    chunk_id = 1

    while start < len(text):

        end = start + chunk_size

        chunk = text[start:end]

        if chunk.strip():
            chunks.append({
                "chunk_id": chunk_id,
                "text": chunk
            })

        chunk_id += 1
        start = end - overlap

    return chunks


def process_pdf_into_chunks(file_path: str):

    normal_pages = extract_text_from_pdf(file_path)
    image_pages = extract_images_text_from_pdf(file_path)

    all_chunks = []

    for normal, image in zip(normal_pages, image_pages):

        combined_text = (
            normal["text"] + "\n" + image["image_text"]
        )

        page_chunks = chunk_text(combined_text)

        for chunk in page_chunks:

            chunk["page"] = normal["page"]
            chunk["chunk_id"] = len(all_chunks) + 1

            all_chunks.append(chunk)

    return all_chunks
