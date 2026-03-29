import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function buildNavigation(role) {
  if (role === "admin") {
    return [
      { to: "/admin", label: "Overview" },
      { to: "/admin/journeys", label: "Journeys" },
      { to: "/admin/swaps", label: "Swap Monitor" },
      { to: "/app/notifications", label: "Notifications" }
    ];
  }

  return [
    { to: "/app/dashboard", label: "Dashboard" },
    { to: "/app/swaps", label: "Swap Requests" },
    { to: "/app/notifications", label: "Notifications" },
    { to: "/verify", label: "Verify Journey" }
  ];
}

function AppShell({ title, subtitle, actions, unreadCount = 0, children }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const navigation = buildNavigation(user.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand brand--stacked">
          <span className="brand__mark">SS</span>
          <div>
            <span className="brand__name brand__name--dark">SeatSync</span>
            <p className="brand__tagline">Verified travel exchanges</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__card">
          <span className="eyebrow">Live inbox</span>
          <strong>{unreadCount} unread notifications</strong>
          <p>Seat maps, requests, and consent state refresh automatically without websockets.</p>
        </div>
      </aside>

      <div className="app-shell__main">
        <header className="topbar">
          <div>
            <span className="eyebrow">{user.role === "admin" ? "Admin console" : "Passenger console"}</span>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="topbar__actions">
            {actions}
            <div className="user-chip">
              <span>{user.name}</span>
              <small>{user.role}</small>
            </div>
            <button className="button button--ghost" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        <div className="app-shell__body">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;
