import { useState } from "react";
import "./Login.css";

function Login({ onBack, onLogin }) {
  // =================================================
  // PAGE MODE
  // =================================================

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isVerificationMode, setIsVerificationMode] = useState(false);

  // =================================================
  // LOGIN STATE
  // =================================================

  const [loginRole, setLoginRole] = useState("admin");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // =================================================
  // REGISTER STATE
  // =================================================

  const [registerRole, setRegisterRole] = useState("student");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // =================================================
  // EMAIL VERIFICATION STATE
  // =================================================

  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // =================================================
  // COMMON STATE
  // =================================================

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // =================================================
  // LOGIN
  // =================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!loginEmail || !loginPassword) {
      setError("Email aur password enter karein.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          role: loginRole,
        }),
      });

      const data = await response.json();

      // IMPORTANT:
      // Normal LOGIN must never open the OTP/verification screen.
      // Email verification is completed immediately after REGISTRATION.
      // If an old/unverified account tries to login, show the backend
      // message here instead of asking for the code during login.
      if (!response.ok || !data.success) {
        if (data.requiresEmailVerification) {
          setError(
            data.message ||
              "Please verify your email before logging in."
          );
          return;
        }
        setError(data.message || "Login failed");
        return;
      }

      // JWT token save
      localStorage.setItem("token", data.token);

      // Login successful
      onLogin(data.user);
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setError("Server se connection nahi ho pa raha.");
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

    if (!registerName || !registerEmail || !registerPassword) {
      setError("Name, email aur password enter karein.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
          role: registerRole,
        }),
      });

      const data = await response.json();

     // =================================================
// EXISTING UNVERIFIED ACCOUNT
// -> OPEN OTP VERIFICATION PAGE
// =================================================

if (data.requiresEmailVerification === true) {
  const cleanEmail = registerEmail.trim();

  setVerificationEmail(cleanEmail);
  setVerificationCode("");

  setIsVerificationMode(true);
  setIsRegisterMode(false);

  setError("");

  setMessage(
    data.message ||
      "This email is already registered but not verified. Please verify your email."
  );

  setLoginEmail(cleanEmail);
  setLoginRole(registerRole);
  setLoginPassword("");

  return;
}

// =================================================
// NORMAL REGISTRATION ERROR
// =================================================

if (!response.ok || !data.success) {
  setError(data.message || "Registration failed");
  return;
}

      // =================================================
      // REGISTRATION SUCCESS -> EMAIL VERIFICATION
      // =================================================

      setVerificationEmail(registerEmail.trim());
      setVerificationCode("");
      setIsVerificationMode(true);
      setIsRegisterMode(false);

      setError("");

      setMessage(
        data.message ||
          "Verification code aapke email par bheja gaya hai."
      );

      // Keep login role/email ready in case user returns to login
      setLoginEmail(registerEmail.trim());
      setLoginRole(registerRole);
      setLoginPassword("");

      // Clear registration fields
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      setError("Server se connection nahi ho pa raha.");
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // VERIFY EMAIL
  // =================================================

  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanCode = verificationCode.replace(/\D/g, "");

    if (!verificationEmail) {
      setError("Verification email missing hai.");
      return;
    }

    if (cleanCode.length !== 6) {
      setError("6-digit verification code enter karein.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verificationEmail.trim(),
          code: cleanCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Email verification failed.");
        return;
      }

      setError("");

      if (data.requiresApproval) {
        setMessage(
          data.message ||
            "Email verified successfully. Admin approval is required before login."
        );
      } else {
        setMessage(
          data.message ||
            "Email verified successfully. You can now login."
        );
      }

      // Return to login after a successful verification
      setLoginEmail(verificationEmail.trim());

      // If verification was started from registration,
      // keep the selected role for the login form.
      setIsVerificationMode(false);
      setIsRegisterMode(false);
      setVerificationCode("");
    } catch (error) {
      console.error("VERIFY EMAIL ERROR:", error);

      setError("Server se connection nahi ho pa raha.");
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // RESEND VERIFICATION CODE
  // =================================================

  const handleResendVerification = async () => {
    setError("");
    setMessage("");

    if (!verificationEmail) {
      setError("Verification email missing hai.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: verificationEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Verification code resend nahi ho saka."
        );
        return;
      }

      setVerificationCode("");

      setMessage(
        data.message ||
          "New verification code email par bhej diya gaya hai."
      );
    } catch (error) {
      console.error("RESEND VERIFICATION ERROR:", error);

      setError("Server se connection nahi ho pa raha.");
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
    setIsVerificationMode(false);
    setIsRegisterMode(!isRegisterMode);
  };

  // =================================================
  // BACK TO LOGIN FROM VERIFICATION
  // =================================================

  const backToLogin = () => {
    setError("");
    setMessage("");
    setLoading(false);
    setIsVerificationMode(false);
    setIsRegisterMode(false);
    setVerificationCode("");
  };

  // =================================================
  // SHARED PAGE SHELL
  // =================================================

  const pageShell = (children, showBack = true) => (
    <div className="login-page cvru-login-page">
      <div className="cvru-bg-overlay" />

      <div className="cvru-university-branding">
        <img
          src="/cvru-logo.png"
          alt="Dr. C. V. Raman University Logo"
          className="cvru-logo"
        />
        <div className="cvru-university-name">DR. CV RAMAN UNIVERSITY</div>
        <div className="cvru-university-line">
          <span />
          <b>VAISHALI, BIHAR</b>
          <span />
        </div>
        <div className="cvru-tagline">KNOWLEDGE • INNOVATION • EXCELLENCE</div>
      </div>

      {showBack && (
        <button className="cvru-back-btn" onClick={onBack} type="button">
          ← Back
        </button>
      )}

      <style>{`
        .cvru-password-wrapper {
          position: relative;
          width: 100%;
        }
        .cvru-password-wrapper .cvru-password-input {
          width: 100%;
          padding-right: 52px;
          box-sizing: border-box;
        }
        .cvru-password-toggle {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          line-height: 1;
          padding: 0;
          z-index: 2;
        }
        .cvru-password-toggle:hover {
          transform: translateY(-50%) scale(1.08);
        }
        .cvru-password-toggle:focus {
          outline: none;
        }
      `}</style>

      <div className="cvru-login-panel">
        {children}
      </div>
    </div>
  );

  // =================================================
  // VERIFICATION PAGE
  // =================================================

  if (isVerificationMode) {
    return pageShell(
      <>
        <div className="cvru-panel-brand">
          <div className="cvru-shield">✓</div>
          <div>
            <div className="cvru-panel-title">Campus Surveillance</div>
            <div className="cvru-panel-subtitle">Secure • Monitor • Protect</div>
          </div>
        </div>

        <div className="cvru-divider" />

        <h2 className="cvru-heading">Verify Your Email</h2>
        <p className="cvru-description">
          6-digit verification code aapke registered email par bheja gaya hai.
        </p>

        <div className="cvru-email-chip">{verificationEmail}</div>

        <form onSubmit={handleVerifyEmail} className="cvru-form">
          <label>Verification Code</label>
          <input
            className="cvru-input cvru-code-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit code"
            autoComplete="one-time-code"
            required
          />

          {message && <p className="cvru-message success">{message}</p>}
          {error && <p className="cvru-message error">{error}</p>}

          <button className="cvru-primary-btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email →"}
          </button>
        </form>

        <button
          className="cvru-secondary-btn"
          type="button"
          onClick={handleResendVerification}
          disabled={loading}
        >
          Resend Verification Code
        </button>

        <button className="cvru-text-btn" type="button" onClick={backToLogin}>
          Back to Login
        </button>

        <p className="cvru-footer-text">
          Email verification is required before account access.
        </p>
      </>
    );
  }

  // =================================================
  // REGISTER PAGE
  // =================================================

  if (isRegisterMode) {
    return pageShell(
      <>
        <div className="cvru-panel-brand">
          <div className="cvru-shield">✓</div>
          <div>
            <div className="cvru-panel-title">Campus Surveillance</div>
            <div className="cvru-panel-subtitle">Secure • Monitor • Protect</div>
          </div>
        </div>

        <div className="cvru-divider" />

        <h2 className="cvru-heading">Create Account</h2>
        <p className="cvru-description">
          Register your account. Email verification is required.
        </p>

        <form onSubmit={handleRegister} className="cvru-form">
          <label>Full Name</label>
          <input
            className="cvru-input"
            type="text"
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <label>Email Address</label>
          <input
            className="cvru-input"
            type="email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
          />

          <label>Password</label>
          <div className="cvru-password-wrapper">
            <input
              className="cvru-input cvru-password-input"
              type={showRegisterPassword ? "text" : "password"}
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="cvru-password-toggle"
              onClick={() => setShowRegisterPassword((prev) => !prev)}
              aria-label={showRegisterPassword ? "Hide password" : "Show password"}
              title={showRegisterPassword ? "Hide password" : "Show password"}
            >
              {showRegisterPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <label>Register As</label>
          <div className="cvru-role-grid">
            {[
              ["student", "🎓", "Student"],
              ["staff", "👤", "Staff"],
              ["security", "🛡️", "Security Guard"],
              ["admin", "🔐", "Admin"],
            ].map(([value, icon, label]) => (
              <button
                key={value}
                type="button"
                className={`cvru-role-btn ${registerRole === value ? "active" : ""}`}
                onClick={() => setRegisterRole(value)}
              >
                <span>{icon}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>

          <p className="cvru-role-note">
            Student accounts activate after email verification. Privileged roles
            require Admin approval after email verification.
          </p>

          {message && <p className="cvru-message success">{message}</p>}
          {error && <p className="cvru-message error">{error}</p>}

          <button className="cvru-primary-btn" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account →"}
          </button>
        </form>

        <p className="cvru-switch-text">
          Already have an account?{" "}
          <button className="cvru-text-link" type="button" onClick={switchMode}>
            Login
          </button>
        </p>

        <p className="cvru-footer-text">
          Account access is controlled by Campus Surveillance System.
        </p>
      </>
    );
  }

  // =================================================
  // LOGIN PAGE
  // =================================================

  return pageShell(
    <>
      <div className="cvru-panel-brand">
        <div className="cvru-shield">✓</div>
        <div>
          <div className="cvru-panel-title">Campus Surveillance System</div>
          <div className="cvru-panel-subtitle">Secure • Monitor • Protect</div>
        </div>
      </div>

      <div className="cvru-divider" />

      <h2 className="cvru-heading">Welcome Back</h2>
      <p className="cvru-description">Login to Campus Surveillance System</p>

      <form onSubmit={handleLogin} className="cvru-form">
        <label>Email Address</label>
        <input
          className="cvru-input"
          type="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="Enter your email address"
          autoComplete="email"
          required
        />

        <label>Password</label>
        <div className="cvru-password-wrapper">
          <input
            className="cvru-input cvru-password-input"
            type={showLoginPassword ? "text" : "password"}
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="cvru-password-toggle"
            onClick={() => setShowLoginPassword((prev) => !prev)}
            aria-label={showLoginPassword ? "Hide password" : "Show password"}
            title={showLoginPassword ? "Hide password" : "Show password"}
          >
            {showLoginPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <label>Login As</label>
        <div className="cvru-role-grid login-roles">
          {[
            ["admin", "🛡️", "Admin"],
            ["security", "👮", "Security Guard"],
            ["staff", "👤", "Staff"],
            ["student", "🎓", "Student"],
          ].map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              className={`cvru-role-btn ${loginRole === value ? "active" : ""}`}
              onClick={() => setLoginRole(value)}
            >
              <span>{icon}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>

        {message && <p className="cvru-message success">{message}</p>}
        {error && <p className="cvru-message error">{error}</p>}

        <button className="cvru-primary-btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login →"}
        </button>
      </form>

      <p className="cvru-switch-text">
        Don't have an account?{" "}
        <button className="cvru-text-link" type="button" onClick={switchMode}>
          Create Account
        </button>
      </p>

      <p className="cvru-footer-text">
        🔒 Secure login powered by Campus Surveillance System
      </p>
    </>
  );
}

export default Login;
