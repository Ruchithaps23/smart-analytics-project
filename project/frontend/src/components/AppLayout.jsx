import { useState } from "react";
import Icon from "./Icon";
import StatusBadge from "./StatusBadge";
import { NAV_GROUPS, PAGE_TITLES } from "./navigationConfig";

export function AppLayout({ activePage, onNavigate, onRefresh, alertCount, loading, error, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(pageId) {
    onNavigate(pageId);
    setMobileOpen(false);
  }

  const activeItem = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === activePage);
  const isPreviewPage = activeItem?.availability === "preview";
  const isPartialPage = activeItem?.availability === "partial";

  return (
    <div className={`saas-app ${collapsed ? "is-sidebar-collapsed" : ""} ${mobileOpen ? "is-mobile-nav-open" : ""}`}>
      <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /></div>
          <div className="brand-wordmark"><strong>SDADIS</strong><small>Decision intelligence</small></div>
          <button className="collapse-sidebar-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"}>
            <span>{collapsed ? "›" : "‹"}</span>
          </button>
          <button className="close-mobile-sidebar" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div className="sidebar-nav-group" key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button key={item.id} className={`sidebar-nav-item ${activePage === item.id ? "is-active" : ""}`} onClick={() => navigate(item.id)} title={`${item.label} · ${item.availability === "preview" ? "Frontend preview" : item.availability === "partial" ? "Partial API data" : "Live API data"}`} aria-current={activePage === item.id ? "page" : undefined}>
                  <Icon name={item.icon} />
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.availability !== "live" && <span className={`nav-preview-mark ${item.availability === "partial" ? "nav-partial-mark" : ""}`} aria-label={item.availability === "partial" ? "Partial API data" : "Frontend preview"}>{item.availability === "partial" ? "Partial" : "Preview"}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-live-key"><span className="live-key-dot" /><span>Live API</span><span className="partial-key">Partial API</span><span className="preview-key">Preview</span></div>
          <div className="sidebar-account" aria-label="SDADIS workspace">
            <span className="account-monogram">S</span><span className="account-copy"><strong>SDADIS workspace</strong><small>Business intelligence</small></span><span className="account-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-context">
            <button className="mobile-menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
            <span className="header-root">SDADIS</span><span className="header-separator">/</span><strong>{PAGE_TITLES[activePage] || "Executive Dashboard"}</strong>
          </div>
          <div className="header-toolbar">
            <StatusBadge tone={isPreviewPage ? "preview" : loading ? "pending" : error ? "critical" : isPartialPage ? "pending" : "live"} dot>{isPreviewPage ? "Frontend preview" : loading ? "Refreshing" : error ? "Connection issue" : isPartialPage ? "Partial API data" : "Live API"}</StatusBadge>
            <button className="header-icon-button notifications-trigger" onClick={() => navigate("alerts")} aria-label={`Open alerts, ${alertCount} available`} title="View alerts">
              <Icon name="alerts" />{alertCount > 0 && <span className="notification-pip">{alertCount > 99 ? "99+" : alertCount}</span>}
            </button>
            <button className={`header-refresh-button ${loading ? "is-loading" : ""}`} onClick={onRefresh} disabled={loading}><span className="refresh-symbol">↻</span><span>Refresh</span></button>
          </div>
        </header>
        <div className="app-content">{children}</div>
        <footer className="app-footer"><span>SDADIS <i>·</i> Business decision intelligence</span><span>Connected views are labeled <b>Live Data</b>; preview states are marked.</span></footer>
      </main>
    </div>
  );
}
