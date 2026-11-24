
import { useRef, useState } from "react";

import {
  Search,
  Upload,
  FileText,
  File,
  MoreVertical,
  Filter,
  Trash2,
  X,
  ChevronDown,
  Eye
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function Documents({
  documents,
  setDocuments,
  searchQuery = "",
  setSearchQuery = () => {},
  token
}) {
  const fileInputRef = useRef(null);
  const previewRequestRef = useRef(0);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Search and filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "All" || doc.type === selectedType;

    const matchesStatus =
      selectedStatus === "All" || doc.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";

    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Update one document
  const updateDocument = (id, updates) => {
    setDocuments((previousDocuments) =>
      previousDocuments.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  // Upload PDF with authentication and progress tracking
  const uploadDocument = (doc) => {
    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error("Please log in before uploading documents."));
        return;
      }

      const formData = new FormData();
      formData.append("file", doc.file);

      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${API_BASE_URL}/api/upload`);

      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${token}`
      );

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round(
            (event.loaded / event.total) * 100
          );

          updateDocument(doc.id, {
            uploadProgress: percentage,
            uploadStage:
              percentage >= 100
                ? "Processing PDF..."
                : "Uploading PDF..."
          });
        }
      });

      xhr.upload.addEventListener("load", () => {
        updateDocument(doc.id, {
          uploadProgress: 100,
          uploadStage: "Processing PDF..."
        });
      });

      xhr.addEventListener("load", () => {
        let result = {};

        try {
          result = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error("Invalid response from server."));
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new Error(result.detail || "Document upload failed.")
          );
          return;
        }

        resolve(result);
      });

      xhr.addEventListener("error", () => {
        reject(
          new Error(
            "Network error. Please check your backend server."
          )
        );
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was cancelled."));
      });

      xhr.send(formData);
    });
  };

  // Upload selected PDFs
  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    const validFiles = selectedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".pdf")
    );

    if (validFiles.length === 0) {
      alert("Please select PDF files only.");
      event.target.value = "";
      return;
    }

    const newDocuments = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: "PDF",
      size: formatFileSize(file.size),
      date: new Date().toLocaleDateString("en-IN"),
      status: "Processing",
      uploadProgress: 0,
      uploadStage: "Uploading PDF...",
      file: file,
      backendDocumentId: null
    }));

    setDocuments((previousDocuments) => [
      ...newDocuments,
      ...previousDocuments
    ]);

    event.target.value = "";
    setIsUploading(true);

    const failedUploads = [];

    for (const doc of newDocuments) {
      try {
        const result = await uploadDocument(doc);

        updateDocument(doc.id, {
          status: "Processed",
          uploadProgress: 100,
          uploadStage: "Completed",
          backendDocumentId: result.document_id,
          totalChunks: result.total_chunks
        });
      } catch (error) {
        console.error("Upload error:", error);

        failedUploads.push(`${doc.name}: ${error.message}`);

        updateDocument(doc.id, {
          status: "Failed",
          uploadStage: "Upload failed",
          uploadError: error.message
        });
      }
    }

    setIsUploading(false);

    if (failedUploads.length > 0) {
      alert(
        "Some documents could not be uploaded:\n\n" +
        failedUploads.join("\n")
      );
    }
  };

  // Preview PDF with authentication
  const handlePreview = async (doc) => {
    const requestId = ++previewRequestRef.current;

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPreviewError("");
    setSelectedDocument(doc);
    setOpenMenuId(null);

    // Already available as a local file
    if (doc.type === "PDF" && doc.file) {
      setPreviewUrl(URL.createObjectURL(doc.file));
      setPreviewLoading(false);
      return;
    }

    // Fetch saved PDF from the protected backend
    if (doc.type === "PDF" && doc.backendDocumentId) {
      if (!token) {
        setPreviewError("Please log in to preview this document.");
        return;
      }

      setPreviewLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${doc.backendDocumentId}/preview`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          let result = {};

          try {
            result = await response.json();
          } catch {
            // Response may not contain JSON.
          }

          throw new Error(
            result.detail || "Could not load the PDF preview."
          );
        }

        const pdfBlob = await response.blob();
        const pdfObjectUrl = URL.createObjectURL(pdfBlob);

        // Ignore an older request if the user opened another preview.
        if (requestId !== previewRequestRef.current) {
          URL.revokeObjectURL(pdfObjectUrl);
          return;
        }

        setPreviewUrl(pdfObjectUrl);
      } catch (error) {
        if (requestId === previewRequestRef.current) {
          setPreviewError(error.message);
        }
      } finally {
        if (requestId === previewRequestRef.current) {
          setPreviewLoading(false);
        }
      }

      return;
    }

    setPreviewError(
      "This document is not available in backend storage. Please upload it again."
    );
  };

  // Close preview
  const closePreview = () => {
    previewRequestRef.current += 1;

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedDocument(null);
    setPreviewLoading(false);
    setPreviewError("");
  };

  // Delete document with authentication
  const handleDeleteDocument = async (id) => {
    const documentToDelete = documents.find(
      (doc) => doc.id === id
    );

    if (!documentToDelete || deletingId) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${documentToDelete.name}"?`
    );

    if (!confirmDelete) return;

    setDeletingId(id);
    setOpenMenuId(null);

    try {
      if (documentToDelete.backendDocumentId) {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentToDelete.backendDocumentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok && response.status !== 404) {
          throw new Error(
            result.detail || "Backend document deletion failed."
          );
        }
      }

      if (selectedDocument?.id === id) {
        closePreview();
      }

      setDocuments((previousDocuments) =>
        previousDocuments.filter((doc) => doc.id !== id)
      );

      alert("Document deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);

      alert(
        `Could not delete "${documentToDelete.name}".\n\n${error.message}`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSelectedType("All");
    setSelectedStatus("All");
  };

  return (
    <div className="documents-page">

      <div className="documents-heading">
        <div>
          <h2>My Documents</h2>
          <p>Manage and organize your uploaded documents.</p>
        </div>

        <button
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload size={18} />
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={handleFileUpload}
        />
      </div>

      <div className="documents-toolbar">

        <div className="documents-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
          />

          {searchQuery && (
            <button
              type="button"
              aria-label="Clear document search"
              onClick={() => setSearchQuery("")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#8790a3",
                display: "flex",
                alignItems: "center"
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className={`filter-button ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={17} />
          Filters
          <ChevronDown size={15} />
        </button>

      </div>

      {showFilters && (
        <div className="document-filters">

          <div className="filter-group">
            <label>Document Type</label>

            <select
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value)
              }
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Document Status</label>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Processed">Processed</option>
              <option value="Processing">Processing</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <button
            className="reset-filters-button"
            onClick={resetFilters}
          >
            <X size={15} />
            Reset Filters
          </button>

        </div>
      )}

      <div className="documents-table">

        <div className="documents-table-header">
          <span>DOCUMENT NAME</span>
          <span>SIZE</span>
          <span>DATE UPLOADED</span>
          <span>STATUS</span>
          <span>ACTIONS</span>
        </div>

        {filteredDocuments.map((doc) => (
          <div
            className="documents-table-row"
            key={doc.id}
          >

            <div className="file-name">

              <div className="file-icon">
                {doc.type === "PDF" ? (
                  <FileText size={21} />
                ) : (
                  <File size={21} />
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <button
                  className="document-name-button"
                  onClick={() => handlePreview(doc)}
                >
                  {doc.name}
                </button>

                <span>{doc.type} Document</span>

                {(doc.status === "Processing" ||
                  doc.status === "Failed") && (
                  <div style={{ marginTop: "9px", width: "100%" }}>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "5px",
                        fontSize: "11px",
                        color: "#64748b"
                      }}
                    >
                      <span>
                        {doc.uploadStage || doc.status}
                      </span>

                      {doc.status === "Processing" && (
                        <span>{doc.uploadProgress || 0}%</span>
                      )}
                    </div>

                    <div
                      style={{
                        height: "5px",
                        width: "100%",
                        background: "#e8edf5",
                        borderRadius: "10px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${doc.uploadProgress || 0}%`,
                          background:
                            doc.status === "Failed"
                              ? "#ef4444"
                              : "#3b82f6",
                          borderRadius: "10px",
                          transition: "width 0.2s ease"
                        }}
                      />
                    </div>

                    {doc.uploadError && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#dc2626",
                          marginTop: "5px"
                        }}
                      >
                        {doc.uploadError}
                      </p>
                    )}

                  </div>
                )}
              </div>

            </div>

            <span className="file-size">{doc.size}</span>

            <span className="file-date">{doc.date}</span>

            <span
              className={
                doc.status === "Processed"
                  ? "status-badge status-completed"
                  : doc.status === "Processing"
                    ? "status-badge status-processing"
                    : doc.status === "Failed"
                      ? "status-badge status-failed"
                      : "status-badge status-uploaded"
              }
            >
              {doc.status}
            </span>

            <div className="file-action-wrapper">

              <button
                className="file-action"
                aria-label={`Actions for ${doc.name}`}
                onClick={() =>
                  setOpenMenuId(
                    openMenuId === doc.id ? null : doc.id
                  )
                }
              >
                <MoreVertical size={19} />
              </button>

              {openMenuId === doc.id && (
                <div className="document-action-menu">

                  <button
                    className="preview-document-button"
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye size={16} />
                    Preview Document
                  </button>

                  <button
                    className="delete-document-button"
                    onClick={() => handleDeleteDocument(doc.id)}
                    disabled={
                      deletingId === doc.id ||
                      doc.status === "Processing"
                    }
                  >
                    <Trash2 size={16} />
                    {deletingId === doc.id
                      ? "Deleting..."
                      : "Delete Document"}
                  </button>

                  <button
                    className="close-menu-button"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <X size={16} />
                    Close
                  </button>

                </div>
              )}

            </div>

          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <p style={{ padding: "25px", color: "#8790a3" }}>
            No documents found. Try changing your search or filters.
          </p>
        )}

      </div>

      {selectedDocument && (
        <div className="preview-overlay">

          <div className="preview-modal">

            <div className="preview-header">

              <div className="preview-title">
                <FileText size={22} />

                <div>
                  <h3>{selectedDocument.name}</h3>
                  <span>
                    {selectedDocument.type} · {selectedDocument.size}
                  </span>
                </div>
              </div>

              <button
                className="preview-close-button"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <X size={22} />
              </button>

            </div>

            <div className="preview-content">

              {previewLoading ? (
                <div className="preview-placeholder">
                  <p>Loading PDF preview...</p>
                </div>
              ) : previewError ? (
                <div className="preview-placeholder">
                  <div className="preview-placeholder-icon">
                    <FileText size={42} />
                  </div>

                  <h3>Preview unavailable</h3>
                  <p>{previewError}</p>
                </div>
              ) : previewUrl && selectedDocument.type === "PDF" ? (
                <iframe
                  src={previewUrl}
                  title={selectedDocument.name}
                  className="pdf-preview-frame"
                />
              ) : (
                <div className="preview-placeholder">
                  <div className="preview-placeholder-icon">
                    <FileText size={42} />
                  </div>

                  <h3>{selectedDocument.name}</h3>

                  <p>
                    This document is not available for preview.
                    Please upload the PDF again.
                  </p>

                  <span>
                    File type: {selectedDocument.type}
                  </span>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Documents;
