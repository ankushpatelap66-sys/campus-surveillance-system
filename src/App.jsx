import { useEffect, useState } from "react";
import "./App.css";

import Login from "./Login";
import VehicleRegistration from "./VehicleRegistration";
import EntryExit from "./EntryExit";
import Parking from "./Parking";
import Camera from "./Camera";
import SecurityAlerts from "./SecurityAlerts";
import Reports from "./Reports";
import UserManagement from "./UserManagement";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    roles: ["admin", "security", "staff", "student"],
  },
  {
    id: "vehicle-management",
    label: "Vehicle Management",
    icon: "▣",
    roles: ["admin"],
  },
  {
    id: "camera",
    label: "Camera Monitoring",
    icon: "▮",
    roles: ["admin", "security"],
  },
  {
    id: "entry-exit",
    label: "Entry & Exit",
    icon: "⇥",
    roles: ["admin", "security"],
  },
  {
    id: "parking",
    label: "Parking",
    icon: "P",
    roles: ["admin", "security"],
  },
  {
    id: "security-alerts",
    label: "Security Alerts",
    icon: "▲",
    roles: ["admin", "security"],
    badge: 3,
  },
  {
    id: "reports",
    label: "Reports",
    icon: "▥",
    roles: ["admin","security"],
  },
  {
    id: "user-management",
    label: "User Management",
    icon: "♟",
    roles: ["admin"],
  },
];

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
    setActivePage("dashboard");
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setActivePage("dashboard");
    setSidebarOpen(false);
  };

  const canAccess = (page) => {
    if (!user) return false;

    const item = NAV_ITEMS.find((entry) => entry.id === page);

    return item ? item.roles.includes(user.role) : false;
  };

  const openPage = (page) => {
    if (canAccess(page)) {
      setActivePage(page);
      setSidebarOpen(false);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const renderPage = () => {
    if (!user || activePage === "dashboard") {
      return null;
    }

    switch (activePage) {
      case "vehicle-management":
        return user.role === "admin" ? <VehicleRegistration /> : null;

      case "camera":
        return ["admin", "security"].includes(user.role) ? (
          <Camera />
        ) : null;

      case "entry-exit":
        return ["admin", "security"].includes(user.role) ? (
          <EntryExit />
        ) : null;

      case "parking":
        return ["admin", "security"].includes(user.role) ? (
          <Parking />
        ) : null;

      case "security-alerts":
        return ["admin", "security"].includes(user.role) ? (
          <SecurityAlerts />
        ) : null;

      case "reports":
  return ["admin", "security"].includes(user.role) ? (
    <Reports />
  ) : null;

      case "user-management":
        return user.role === "admin" ? <UserManagement /> : null;

      default:
        return null;
    }
  };

  if (showLogin) {
    return (
      <Login
        onBack={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
    );
  }

  if (!user) {
    return <PublicLanding onLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className="dashboard-app">
      <DashboardHeader
        user={user}
        onLogout={handleLogout}
      />

      <button
        className="mobile-menu-button"
        type="button"
        aria-label="Open menu"
        onClick={() => setSidebarOpen((value) => !value)}
      >
        ☰
      </button>

      {sidebarOpen && (
        <button
          className="mobile-sidebar-overlay"
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dashboard-body">
        <DashboardSidebar
          user={user}
          activePage={activePage}
          sidebarOpen={sidebarOpen}
          openPage={openPage}
        />

        <main className="dashboard-main">
          <div className="dashboard-content">
            {activePage === "dashboard" ? (
              <>
                <DashboardHero />

                <DashboardHome
                  user={user}
                  openPage={openPage}
                />
              </>
            ) : (
              <div className="module-page-content">
                {renderPage()}
              </div>
            )}
          </div>

          <DashboardFooter />
        </main>
      </div>
    </div>
  );
}

function DashboardHeader({ user, onLogout }) {
  return (
    <header className="dashboard-header">
      <div className="university-header-brand">
        <div className="header-cvru-logo">
          <img
            src="/cvru-logo.png"
            alt="CVRU"
          />
        </div>

        <div className="university-name">
          <strong>
            DR. C. V. RAMAN UNIVERSITY
          </strong>

          <span>VAISHALI, BIHAR</span>
        </div>
      </div>

      <div className="header-project-brand">
        <div className="header-car-icon">
          ▰
        </div>

        <div>
          <div className="project-name">
            Campus<span>Surveillance</span>
          </div>

          <div className="project-subtitle">
            Smart Vehicle Monitoring &amp; Campus Security
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-online">
          <span />
          System Online
        </div>

        <button
          className="header-action"
          type="button"
          aria-label="Security"
        >
          ♢
        </button>

        <button
          className="header-action header-notification"
          type="button"
          aria-label="Notifications"
        >
          ♟
          <b>3</b>
        </button>

        <div className="header-separator" />

        <div className="header-user">
          <div className="header-avatar">
            {(user.name || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user.name || "Ankush Patel"}
            </strong>

            <span>
              {user.role === "admin"
                ? "Administrator"
                : user.role}
            </span>
          </div>

          <span className="header-chevron">
            ⌄
          </span>
        </div>

        <button
          className="header-logout"
          type="button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function DashboardSidebar({
  user,
  activePage,
  openPage,
  sidebarOpen,
}) {
  return (
    <aside
      className={`dashboard-sidebar ${
        sidebarOpen ? "is-open" : ""
      }`}
    >
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          if (!item.roles.includes(user.role)) {
            return null;
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${
                activePage === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() => openPage(item.id)}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>

              {item.badge ? (
                <em>{item.badge}</em>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-system-status">
        <span className="sidebar-label">
          SYSTEM STATUS
        </span>

        <div className="sidebar-online-row">
          <span className="large-online-dot" />

          <div>
            <strong>Online</strong>
            <span>
              All systems operational
            </span>
          </div>
        </div>
      </div>

      <div className="sidebar-bottom-brand">
        <div className="campus-line-art">
          ▱ ▱ ▱ ▱ ▱
        </div>

        <strong>
          DR. C. V. RAMAN UNIVERSITY
        </strong>

        <span>VAISHALI, BIHAR</span>
      </div>
    </aside>
  );
}

function DashboardHero() {
  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-overlay" />

      <div className="dashboard-hero-content">
        <span className="hero-kicker">
          CAMPUS SURVEILLANCE SYSTEM
        </span>

        <h1>
          Smart Vehicle Monitoring &amp;
          <br />
          <span>Campus Security</span>
        </h1>

        <p>
          A centralized platform for vehicle
          registration, camera monitoring,
          <br className="desktop-only" />
          entry &amp; exit tracking, parking
          management and security alerts.
        </p>

        <div className="hero-location">
          <b>●</b>

          <span>
            Dr. C. V. Raman University
          </span>

          <i>•</i>

          <span>Vaishali, Bihar</span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   LIVE DASHBOARD
   MongoDB data comes through:
   /api/automation/dashboard-summary
   ========================================================= */

function DashboardHome({ user, openPage }) {
  const [dashboardData, setDashboardData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchDashboardData = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Login session expired."
        );
        setLoading(false);
        return;
      }

      const API_BASE =
        import.meta.env.VITE_API_URL;

      if (!API_BASE) {
        throw new Error(
          "VITE_API_URL is not configured."
        );
      }

      const response = await fetch(
        `${API_BASE}/automation/dashboard-summary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      const data = contentType.includes(
        "application/json"
      )
        ? await response.json()
        : {
            success: false,
            message: await response.text(),
          };

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Dashboard data load nahi ho saka."
        );
      }

      setDashboardData(data);
      setError("");
    } catch (err) {
      console.error(
        "DASHBOARD FETCH ERROR:",
        err
      );

      setError(
        err.message ||
          "Dashboard data load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const summary =
    dashboardData?.summary || {
      totalVehicles: 0,
      insideCampus: 0,
      parkingOccupied: 0,
      parkingCapacity: 120,
      activeAlerts: 0,
    };

  const activity =
    dashboardData?.activity || [];

  const alerts =
    dashboardData?.alerts || [];

  const lastDetection =
    dashboardData?.lastDetection || null;

  const camera =
    dashboardData?.camera || {
      status: "Online",
      ocrStatus: "Ready",
      name: "Main Gate",
    };

  const formatTime = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getActivityIcon = (icon) => {
    switch (icon) {
      case "entry":
        return "⇥";

      case "logout":
      case "exit":
        return "⇤";

      case "alert":
        return "▲";

      case "parking":
        return "P";

      default:
        return "●";
    }
  };

  const getAlertSeverity = (severity) => {
    const value = String(
      severity || "medium"
    ).toLowerCase();

    if (value === "high") {
      return "high";
    }

    if (value === "low") {
      return "low";
    }

    return "medium";
  };

  const getAlertPriority = (severity) => {
    const value = String(
      severity || "Medium"
    ).toLowerCase();

    if (value === "high") {
      return "High Priority";
    }

    if (value === "low") {
      return "Low Priority";
    }

    return "Medium Priority";
  };

  const getCameraAction = () => {
    if (!lastDetection) {
      return "WAITING FOR DETECTION";
    }

    const status = String(
      lastDetection.status || ""
    ).toUpperCase();

    if (
      status === "IN" ||
      status === "INSIDE CAMPUS" ||
      status === "ENTRY"
    ) {
      return "ENTRY RECORDED";
    }

    if (
      status === "OUT" ||
      status === "EXIT" ||
      status === "EXITED CAMPUS"
    ) {
      return "EXIT RECORDED";
    }

    if (
      lastDetection.action
    ) {
      return String(
        lastDetection.action
      ).toUpperCase();
    }

    return "DETECTION RECORDED";
  };

  return (
    <>
      {error && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fff4f4",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <section className="dashboard-stats">
        <StatCard
          icon="▣"
          title="Total Vehicles"
          value={
            loading
              ? "..."
              : summary.totalVehicles
          }
          subtitle="Registered Vehicles"
          change="LIVE"
          tone="blue"
        />

        <StatCard
          icon="⇥"
          title="Inside Campus"
          value={
            loading
              ? "..."
              : summary.insideCampus
          }
          subtitle="Currently Inside"
          change="LIVE"
          tone="green"
        />

        <StatCard
          icon="P"
          title="Parking Occupied"
          value={
            loading
              ? "..."
              : `${summary.parkingOccupied} / ${summary.parkingCapacity}`
          }
          subtitle="Slots Occupied"
          change="LIVE"
          tone="orange"
        />

        <StatCard
          icon="▲"
          title="Security Alerts"
          value={
            loading
              ? "..."
              : String(
                  summary.activeAlerts
                ).padStart(2, "0")
          }
          subtitle="Active Alerts"
          change="LIVE"
          tone="red"
        />
      </section>

      <section className="dashboard-grid">
        <section className="dashboard-panel activity-panel">
          <PanelTitle
            icon="◔"
            title="Recent Campus Activity"
          />

          <div className="activity-table">
            <div className="activity-row activity-heading">
              <span>Time</span>
              <span>Vehicle No.</span>
              <span>Event</span>
              <span>Location</span>
              <span>Status</span>
            </div>

            {activity.length === 0 ? (
              <div
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                {loading
                  ? "Loading live activity..."
                  : "No campus activity recorded yet."}
              </div>
            ) : (
              activity.map((row) => (
                <div
                  className="activity-row"
                  key={row.id}
                >
                  <span className="activity-time">
                    <b>
                      {getActivityIcon(
                        row.icon
                      )}
                    </b>

                    {formatTime(row.time)}
                  </span>

                  <strong>
                    {row.vehicleNumber ||
                      "-"}
                  </strong>

                  <span
                    className={
                      row.tone === "danger"
                        ? "red-text"
                        : ""
                    }
                  >
                    {row.event || "-"}
                  </span>

                  <span>
                    {row.location || "-"}
                  </span>

                  <em
                    className={`activity-status ${
                      row.tone || "info"
                    }`}
                  >
                    {row.status || "-"}
                  </em>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-panel alerts-panel">
          <PanelTitle
            icon="▲"
            title="Recent Security Alerts"
            danger
          />

          <div className="alert-list">
            {alerts.length === 0 ? (
              <div
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                {loading
                  ? "Loading security alerts..."
                  : "No active security alerts."}
              </div>
            ) : (
              alerts.map((row) => (
                <article
                  className="alert-row"
                  key={row.id}
                >
                  <div className="alert-thumb">
                    <img
                      src="/cvru-campus.png"
                      alt="Security Alert"
                    />
                  </div>

                  <div className="alert-info">
                    <span
                      className={`alert-priority ${getAlertSeverity(
                        row.severity
                      )}`}
                    >
                      {row.priority ||
                        getAlertPriority(
                          row.severity
                        )}
                    </span>

                    <strong>
                      {row.type ||
                        "Security Alert"}
                    </strong>

                    <span>
                      {row.vehicleNumber ||
                        "Unknown Vehicle"}{" "}
                      <i>•</i>{" "}
                      {row.location ||
                        "Main Gate"}
                    </span>

                    <small>
                      {formatTime(row.time)}
                    </small>
                  </div>

                  <b className="alert-arrow">
                    ›
                  </b>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="dashboard-side-column">
          <AdminAccessCard
            user={user}
            openPage={openPage}
          />

          <LiveCameraCard
            camera={camera}
            lastDetection={lastDetection}
            getCameraAction={
              getCameraAction
            }
          />
        </aside>
      </section>
    </>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  change,
  tone,
}) {
  return (
    <article
      className={`stat-card ${tone}`}
    >
      <div className="stat-main">
        <div className="stat-icon">
          {icon}
        </div>

        <div>
          <h3>{title}</h3>

          <strong>{value}</strong>

          <span>{subtitle}</span>
        </div>
      </div>

      <div className="stat-bottom">
        <b>
          {change === "LIVE"
            ? "● LIVE"
            : `↑ ${change}`}
        </b>

        <div className="stat-sparkline">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}

function PanelTitle({
  icon,
  title,
  danger,
}) {
  return (
    <div className="panel-title">
      <h2
        className={
          danger ? "danger-title" : ""
        }
      >
        <span>{icon}</span>
        {title}
      </h2>

      <button type="button">
        View All →
      </button>
    </div>
  );
}

function AdminAccessCard({
  user,
  openPage,
}) {
  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <div className="admin-shield">
          ♢
        </div>

        <div>
          <h2>
            Administrator Access
          </h2>

          <p>
            Full system administration and
            <br />
            campus security management.
          </p>
        </div>
      </div>

      <div className="admin-user">
        <div className="admin-avatar">
          {(user.name || "A")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <strong>
            {user.name || "Ankush Patel"}
          </strong>

          <span>
            {user.email ||
              "ankush@gmail.com"}
          </span>
        </div>

        <em>
          <span />
          Active
        </em>
      </div>

      <div className="quick-links">
        <h3>QUICK LINKS</h3>

        <button
          type="button"
          onClick={() =>
            openPage("dashboard")
          }
        >
          ▣
          <span>
            View All Modules
          </span>
          <b>›</b>
        </button>

        {user.role === "admin" && (
          <button type="button">
            ⚙
            <span>
              System Settings
            </span>
            <b>›</b>
          </button>
        )}

        <button type="button">
          ?
          <span>
            Help &amp; Support
          </span>
          <b>›</b>
        </button>
      </div>
    </section>
  );
}

function LiveCameraCard({
  camera,
  lastDetection,
  getCameraAction,
}) {
  const vehicleNumber =
    lastDetection?.vehicleNumber ||
    "Waiting for detection";

  return (
    <section className="live-camera-card">
      <div className="live-camera-title">
        <h2>
          <span>●</span>
          Live Camera -{" "}
          {camera?.name || "Main Gate"}
        </h2>

        <em>● LIVE</em>
      </div>

      <div className="camera-preview">
        <img
          src="/main-gate-camera.jpg"
          alt="Main Gate"
          onError={(e) => {
            e.currentTarget.src =
              "/cvru-campus.png";
          }}
        />

        <b>{vehicleNumber}</b>
      </div>

      <div className="camera-meta">
        <div>
          <span>Camera Status</span>

          <strong>
            <i />
            {camera?.status || "Online"}
          </strong>
        </div>

        <div>
          <span>OCR Status</span>

          <strong>
            <i />
            {camera?.ocrStatus || "Ready"}
          </strong>
        </div>

        <div>
          <span>Last Detection</span>

          <strong>
            {lastDetection?.vehicleNumber ||
              "No detection yet"}
          </strong>
        </div>

        <div>
          <span>Action</span>

          <strong className="camera-action">
            {getCameraAction
              ? getCameraAction()
              : "WAITING FOR DETECTION"}
          </strong>
        </div>
      </div>
    </section>
  );
}

function DashboardFooter() {
  return (
    <footer className="dashboard-footer">
      <div>
        <span>
          CAMPUS SURVEILLANCE SYSTEM
        </span>

        <strong>
          Dr. C. V. Raman University,
          Vaishali, Bihar
        </strong>
      </div>

      <div className="footer-divider" />

      <div>
        <span>Developed By</span>

        <strong>
          ANKUSH PATEL &amp; NEELMANI SINGH
        </strong>

        <small>
          B.Tech – Computer Science &amp;
          Engineering
        </small>
      </div>

      <div className="footer-motto">
        Safe Campus&nbsp; • &nbsp;Secure Future
      </div>
    </footer>
  );
}

function PublicLanding({ onLogin }) {
  return (
    <div className="public-site">
      <nav className="public-navbar">
        <div className="public-brand">
          <img
            src="/cvru-logo.png"
            alt="CVRU"
          />

          <div>
            <strong>
              DR. C. V. RAMAN UNIVERSITY
            </strong>

            <span>
              VAISHALI, BIHAR
            </span>
          </div>

          <div className="public-divider" />

          <div className="public-project">
            <strong>
              Campus<span>Surveillance</span>
            </strong>

            <small>
              Smart Vehicle Monitoring &amp;
              Campus Security
            </small>
          </div>
        </div>

        <div className="public-links">
          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#about">
            About
          </a>

          <button
            type="button"
            onClick={onLogin}
          >
            Login
          </button>
        </div>
      </nav>

      <section
        className="public-hero"
        id="home"
      >
        <div className="public-hero-overlay" />

        <div className="public-hero-content">
          <span>
            DR. C. V. RAMAN UNIVERSITY
          </span>

          <p>
            SMART CAMPUS SECURITY
          </p>

          <h1>
            Campus Vehicle
            <br />
            <b>
              Surveillance System
            </b>
          </h1>

          <p className="public-description">
            Monitor cars and bikes, manage
            campus entry and exit, track
            parking, and detect unauthorized
            vehicles from one centralized
            system.
          </p>

          <div>
            <button
              type="button"
              onClick={onLogin}
            >
              Get Started
            </button>

            <button
              type="button"
              className="outline"
              onClick={onLogin}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      <section
        className="public-features"
        id="features"
      >
        <p>OUR FEATURES</p>

        <h2>
          Everything You Need for Campus Security
        </h2>

        <div className="public-feature-grid">
          <FeatureCard
            icon="▣"
            title="Vehicle Registration"
            text="Register student, staff, car and bike information securely."
          />

          <FeatureCard
            icon="123"
            title="Number Plate Detection"
            text="Detect and identify vehicle number plates using camera and OCR technology."
          />

          <FeatureCard
            icon="⇥"
            title="Entry & Exit Tracking"
            text="Maintain accurate records of every vehicle entering and leaving the campus."
          />

          <FeatureCard
            icon="P"
            title="Parking Management"
            text="Monitor parking availability and manage occupied parking spaces."
          />

          <FeatureCard
            icon="▲"
            title="Security Alerts"
            text="Detect unauthorized vehicles and generate security alerts."
          />

          <FeatureCard
            icon="▥"
            title="Reports & Analytics"
            text="View vehicle activity, entry history and security reports."
          />
        </div>
      </section>

      <section
        className="public-about"
        id="about"
      >
        <div>
          <p>
            ABOUT THE SYSTEM
          </p>

          <h2>
            Smarter Vehicle Security for Modern Campuses
          </h2>

          <span>
            Campus Surveillance System helps
            colleges and universities manage
            vehicle movement and improve campus
            security through a centralized digital
            platform.
          </span>
        </div>

        <div className="public-stats">
          <div>
            <strong>24/7</strong>
            <span>Monitoring</span>
          </div>

          <div>
            <strong>100%</strong>
            <span>Digital Records</span>
          </div>

          <div>
            <strong>AI</strong>
            <span>Vehicle Detection</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <article>
      <div>{icon}</div>

      <h3>{title}</h3>

      <p>{text}</p>
    </article>
  );
}

export default App;