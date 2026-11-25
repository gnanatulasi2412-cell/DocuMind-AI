
import os
import sys
import uuid
import tempfile
import base64
from pathlib import Path

import streamlit as st

# ---------- PROJECT SETUP ----------
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Keep prototype data separate from original project data
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
os.environ["DATA_DIR"] = str(DATA_DIR)

from backend.embedding_generator import generate_embeddings_for_pdf
from backend.vector_store import store_embeddings
from backend.rag_qa import generate_answer


# ---------- PAGE CONFIG ----------
st.set_page_config(
    page_title="DocuMind AI",
    page_icon="📚",
    layout="wide"
)


# ---------- STYLING ----------
st.markdown("""
<style>
.stApp {
    background-color: #0E1117;
    color: #F0F2F6;
}

.block-container {
    padding-top: 2rem;
    max-width: 1100px;
}

[data-testid="stSidebar"] {
    background-color: #161B22;
}

.hero {
    padding: 25px;
    border-radius: 18px;
    background: linear-gradient(135deg, #1D3557, #432371);
    margin-bottom: 25px;
}

.hero h1 {
    color: white;
    font-size: 40px;
}

.hero p {
    color: #E0E0E0;
    font-size: 17px;
}

div[data-testid="stChatMessage"] {
    border-radius: 15px;
    padding: 15px;
}

.stButton button {
    border-radius: 10px;
    height: 45px;
    font-weight: 600;
}

.small-text {
    color: #9CA3AF;
    font-size: 14px;
}
</style>
""", unsafe_allow_html=True)


# ---------- SESSION STATE ----------
if "document_id" not in st.session_state:
    st.session_state.document_id = None

if "document_name" not in st.session_state:
    st.session_state.document_name = None

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

if "pdf_bytes" not in st.session_state:
    st.session_state.pdf_bytes = None

if "document_size" not in st.session_state:
    st.session_state.document_size = 0


# ---------- SIDEBAR ----------
with st.sidebar:

    st.markdown("## 📚 DocuMind AI")
    st.caption("Your intelligent document assistant")

    st.divider()

    uploaded_file = st.file_uploader(
        "Upload your PDF",
        type=["pdf"]
    )

    if uploaded_file:

        st.caption(f"📄 {uploaded_file.name}")

        if st.button(
            "⚡ Process Document",
            use_container_width=True
        ):

            document_id = str(uuid.uuid4())

            with st.spinner("Reading and processing document..."):

                with tempfile.NamedTemporaryFile(
                    delete=False,
                    suffix=".pdf"
                ) as temp_file:

                    temp_file.write(uploaded_file.getvalue())
                    temp_path = temp_file.name

                try:

                    chunks = generate_embeddings_for_pdf(temp_path)

                    store_embeddings(
                        document_id=document_id,
                        chunks=chunks
                    )

                    st.session_state.document_id = document_id
                    st.session_state.document_name = uploaded_file.name
                    st.session_state.chat_history = []
                    st.session_state.pdf_bytes = uploaded_file.getvalue()
                    st.session_state.document_size = uploaded_file.size

                    st.success("Document processed successfully!")

                except Exception as e:
                    st.error(f"Processing failed: {e}")

                finally:

                    if os.path.exists(temp_path):
                        os.remove(temp_path)

    st.divider()

    # Current document information
    if st.session_state.document_id:

        st.markdown("### 📄 Current Document")

        st.write(
            f"**Name:** {st.session_state.document_name}"
        )

        file_size = st.session_state.get("document_size", 0)
        size_kb = file_size / 1024

        st.caption(f"📦 File size: {size_kb:.1f} KB")

        st.success("Ready to chat")

        # New Chat button
        if st.button(
            "🆕 New Chat",
            use_container_width=True
        ):

            st.session_state.chat_history = []
            st.rerun()

        # Clear Document button
        if st.button(
            "🗑️ Clear Document",
            use_container_width=True
        ):

            st.session_state.document_id = None
            st.session_state.document_name = None
            st.session_state.chat_history = []
            st.session_state.pdf_bytes = None
            st.session_state.document_size = 0

            st.rerun()

    st.divider()

    st.markdown(
        '<p class="small-text">Powered by Gemini AI & ChromaDB</p>',
        unsafe_allow_html=True
    )


# ---------- MAIN AREA ----------
st.markdown("""
<div class="hero">
    <h1>📚 DocuMind AI</h1>
    <p>Your intelligent document assistant.</p>
    <p>Upload a PDF and ask questions. Get answers based on your document.</p>
</div>
""", unsafe_allow_html=True)


# ---------- WELCOME SCREEN ----------
if not st.session_state.document_id:

    st.markdown("### 👋 Welcome!")

    st.info(
        "Upload a PDF from the sidebar and click "
        "'Process Document' to get started."
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("### 📄")
        st.markdown("**Upload Documents**")
        st.caption("Upload PDF files for AI analysis.")

    with col2:
        st.markdown("### 🔎")
        st.markdown("**Smart Search**")
        st.caption("Find relevant information in your document.")

    with col3:
        st.markdown("### 🤖")
        st.markdown("**Ask AI**")
        st.caption("Ask questions in natural language.")


# ---------- DOCUMENT CHAT ----------
else:

    st.markdown(
        f"### 💬 Chat with {st.session_state.document_name}"
    )

    st.caption("Ask questions about the contents of your document.")


    # PDF Preview
    with st.expander("📖 Preview uploaded PDF"):

        if st.session_state.pdf_bytes:

            pdf_base64 = base64.b64encode(
                st.session_state.pdf_bytes
            ).decode("utf-8")

            pdf_display = f"""
            <iframe
                src="data:application/pdf;base64,{pdf_base64}"
                width="100%"
                height="600"
                type="application/pdf">
            </iframe>
            """

            st.markdown(
                pdf_display,
                unsafe_allow_html=True
            )

        else:

            st.info("Upload and process a PDF to preview it.")


    # Suggested Questions
    with st.expander("✨ Suggested questions"):

        st.markdown("""
        - Summarize this document.
        - Explain the main concepts in simple words.
        - What are the important topics in this document?
        - Give me a list of key points.
        - Explain the document section by section.
        """)


    # Display chat history
    for message in st.session_state.chat_history:

        with st.chat_message(message["role"]):

            st.markdown(message["content"])

            if message.get("sources"):

                with st.expander("📑 Sources"):

                    for page in message["sources"]:
                        st.write(f"Page {page}")


    # Chat input
    question = st.chat_input(
        "Ask something about your PDF..."
    )


    # Process question
    if question:

        st.session_state.chat_history.append({
            "role": "user",
            "content": question
        })

        with st.chat_message("user"):
            st.markdown(question)


        # AI response
        with st.chat_message("assistant"):

            with st.spinner("Thinking..."):

                try:

                    result = generate_answer(
                        document_id=st.session_state.document_id,
                        question=question
                    )

                    answer = result["answer"]

                    sources = [
                        source["page"]
                        for source in result.get("sources", [])
                    ]

                    st.markdown(answer)

                    if sources:

                        with st.expander("📑 Sources"):

                            for page in sources:
                                st.write(f"Page {page}")


                    st.session_state.chat_history.append({
                        "role": "assistant",
                        "content": answer,
                        "sources": sources
                    })


                except Exception as e:

                    error_message = f"Something went wrong: {e}"

                    st.error(error_message)

                    st.session_state.chat_history.append({
                        "role": "assistant",
                        "content": error_message
                    })