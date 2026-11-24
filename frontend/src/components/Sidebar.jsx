
import {
  LayoutDashboard,
  Files,
  MessageSquareText,
  Settings,
  CircleHelp,
  Sparkles,
  FilePlus2
} from "lucide-react";

function Sidebar({ activePage, onNavigate, user }) {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard
    },
    {
      name: "My Documents",
      icon: Files
    },
    {
      name: "Ask AI",
      icon: MessageSquareText
    }
  ];

  const bottomItems = [
    {
      name: "Settings",
      icon: Settings
    },
    {
      name: "Help & Support",
      icon: CircleHelp
    }
  ];

  const displayName = user?.name || "User";

  const avatarLetter = displayName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <aside className="sidebar">

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Sparkles size={23} />
        </div>

        <div>
          <h2>DocuMind</h2>
          <span>DOCUMENT INTELLIGENCE</span>
        </div>
      </div>

      {/* New document button */}
      <button
        className="new-document-btn"
        onClick={() => onNavigate("My Documents")}
      >
        <FilePlus2 size={18} />
        <span>New Document</span>
      </button>

      {/* Main navigation */}
      <div className="sidebar-section">
        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => onNavigate(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom navigation */}
      <div className="sidebar-bottom">
        {bottomItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className="nav-item"
              onClick={() => onNavigate(item.name)}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          );
        })}

        {/* Logged-in user profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {avatarLetter}
          </div>

          <div className="profile-info">
            <strong>{displayName}</strong>
            <span>{user?.email || "Free Workspace"}</span>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;
