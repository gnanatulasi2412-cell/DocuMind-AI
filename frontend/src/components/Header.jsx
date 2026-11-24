
import { useState } from "react";

import {
  Search,
  Bell,
  ChevronDown,
  X,
  LogOut,
  User,
  FileText,
  Check
} from "lucide-react";

function Header({
  activePage,
  searchQuery = "",
  onSearchChange = () => {},
  user,
  onLogout = () => {}
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const pageDescriptions = {
    Dashboard: "Welcome back! Here's what's happening in your workspace.",
    "My Documents": "Manage and organize all your documents in one place.",
    "Ask AI": "Ask questions and get intelligent answers from your documents.",
    Settings: "Manage your account and workspace preferences.",
    "Help & Support": "Find help and learn how to use DocuMind."
  };

  const displayName = user?.name || "User";

  const avatarLetter = displayName
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onSearchChange("");
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((previous) => !previous);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications((previous) => !previous);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout();
  };

  return (
    <header className="top-header">

      <div className="header-title">
        <h1>{activePage}</h1>

        <p>
          {pageDescriptions[activePage] ||
            "Welcome to your document workspace."}
        </p>
      </div>

      <div className="header-actions">

        {/* Search */}
        <div className="header-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            aria-label="Search documents"
          />

          {searchQuery ? (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <span className="search-shortcut">⌘ K</span>
          )}
        </div>

        {/* Notifications */}
        <div className="header-dropdown-wrapper">

          <button
            className="notification-btn"
            aria-label="Notifications"
            type="button"
            onClick={toggleNotifications}
          >
            <Bell size={20} />

            {!notificationsRead && (
              <span className="notification-dot"></span>
            )}
          </button>

          {showNotifications && (
            <div className="header-dropdown notification-dropdown">

              <div className="dropdown-heading">
                <div>
                  <h3>Notifications</h3>
                  <p>Your workspace updates</p>
                </div>

                <button
                  type="button"
                  className="dropdown-close"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="notification-item">
                <div className="notification-icon">
                  <FileText size={17} />
                </div>

                <div>
                  <strong>Welcome to DocuMind!</strong>
                  <p>
                    Upload a PDF to begin exploring your documents.
                  </p>
                </div>
              </div>

              {notificationsRead ? (
                <div className="notification-empty">
                  You're all caught up!
                </div>
              ) : (
                <button
                  type="button"
                  className="mark-read-button"
                  onClick={() => setNotificationsRead(true)}
                >
                  <Check size={15} />
                  Mark as read
                </button>
              )}

            </div>
          )}

        </div>

        {/* User profile */}
        <div className="header-dropdown-wrapper">

          <button
            type="button"
            className="header-user"
            onClick={toggleProfileMenu}
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="header-avatar">
              {avatarLetter}
            </div>

            <ChevronDown size={16} />
          </button>

          {showProfileMenu && (
            <div className="header-dropdown profile-dropdown">

              <div className="profile-dropdown-user">

                <div className="header-avatar">
                  {avatarLetter}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <span>{user?.email || ""}</span>
                </div>

              </div>

              <div className="dropdown-divider"></div>

              <div className="profile-account-info">
                <User size={16} />
                <span>My Account</span>
              </div>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Sign Out
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Header;
