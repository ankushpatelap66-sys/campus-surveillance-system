import { useState } from "react";
import "./Login.css";

function Login({ onBack, onLogin }) {
  // =================================================
  // PAGE MODE
  // =================================================

  const [isRegisterMode, setIsRegisterMode] =
    useState(false);

  // =================================================
  // LOGIN STATE
  // =================================================

  const [loginRole, setLoginRole] =
    useState("admin");

  const [loginEmail, setLoginEmail] =
    useState("");

  const [loginPassword, setLoginPassword] =
    useState("");

  // =================================================
  // REGISTER STATE
  // =================================================

  const [registerRole, setRegisterRole] =
    useState("student");

  const [registerName, setRegisterName] =
    useState("");

  const [registerEmail, setRegisterEmail] =
    useState("");

  const [registerPassword, setRegisterPassword] =
    useState("");

  // =================================================
  // COMMON STATE
  // =================================================

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =================================================
  // LOGIN
  // =================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
            role: loginRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Login failed"
        );
        return;
      }

      // JWT token save
      localStorage.setItem(
        "token",
        data.token
      );

      // Login successful
      onLogin(data.user);
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "Server se connection nahi ho pa raha."
      );
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // REGISTER
  // =================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: registerName,
            email: registerEmail,
            password: registerPassword,
            role: registerRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Registration failed"
        );
        return;
      }

      // =================================================
      // REGISTRATION SUCCESS
      // =================================================

      setError("");

      setMessage(
        data.message ||
          "Registration successful."
      );

      // Login form mein email automatically fill
      setLoginEmail(registerEmail);

      // Requested role login ke liye bhi select rahega
      setLoginRole(registerRole);

      // Password security ke liye clear
      setLoginPassword("");

      // Registration fields clear
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");

      // Login page par switch
      setIsRegisterMode(false);
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      setError(
        "Server se connection nahi ho pa raha."
      );
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // SWITCH LOGIN / REGISTER
  // =================================================

  const switchMode = () => {
    setError("");
    setMessage("");
    setLoading(false);
    setIsRegisterMode(
      !isRegisterMode
    );
  };

  // =================================================
  // REGISTER PAGE
  // =================================================

  if (isRegisterMode) {
    return (
      <div className="login-page">
        <div className="login-container">

          <button
            className="back-btn"
            onClick={onBack}
            type="button"
          >
            ← Back to Home
          </button>

          <div className="login-card">

            <div className="login-logo">
              🚗
            </div>

            <h1>
              Create Account
            </h1>

            <p className="login-subtitle">
              Register for Campus Surveillance System
            </p>

            <form
              onSubmit={
                handleRegister
              }
            >

              {/* NAME */}

              <label>
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={registerName}
                onChange={(e) =>
                  setRegisterName(
                    e.target.value
                  )
                }
                required
              />

              {/* EMAIL */}

              <label>
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={registerEmail}
                onChange={(e) =>
                  setRegisterEmail(
                    e.target.value
                  )
                }
                required
              />

              {/* PASSWORD */}

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={
                  registerPassword
                }
                onChange={(e) =>
                  setRegisterPassword(
                    e.target.value
                  )
                }
                minLength={6}
                required
              />

              {/* ROLE */}

              <label>
                Select Requested Role
              </label>

              <div
                className="role-buttons"
                style={{
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                }}
              >

                {/* STUDENT */}

                <button
                  type="button"
                  className={
                    registerRole ===
                    "student"
                      ? "role active"
                      : "role"
                  }
                  onClick={() =>
                    setRegisterRole(
                      "student"
                    )
                  }
                >
                  👨‍🎓
                  <span>
                    Student
                  </span>
                </button>

                {/* STAFF */}

                <button
                  type="button"
                  className={
                    registerRole ===
                    "staff"
                      ? "role active"
                      : "role"
                  }
                  onClick={() =>
                    setRegisterRole(
                      "staff"
                    )
                  }
                >
                  👨‍💼
                  <span>
                    Staff
                  </span>
                </button>

                {/* SECURITY */}

                <button
                  type="button"
                  className={
                    registerRole ===
                    "security"
                      ? "role active"
                      : "role"
                  }
                  onClick={() =>
                    setRegisterRole(
                      "security"
                    )
                  }
                >
                  👮
                  <span>
                    Security Guard
                  </span>
                </button>

                {/* ADMIN */}

                <button
                  type="button"
                  className={
                    registerRole ===
                    "admin"
                      ? "role active"
                      : "role"
                  }
                  onClick={() =>
                    setRegisterRole(
                      "admin"
                    )
                  }
                >
                  🛡️
                  <span>
                    Admin
                  </span>
                </button>

              </div>

              {/* ROLE INFORMATION */}

              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  background:
                    registerRole ===
                    "student"
                      ? "#ecfdf5"
                      : "#fff7ed",
                  color:
                    registerRole ===
                    "student"
                      ? "#166534"
                      : "#9a3412",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                {registerRole ===
                "student"
                  ? "Student account registration ke baad directly active ho jayega."
                  : "Is role ke liye Admin approval required hoga. Approval se pehle login allowed nahi hoga."}
              </div>

              {/* ERROR */}

              {error && (
                <p
                  style={{
                    color: "#dc2626",
                    marginTop: "12px",
                    fontWeight: "600",
                  }}
                >
                  {error}
                </p>
              )}

              {/* REGISTER BUTTON */}

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            {/* SWITCH TO LOGIN */}

            <p
              style={{
                marginTop: "18px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Already have an account?
              {" "}

              <button
                type="button"
                onClick={
                  switchMode
                }
                style={{
                  border: "none",
                  background: "none",
                  color: "#2563eb",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Login
              </button>
            </p>

            <p className="demo-text">
              Account access is controlled by the
              Campus Surveillance System
            </p>

          </div>
        </div>
      </div>
    );
  }

  // =================================================
  // LOGIN PAGE
  // =================================================

  return (
    <div className="login-page">
      <div className="login-container">

        <button
          className="back-btn"
          onClick={onBack}
          type="button"
        >
          ← Back to Home
        </button>

        <div className="login-card">

          <div className="login-logo">
            🚗
          </div>

          <h1>
            Welcome Back
          </h1>

          <p className="login-subtitle">
            Login to Campus Surveillance System
          </p>

          <form
            onSubmit={handleLogin}
          >

            {/* EMAIL */}

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={loginEmail}
              onChange={(e) =>
                setLoginEmail(
                  e.target.value
                )
              }
              required
            />

            {/* PASSWORD */}

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(e) =>
                setLoginPassword(
                  e.target.value
                )
              }
              required
            />

            {/* ROLE */}

            <label>
              Select Role
            </label>

            <div className="role-buttons">

              {/* ADMIN */}

              <button
                type="button"
                className={
                  loginRole ===
                  "admin"
                    ? "role active"
                    : "role"
                }
                onClick={() =>
                  setLoginRole(
                    "admin"
                  )
                }
              >
                👨‍💼
                <span>
                  Admin
                </span>
              </button>

              {/* SECURITY */}

              <button
                type="button"
                className={
                  loginRole ===
                  "security"
                    ? "role active"
                    : "role"
                }
                onClick={() =>
                  setLoginRole(
                    "security"
                  )
                }
              >
                👮
                <span>
                  Security Guard
                </span>
              </button>

              {/* STAFF */}

              <button
                type="button"
                className={
                  loginRole ===
                  "staff"
                    ? "role active"
                    : "role"
                }
                onClick={() =>
                  setLoginRole(
                    "staff"
                  )
                }
              >
                👨‍💼
                <span>
                  Staff
                </span>
              </button>

              {/* STUDENT */}

              <button
                type="button"
                className={
                  loginRole ===
                  "student"
                    ? "role active"
                    : "role"
                }
                onClick={() =>
                  setLoginRole(
                    "student"
                  )
                }
              >
                👨‍🎓
                <span>
                  Student
                </span>
              </button>

            </div>

            {/* SUCCESS / INFO MESSAGE */}

            {message && (
              <p
                style={{
                  color: "#166534",
                  background:
                    "#ecfdf5",
                  padding: "10px",
                  borderRadius: "8px",
                  marginTop: "12px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {message}
              </p>
            )}

            {/* ERROR */}

            {error && (
              <p
                style={{
                  color: "#dc2626",
                  background:
                    "#fef2f2",
                  padding: "10px",
                  borderRadius: "8px",
                  marginTop: "12px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </p>
            )}

            {/* LOGIN BUTTON */}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          {/* REGISTER LINK */}

          <p
            style={{
              marginTop: "18px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Don't have an account?
            {" "}

            <button
              type="button"
              onClick={
                switchMode
              }
              style={{
                border: "none",
                background: "none",
                color: "#2563eb",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Create Account
            </button>
          </p>

          <p className="demo-text">
            Secure login powered by Campus
            Surveillance System
          </p>

        </div>

      </div>
    </div>
  );
}

export default Login;