
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

from .semantic_search import search_document


# Load .env from the main project folder
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MODEL_NAME = "gemini-3.5-flash-lite"


def generate_answer(document_id: str, question: str):

    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    # Retrieve relevant chunks from the selected PDF
    search_results = search_document(
        document_id=document_id,
        query=question,
        top_k=3
    )

    if not search_results:
        return {
            "answer": "No information was found in this document.",
            "sources": []
        }

    # Prepare document context
    context = ""

    for result in search_results:
        context += (
            f"\nPage {result['page']}:\n"
            f"{result['text']}\n"
        )

    # Read Gemini API key
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY not found. Check your .env file."
        )

    # Connect to Gemini
    client = genai.Client(api_key=api_key)

    # Create prompt
    prompt = f"""
You are a document question-answering assistant.

Answer the user's question using only the information
provided in the document context below.

If the answer is not available in the context,
clearly say that the document does not contain
enough information.

Do not invent facts.

DOCUMENT CONTEXT:
{context}

USER QUESTION:
{question}

Provide a clear and simple answer.
"""

    try:
        # Generate answer using Gemini
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        answer = response.text or "No text response was generated."

    finally:
        client.close()

    # Return answer and source information
    return {
        "answer": answer,
        "sources": [
            {
                "page": result["page"],
                "chunk_id": result["chunk_id"]
            }
            for result in search_results
        ]
    }
