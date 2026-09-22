import { useState } from "react";

import "./App.css";

import Login from "./Login";
import VehicleRegistration from "./VehicleRegistration";
import EntryExit from "./EntryExit";
import Parking from "./Parking";
import Camera from "./Camera";
import SecurityAlerts from "./SecurityAlerts";
import Reports from "./Reports";
import UserManagement from "./UserManagement";

function App() {
  // =====================================================
  // LOGIN STATE
  // =====================================================

  const [showLogin, setShowLogin] =
    useState(false);

  const [user, setUser] =
    useState(null);

  // =====================================================
  // ACTIVE PAGE
  // =====================================================

  const [activePage, setActivePage] =
    useState("dashboard");

  // =====================================================
  // LOGIN SUCCESS
  // =====================================================

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
    setActivePage("dashboard");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    setUser(null);
    setShowLogin(false);
    setActivePage("dashboard");
  };

  // =====================================================
  // OPEN PAGE
  // =====================================================

  const openPage = (page) => {
    setActivePage(page);
  };

  // =====================================================
  // COMMON NAVBAR FOR LOGGED-IN PAGES
  // =====================================================

  const renderLoggedInNavbar = () => {
    return (
      <nav className="navbar">
        <div className="logo">
          🚗 Campus
          <span>Surveillance</span>
        </div>

        <div className="nav-links">
          <span>
            Welcome, {user?.name}
          </span>

          <button
            className="login-btn"
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            ← Dashboard
          </button>

          <button
            className="login-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
    );
  };

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (showLogin) {
    return (
      <Login
        onBack={() => {
          setShowLogin(false);
          setActivePage("dashboard");
        }}
        onLogin={handleLogin}
      />
    );
  }

  // =====================================================
  // LOGGED-IN USER
  // =====================================================

  if (user) {
    // ===================================================
    // USER MANAGEMENT
    // ADMIN ONLY
    // ===================================================

    if (
      activePage ===
        "user-management" &&
      user.role === "admin"
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <UserManagement />
        </div>
      );
    }

    // ===================================================
    // VEHICLE MANAGEMENT
    // ADMIN ONLY
    // ===================================================

    if (
      activePage ===
        "vehicle-management" &&
      user.role === "admin"
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <VehicleRegistration />
        </div>
      );
    }

    // ===================================================
    // CAMERA
    // ADMIN + SECURITY
    // ===================================================

    if (
      activePage ===
        "camera" &&
      (
        user.role === "admin" ||
        user.role === "security"
      )
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <Camera />
        </div>
      );
    }

    // ===================================================
    // ENTRY / EXIT
    // ADMIN + SECURITY
    // ===================================================

    if (
      activePage ===
        "entry-exit" &&
      (
        user.role === "admin" ||
        user.role === "security"
      )
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <EntryExit />
        </div>
      );
    }

    // ===================================================
    // PARKING
    // ADMIN + SECURITY
    // ===================================================

    if (
      activePage ===
        "parking" &&
      (
        user.role === "admin" ||
        user.role === "security"
      )
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <Parking />
        </div>
      );
    }

    // ===================================================
    // SECURITY ALERTS
    // ADMIN + SECURITY
    // ===================================================

    if (
      activePage ===
        "security-alerts" &&
      (
        user.role === "admin" ||
        user.role === "security"
      )
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <SecurityAlerts />
        </div>
      );
    }

    // ===================================================
    // REPORTS
    // ADMIN ONLY
    // ===================================================

    if (
      activePage ===
        "reports" &&
      user.role === "admin"
    ) {
      return (
        <div className="app">
          {renderLoggedInNavbar()}

          <Reports />
        </div>
      );
    }

    // ===================================================
    // DASHBOARD
    // ===================================================

    return (
      <div className="app">
        {/* =================================================
            NAVBAR
        ================================================= */}

        <nav className="navbar">
          <div className="logo">
            🚗 Campus
            <span>Surveillance</span>
          </div>

          <div className="nav-links">
            <span>
              Welcome, {user.name}
            </span>

            <button
              className="login-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </nav>

        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}

        {user.role === "admin" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <p className="tagline">
                  ADMIN DASHBOARD
                </p>

                <h1>
                  Campus
                  <br />
                  <span>
                    Surveillance Dashboard
                  </span>
                </h1>

                <p className="description">
                  Welcome to your campus
                  security control panel.
                  From here you can manage
                  vehicles, monitor entry and
                  exit, parking, security
                  alerts, reports and user
                  approvals.
                </p>
              </div>

              <div className="vehicle-card">
                <div className="camera-icon">
                  📷
                </div>

                <h2>
                  System Active
                </h2>

                <p>
                  Campus surveillance
                  system is connected.
                </p>

                <div className="status">
                  <span className="status-dot"></span>

                  Logged in as{" "}
                  {user.role}
                </div>
              </div>
            </section>

            <section className="features">
              <div className="section-heading">
                <p>
                  CONTROL PANEL
                </p>

                <h2>
                  Security Management
                </h2>
              </div>

              <div className="feature-grid">
                {/* =========================================
                    VEHICLE MANAGEMENT
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage(
                      "vehicle-management"
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    🚗
                  </div>

                  <h3>
                    Vehicle Management
                  </h3>

                  <p>
                    Register and manage
                    authorized campus
                    vehicles.
                  </p>
                </div>

                {/* =========================================
                    CAMERA
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("camera")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    📷
                  </div>

                  <h3>
                    Camera Monitoring
                  </h3>

                  <p>
                    Monitor the Main Gate
                    camera and OCR vehicle
                    detection.
                  </p>
                </div>

                {/* =========================================
                    ENTRY / EXIT
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("entry-exit")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    🚪
                  </div>

                  <h3>
                    Entry & Exit
                  </h3>

                  <p>
                    Track vehicle movement
                    and entry/exit records.
                  </p>
                </div>

                {/* =========================================
                    PARKING
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("parking")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    🅿️
                  </div>

                  <h3>
                    Parking
                  </h3>

                  <p>
                    Manage occupied and
                    available parking slots.
                  </p>
                </div>

                {/* =========================================
                    SECURITY ALERTS
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage(
                      "security-alerts"
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    ⚠️
                  </div>

                  <h3>
                    Security Alerts
                  </h3>

                  <p>
                    Review unauthorized
                    vehicle security alerts.
                  </p>
                </div>

                {/* =========================================
                    REPORTS
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("reports")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    📊
                  </div>

                  <h3>
                    Reports
                  </h3>

                  <p>
                    View campus vehicle
                    activity and reports.
                  </p>
                </div>

                {/* =========================================
                    USER MANAGEMENT
                    ADMIN ONLY
                ========================================= */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage(
                      "user-management"
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    👥
                  </div>

                  <h3>
                    User Management
                  </h3>

                  <p>
                    Review registration
                    requests and approve
                    or reject user accounts.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            SECURITY DASHBOARD
        ================================================= */}

        {user.role === "security" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <p className="tagline">
                  SECURITY DASHBOARD
                </p>

                <h1>
                  Campus
                  <br />
                  <span>
                    Security Control
                  </span>
                </h1>

                <p className="description">
                  Monitor campus vehicles,
                  entry and exit, parking and
                  security alerts.
                </p>
              </div>

              <div className="vehicle-card">
                <div className="camera-icon">
                  👮
                </div>

                <h2>
                  Security Access
                </h2>

                <p>
                  Security monitoring
                  modules are available.
                </p>

                <div className="status">
                  <span className="status-dot"></span>

                  Logged in as{" "}
                  {user.role}
                </div>
              </div>
            </section>

            <section className="features">
              <div className="section-heading">
                <p>
                  SECURITY CONTROL
                </p>

                <h2>
                  Available Modules
                </h2>
              </div>

              <div className="feature-grid">
                {/* CAMERA */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("camera")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    📷
                  </div>

                  <h3>
                    Camera Monitoring
                  </h3>

                  <p>
                    Monitor Main Gate camera
                    and vehicle detection.
                  </p>
                </div>

                {/* ENTRY EXIT */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("entry-exit")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    🚪
                  </div>

                  <h3>
                    Entry & Exit
                  </h3>

                  <p>
                    Track vehicle movement
                    records.
                  </p>
                </div>

                {/* PARKING */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage("parking")
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    🅿️
                  </div>

                  <h3>
                    Parking
                  </h3>

                  <p>
                    Monitor parking slot
                    availability.
                  </p>
                </div>

                {/* ALERTS */}

                <div
                  className="feature-card"
                  onClick={() =>
                    openPage(
                      "security-alerts"
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="feature-icon">
                    ⚠️
                  </div>

                  <h3>
                    Security Alerts
                  </h3>

                  <p>
                    Review unauthorized
                    vehicle alerts.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            STAFF DASHBOARD
        ================================================= */}

        {user.role === "staff" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <p className="tagline">
                  STAFF PORTAL
                </p>

                <h1>
                  Campus
                  <br />
                  <span>
                    Staff Dashboard
                  </span>
                </h1>

                <p className="description">
                  Welcome to the Campus
                  Surveillance System.
                </p>
              </div>

              <div className="vehicle-card">
                <div className="camera-icon">
                  👨‍💼
                </div>

                <h2>
                  Staff Access
                </h2>

                <p>
                  Your staff account has
                  approved access.
                </p>

                <div className="status">
                  <span className="status-dot"></span>

                  Logged in as{" "}
                  {user.role}
                </div>
              </div>
            </section>

            <section className="features">
              <div className="section-heading">
                <p>
                  CONTROL PANEL
                </p>

                <h2>
                  Staff Portal
                </h2>
              </div>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">
                    👨‍💼
                  </div>

                  <h3>
                    Staff Portal
                  </h3>

                  <p>
                    Staff account features
                    will be available here.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            STUDENT DASHBOARD
        ================================================= */}

        {user.role === "student" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <p className="tagline">
                  STUDENT / STAFF PORTAL
                </p>

                <h1>
                  Campus
                  <br />
                  <span>
                    Surveillance Dashboard
                  </span>
                </h1>

                <p className="description">
                  Welcome to the Campus
                  Surveillance System.
                </p>
              </div>

              <div className="vehicle-card">
                <div className="camera-icon">
                  👤
                </div>

                <h2>
                  {user.name}
                </h2>

                <p>
                  {user.email}
                </p>

                <div className="status">
                  Student
                </div>
              </div>
            </section>

            <section className="features">
              <div className="section-heading">
                <p>
                  CONTROL PANEL
                </p>

                <h2>
                  Available Modules
                </h2>
              </div>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">
                    👨‍🎓
                  </div>

                  <h3>
                    Student / Staff Portal
                  </h3>

                  <p>
                    Your account has limited
                    access. Personal vehicle
                    and campus activity
                    features will be
                    available here.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer>
          <p>
            © 2026 Campus Surveillance System
          </p>

          <p>
            Smart • Secure • Connected
          </p>
        </footer>
      </div>
    );
  }

  // =====================================================
  // LANDING PAGE
  // =====================================================

  return (
    <div className="app">
      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="navbar">
        <div className="logo">
          🚗 Campus
          <span>Surveillance</span>
        </div>

        <div className="nav-links">
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
            className="login-btn"
            onClick={() =>
              setShowLogin(true)
            }
          >
            Login
          </button>
        </div>
      </nav>

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="hero"
        id="home"
      >
        <div className="hero-content">
          <p className="tagline">
            SMART CAMPUS SECURITY
          </p>

          <h1>
            Campus Vehicle
            <br />
            <span>
              Surveillance System
            </span>
          </h1>

          <p className="description">
            Monitor cars and bikes,
            manage campus entry and
            exit, track parking, and
            detect unauthorized
            vehicles from one
            centralized system.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() =>
                setShowLogin(true)
              }
            >
              Get Started
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                setShowLogin(true)
              }
            >
              View Dashboard
            </button>
          </div>
        </div>

        <div className="vehicle-card">
          <div className="camera-icon">
            📷
          </div>

          <h2>
            Vehicle Monitoring
          </h2>

          <p>
            Real-time campus vehicle
            surveillance
          </p>

          <div className="status">
            <span className="status-dot"></span>
            System Active
          </div>
        </div>
      </section>

      {/* =================================================
          FEATURES
      ================================================= */}

      <section
        className="features"
        id="features"
      >
        <div className="section-heading">
          <p>
            OUR FEATURES
          </p>

          <h2>
            Everything You Need for
            Campus Security
          </h2>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              🚗
            </div>

            <h3>
              Vehicle Registration
            </h3>

            <p>
              Register student, staff,
              car and bike information
              securely.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🔢
            </div>

            <h3>
              Number Plate Detection
            </h3>

            <p>
              Detect and identify
              vehicle number plates
              using camera and OCR
              technology.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🚪
            </div>

            <h3>
              Entry & Exit Tracking
            </h3>

            <p>
              Maintain accurate records
              of every vehicle entering
              and leaving the campus.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🅿️
            </div>

            <h3>
              Parking Management
            </h3>

            <p>
              Monitor parking
              availability and manage
              occupied parking spaces.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              ⚠️
            </div>

            <h3>
              Security Alerts
            </h3>

            <p>
              Detect unauthorized
              vehicles and generate
              security alerts.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              📊
            </div>

            <h3>
              Reports & Analytics
            </h3>

            <p>
              View vehicle activity,
              entry history and
              security reports.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        className="about"
        id="about"
      >
        <div>
          <p className="tagline">
            ABOUT THE SYSTEM
          </p>

          <h2>
            Smarter Vehicle Security
            for Modern Campuses
          </h2>

          <p>
            Campus Surveillance
            System helps colleges and
            universities manage vehicle
            movement and improve campus
            security through a
            centralized digital platform.
          </p>
        </div>

        <div className="stats">
          <div>
            <strong>
              24/7
            </strong>

            <span>
              Monitoring
            </span>
          </div>

          <div>
            <strong>
              100%
            </strong>

            <span>
              Digital Records
            </span>
          </div>

          <div>
            <strong>
              AI
            </strong>

            <span>
              Vehicle Detection
            </span>
          </div>
        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>
        <p>
          © 2026 Campus Surveillance System
        </p>

        <p>
          Smart • Secure • Connected
        </p>
      </footer>
    </div>
  );
}

export default App;