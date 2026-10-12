import { Menu } from "lucide-react";
import type { RefObject } from "react";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../utils/format";

interface TopbarProps {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  hamburgerRef: RefObject<HTMLButtonElement | null>;
}

export default function Topbar({ drawerOpen, onOpenDrawer, hamburgerRef }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <button
        type="button"
        ref={hamburgerRef}
        className="icon-btn"
        onClick={onOpenDrawer}
        aria-label="Buka navigasi"
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <span className="topbar-brand">Field Report</span>
      {user && (
        <span className="avatar avatar-sm" title={user.name} aria-hidden="true">
          {initials(user.name)}
        </span>
      )}
    </header>
  );
}
