
import {
  FileText,
  MessageSquareText,
  HardDrive,
  Clock,
  ArrowUpRight,
  FileSearch,
  Upload,
  Sparkles
} from "lucide-react";

import StatCard from "../components/StatCard";

function Dashboard({ documents, onNavigate }) {

  // Calculate live dashboard statistics
  const totalDocuments = documents.length;

  const processedDocuments = documents.filter(
    (doc) => doc.status === "Processed"
  ).length;

  const processingDocuments = documents.filter(
    (doc) => doc.status === "Processing"
  ).length;

  const failedDocuments = documents.filter(
    (doc) => doc.status === "Failed"
  ).length;

  const recentDocuments = documents.slice(0, 3);

  return (
    <div className="dashboard">

      <div className="welcome-section">
        <div>
          <h2>Welcome back!</h2>
          <p>Here's what's happening with your documents.</p>
        </div>

        <button
          className="upload-button"
          onClick={() => onNavigate("My Documents")}
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      <div className="stats-grid">

        <StatCard
          title="Total Documents"
          value={totalDocuments}
          description="Documents in your workspace"
          icon={FileText}
          color="blue"
        />

        <StatCard
          title="Processed Documents"
          value={processedDocuments}
          description="Documents ready for AI"
          icon={MessageSquareText}
          color="purple"
        />

        <StatCard
          title="Processing Documents"
          value={processingDocuments}
          description="Documents being processed"
          icon={HardDrive}
          color="orange"
        />

        <StatCard
          title="Failed Documents"
          value={failedDocuments}
          description="Documents that failed processing"
          icon={Clock}
          color="green"
        />

      </div>

      <div className="dashboard-content">

        <section className="recent-documents">

          <div className="section-heading">
            <div>
              <h3>Recent Documents</h3>
              <p>Access your recently uploaded files</p>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate("My Documents")}
            >
              View all <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="document-list">

            {recentDocuments.map((doc) => (
              <div className="document-row" key={doc.id}>

                <div className="document-icon">
                  <FileText size={21} />
                </div>

                <div className="document-info">
                  <strong>{doc.name}</strong>
                  <span>
                    {doc.type} Document · {doc.size}
                  </span>
                </div>

                <span className="document-date">
                  {doc.date}
                </span>

                <span
                  className={`status-badge ${
                    doc.status === "Processed"
                      ? "status-completed"
                      : doc.status === "Processing"
                        ? "status-processing"
                        : doc.status === "Failed"
                          ? "status-failed"
                          : "status-uploaded"
                  }`}
                >
                  {doc.status}
                </span>

              </div>
            ))}

            {recentDocuments.length === 0 && (
              <p style={{ padding: "25px", color: "#8790a3" }}>
                No documents yet. Upload your first document!
              </p>
            )}

          </div>

        </section>

        <section className="quick-actions">

          <div className="section-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Get things done faster</p>
            </div>
          </div>

          <div
            className="action-card"
            onClick={() => onNavigate("My Documents")}
            style={{ cursor: "pointer" }}
          >
            <div className="action-icon">
              <Upload size={21} />
            </div>

            <div>
              <strong>Upload a Document</strong>
              <p>Add a PDF or document to your workspace.</p>
            </div>
          </div>

          <div
            className="action-card"
            onClick={() => onNavigate("Ask AI")}
            style={{ cursor: "pointer" }}
          >
            <div className="action-icon purple">
              <Sparkles size={21} />
            </div>

            <div>
              <strong>Ask AI a Question</strong>
              <p>Get answers from your uploaded documents.</p>
            </div>
          </div>

          <div
            className="action-card"
            onClick={() => onNavigate("My Documents")}
            style={{ cursor: "pointer" }}
          >
            <div className="action-icon orange">
              <FileSearch size={21} />
            </div>

            <div>
              <strong>Explore Documents</strong>
              <p>Browse and manage your document library.</p>
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}

export default Dashboard;
