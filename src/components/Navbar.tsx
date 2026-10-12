import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/reports" className="brand">
          Field Report
        </NavLink>
        <nav className="nav-links">
          <NavLink
            to="/reports"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Laporan
          </NavLink>
          {user?.role === "admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Users
            </NavLink>
          )}
        </nav>
        <div className="nav-user">
          {user && (
            <>
              <span className="nav-username">{user.name}</span>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
