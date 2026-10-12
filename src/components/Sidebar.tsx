import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../utils/format";
import type { Role } from "../types";

interface MenuItem {
  to: string;
  label: string;
  icon: typeof FileText;
  end?: boolean;
  roles?: Role[];
}

const MENU_ITEMS: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/reports", label: "Laporan", icon: FileText },
  { to: "/users", label: "Pengguna", icon: Users, roles: ["admin"] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseDrawer: () => void;
  onNavigate: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  onCloseDrawer,
  onNavigate,
  closeRef,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside id="app-sidebar" className="sidebar" aria-label="Panel navigasi">
      <div className="side-head">
        <NavLink to="/dashboard" className="side-brand" onClick={onNavigate}>
          <span className="side-brand-text">Field Report</span>
        </NavLink>
        <button
          type="button"
          className="icon-btn collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Bentangkan sidebar" : "Kecilkan sidebar"}
          aria-label={collapsed ? "Bentangkan sidebar" : "Kecilkan sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
        <button
          type="button"
          ref={closeRef}
          className="icon-btn drawer-close"
          onClick={onCloseDrawer}
          aria-label="Tutup navigasi"
        >
          <X size={18} />
        </button>
      </div>

      <nav aria-label="Navigasi utama" className="side-nav" onClick={onNavigate}>
        <ul>
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <item.icon size={20} aria-hidden="true" />
                <span className="side-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="side-footer">
        {user && (
          <div className="profile-card" title={collapsed ? user.name : undefined}>
            <span className="avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="profile-meta">
              <span className="profile-name">{user.name}</span>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </span>
          </div>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm logout-btn"
          title={collapsed ? "Logout" : undefined}
          onClick={handleLogout}
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="side-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
