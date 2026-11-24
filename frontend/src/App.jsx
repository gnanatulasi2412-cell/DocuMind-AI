
import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import API_BASE_URL from "./config";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const [token, setToken] = useState(
    () => sessionStorage.getItem("documind_token")
  );

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Load documents belonging to the logged-in user.
  const loadDocuments = async (accessToken) => {
    const response = await fetch(
      `${API_BASE_URL}/api/documents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Could not load your documents.");
    }

    const result = await response.json();

    const formattedDocuments = (result.documents || []).map((doc) => ({
      id: doc.document_id,
      backendDocumentId: doc.document_id,
      name: doc.filename,
      type: "PDF",
      size: `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB`,
      date: doc.created_at,
      status: "Processed",
      totalChunks: doc.total_chunks,
    }));

    setDocuments(formattedDocuments);
  };

  // Verify an existing login session.
  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Your login session has expired.");
        }

        const result = await response.json();

        if (!isActive) return;

        setUser(result.user);

        await loadDocuments(token);
      } catch (error) {
        if (!isActive) return;

        console.error("Session restoration failed:", error);

        sessionStorage.removeItem("documind_token");
        setToken(null);
        setUser(null);
        setDocuments([]);
      } finally {
        if (isActive) {
          setIsCheckingAuth(false);
        }
      }
    };

    restoreSession();

    return () => {
      isActive = false;
    };
  }, [token]);

  // Handle successful login or signup.
  const handleLogin = async (result) => {
    try {
      const accessToken = result.access_token;

      sessionStorage.setItem("documind_token", accessToken);

      setToken(accessToken);
      setUser(result.user);
      setActivePage("Dashboard");

      await loadDocuments(accessToken);
    } catch (error) {
      console.error("Could not load account documents:", error);
      setDocuments([]);
    }
  };

  // Handle logout.
  const handleLogout = () => {
    sessionStorage.removeItem("documind_token");

    setToken(null);
    setUser(null);
    setDocuments([]);
    setSearchQuery("");
    setActivePage("Dashboard");
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (value.trim()) {
      setActivePage("My Documents");
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <Dashboard
            documents={documents}
            onNavigate={setActivePage}
          />
        );

      case "My Documents":
        return (
          <Documents
            documents={documents}
            setDocuments={setDocuments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            token={token}
          />
        );

      case "Ask AI":
        return (
          <Chat
            documents={documents}
            token={token}
          />
        );

      default:
        return (
          <Dashboard
            documents={documents}
            onNavigate={setActivePage}
          />
        );
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="auth-page">
        <p>Checking your login session...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
      />

      <main className="main-content">
        <Header
          activePage={activePage}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          user={user}
          onLogout={handleLogout}
        />

        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
