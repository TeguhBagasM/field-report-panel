import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useMediaQuery } from "../hooks/useMediaQuery";

const COLLAPSE_KEY = "fr-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    if (raw !== null) return raw === "1";
  } catch {
    /* penyimpanan tak tersedia, pakai default viewport */
  }
  return window.matchMedia("(max-width: 1023px)").matches;
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const wasDrawerOpen = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* abaikan, preferensi hanya tambahan */
    }
  }, [collapsed]);

  const showDrawer = drawerOpen && isMobile;

  // Kunci scroll body saat drawer terbuka.
  useEffect(() => {
    if (!showDrawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDrawer]);

  // Fokus masuk ke drawer saat dibuka, kembali ke hamburger saat ditutup.
  useEffect(() => {
    if (showDrawer && !wasDrawerOpen.current) closeRef.current?.focus();
    if (!showDrawer && wasDrawerOpen.current) hamburgerRef.current?.focus();
    wasDrawerOpen.current = showDrawer;
  }, [showDrawer]);

  // Escape menutup drawer.
  useEffect(() => {
    if (!showDrawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showDrawer]);

  const handleToggleCollapse = useCallback(() => setCollapsed((v) => !v), []);
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);
  const handleNavClick = useCallback(() => setDrawerOpen(false), []);

  return (
    <div
      className={
        `app-shell${collapsed ? " is-collapsed" : ""}` + (showDrawer ? " drawer-open" : "")
      }
    >
      <Topbar
        drawerOpen={showDrawer}
        onOpenDrawer={() => setDrawerOpen(true)}
        hamburgerRef={hamburgerRef}
      />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        onCloseDrawer={handleCloseDrawer}
        onNavigate={handleNavClick}
        closeRef={closeRef}
      />
      {showDrawer && (
        <div className="drawer-backdrop" onClick={handleCloseDrawer} aria-hidden="true" />
      )}
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
