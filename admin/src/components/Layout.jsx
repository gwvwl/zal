import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/layout.module.css";

const NAV = [
  { to: "/", icon: "\u{1F4CA}", label: "Dashboard", end: true },
  { to: "/gyms", icon: "\u{1F3CB}", label: "Зали" },
  { to: "/workers", icon: "\u{1F465}", label: "Працівники" },
  { to: "/presets", icon: "\u{1F4CB}", label: "Абонементи" },
  { to: "/clients", icon: "\u{1F464}", label: "Клієнти" },
  { to: "/audit", icon: "\u{1F4DD}", label: "Аудит" },
];

const PAGE_TITLES = {
  "/": "Dashboard",
  "/gyms": "Управління залами",
  "/workers": "Управління працівниками",
  "/presets": "Пресети абонементів",
  "/clients": "Клієнти",
  "/audit": "Аудит-лог",
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminData = JSON.parse(localStorage.getItem("admin_data") || "{}");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    navigate("/login", { replace: true });
  }

  const pageTitle = PAGE_TITLES[location.pathname] || "Admin";

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>ZAL</div>
          <div className={styles.sidebarSub}>Admin Panel</div>
        </div>
        <nav className={styles.sidebarNav}>
          {NAV?.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.adminName}>{adminData.name || "Admin"}</div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Вийти
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <button
            className={styles.burger}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
