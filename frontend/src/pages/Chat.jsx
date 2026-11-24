
import { useEffect, useState } from "react";

import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  ChevronDown,
  CheckCircle2
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function Chat({ documents = [], token }) {
  const [message, setMessage] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm DocuMind AI. Select a processed PDF and ask me anything about its contents!",
    },
  ]);

  // Only show documents successfully indexed by the backend
  const processedDocuments = documents.filter(
    (doc) => doc.status === "Processed" && doc.backendDocumentId
  );

  const selectedDocument = processedDocuments.find(
    (doc) => doc.backendDocumentId === selectedDocumentId
  );

  // Clear selection if the selected document is deleted
  useEffect(() => {
    if (
      selectedDocumentId &&
      !processedDocuments.some(
        (doc) => doc.backendDocumentId === selectedDocumentId
      )
    ) {
      setSelectedDocumentId("");
    }
  }, [documents, selectedDocumentId]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    if (!token) {
      alert("Please log in to use DocuMind AI.");
      return;
    }

    if (!selectedDocumentId) {
      alert("Please select a processed PDF first.");
      return;
    }

    const question = message.trim();

    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: selectedDocumentId,
          question: question,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Could not get an answer.");
      }

      const sources =
        result.sources?.length > 0
          ? "\n\nSources: " +
            result.sources
              .map((source) => `Page ${source.page}`)
              .filter(
                (page, index, pages) => pages.indexOf(page) === index
              )
              .join(", ")
          : "";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: result.answer + sources,
        },
      ]);
    } catch (error) {
      console.error("Chat API error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page">

      <div className="chat-heading">
        <div>
          <h2>Ask AI</h2>
          <p>Get intelligent answers from your documents.</p>
        </div>

        <div className="chat-ai-badge">
          <Sparkles size={18} />
          <span>AI Assistant</span>
        </div>
      </div>

      <div className="chat-container">

        <div className="chat-document-selector">

          <div className="document-selector-icon">
            <FileText size={21} />
          </div>

          <div className="document-selector-content">

            <label htmlFor="chat-document-select">
              Choose your document
            </label>

            <div className="document-select-wrapper">

              <select
                id="chat-document-select"
                value={selectedDocumentId}
                onChange={(e) =>
                  setSelectedDocumentId(e.target.value)
                }
                disabled={processedDocuments.length === 0 || isLoading}
              >
                <option value="">
                  Select a processed PDF
                </option>

                {processedDocuments.map((doc) => (
                  <option
                    key={doc.id}
                    value={doc.backendDocumentId}
                  >
                    {doc.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="document-select-chevron"
              />

            </div>

            <span className="document-selector-hint">
              {processedDocuments.length === 0
                ? "Upload and process a PDF to start asking questions."
                : `${processedDocuments.length} processed PDF${
                    processedDocuments.length === 1 ? "" : "s"
                  } available`}
            </span>

          </div>

          {selectedDocument && (
            <div className="selected-document-indicator">
              <CheckCircle2 size={17} />
              <span>Selected</span>
            </div>
          )}

        </div>

        <div className="chat-messages">

          {messages.map((msg, index) => (
            <div
              className={`chat-message ${msg.role}`}
              key={index}
            >

              <div className="chat-message-icon">
                {msg.role === "assistant" ? (
                  <Bot size={20} />
                ) : (
                  <User size={20} />
                )}
              </div>

              <div className="chat-message-content">

                <span>
                  {msg.role === "assistant" ? "DocuMind AI" : "You"}
                </span>

                <p style={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </p>

              </div>

            </div>
          ))}

          {isLoading && (
            <div className="chat-message assistant">

              <div className="chat-message-icon">
                <Bot size={20} />
              </div>

              <div className="chat-message-content">
                <span>DocuMind AI</span>
                <p>Thinking... Please wait.</p>
              </div>

            </div>
          )}

        </div>

        <div className="chat-input-area">

          <div className="chat-input-box">

            <input
              type="text"
              placeholder={
                selectedDocument
                  ? "Ask anything about your selected PDF..."
                  : "Select a processed PDF first..."
              }
              value={message}
              disabled={isLoading}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              aria-label="Send question"
            >
              <Send size={18} />
            </button>

          </div>

          <p className="chat-disclaimer">
            Answers are generated using your selected document.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Chat;
