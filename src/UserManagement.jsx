import { useEffect, useMemo, useState } from "react";

const CVRU_MODULE_STYLES = `
  .cvru-module-brand{
    width:100%;max-width:1280px;margin:0 auto 24px;box-sizing:border-box;
    display:flex;align-items:center;justify-content:space-between;gap:24px;
    padding:18px 22px;background:#fff;border:1px solid #dce6f3;border-radius:18px;
    box-shadow:0 8px 24px rgba(10,47,90,.06);
  }
  .cvru-module-brand-left{display:flex;align-items:center;gap:16px;min-width:0}
  .cvru-module-logo-box{width:74px;height:58px;display:flex;align-items:center;justify-content:center;flex:0 0 74px;overflow:hidden;border-radius:10px;background:#f7faff}
  .cvru-module-logo{width:100%;height:100%;object-fit:contain}
  .cvru-module-brand-name{font-size:20px;font-weight:900;letter-spacing:.2px;color:#123b6b;line-height:1.1}
  .cvru-module-brand-location{margin-top:5px;font-size:12px;font-weight:800;letter-spacing:1.5px;color:#66809e}
  .cvru-module-brand-right{display:flex;align-items:center;gap:9px;color:#58708d;font-size:14px;white-space:nowrap}
  .cvru-module-online-dot{width:10px;height:10px;border-radius:50%;background:#17b978;box-shadow:0 0 0 5px #e6f8f1}
  .cvru-module-brand-right strong{color:#173d68}

  @media(max-width:760px){
    .cvru-module-brand{
      align-items:flex-start;
      padding:15px;
    }

    .cvru-module-brand-right{
      display:none;
    }

    .cvru-module-logo-box{
      width:62px;
      height:52px;
      flex-basis:62px;
    }

    .cvru-module-brand-name{
      font-size:16px;
    }

    .cvru-module-brand-location{
      font-size:10px;
    }
  }
`;

const ROLES = [
  ["admin", "Administrator"],
  ["security", "Security Guard"],
  ["staff", "Staff / Faculty"],
  ["student", "Student"],
];

const PRIVILEGED_ROLES = ["admin", "security", "staff"];

const STATUS = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Access Removed",
};

function CVRUModuleBrand() {
  return (
    <section className="cvru-module-brand">
      <div className="cvru-module-brand-left">
        <div className="cvru-module-logo-box">
          <img
            className="cvru-module-logo"
            src="/cvru-logo.png"
            alt="CVRU logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div>
          <div className="cvru-module-brand-name">
            DR. C. V. RAMAN UNIVERSITY
          </div>

          <div className="cvru-module-brand-location">
            VAISHALI, BIHAR
          </div>
        </div>
      </div>

      <div className="cvru-module-brand-right">
        <span className="cvru-module-online-dot" />
        <span>Security Monitoring</span>
        <strong>System Online</strong>
      </div>
    </section>
  );
}

function UserManagement() {
  const API_BASE = `${import.meta.env.VITE_API_URL}/auth`;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const auth = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  /* =====================================================
     FETCH USERS
  ===================================================== */

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const r = await fetch(`${API_BASE}/users`, {
        headers: auth(),
      });

      const d = await r.json();

      if (!r.ok || !d.success) {
        throw new Error(
          d.message || "Failed to fetch users"
        );
      }

      setUsers(
        Array.isArray(d.users)
          ? d.users
          : []
      );
    } catch (e) {
      setError(
        e.message ||
          "Users load nahi ho pa rahe."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(
    () => ({
      total: users.length,

      /*
        Pending Approval means only verified privileged
        accounts that can actually be approved by Admin.
      */
      pending: users.filter(
        (u) =>
          u.status === "pending" &&
          PRIVILEGED_ROLES.includes(u.role) &&
          u.emailVerified === true
      ).length,

      approved: users.filter(
        (u) => u.status === "approved"
      ).length,

      removed: users.filter(
        (u) => u.status === "rejected"
      ).length,
    }),
    [users]
  );

  /* =====================================================
     FILTER
  ===================================================== */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter(
      (u) =>
        (!q ||
          [u.name, u.email, u.role].some(
            (v) =>
              String(v || "")
                .toLowerCase()
                .includes(q)
          )) &&
        (roleFilter === "all" ||
          u.role === roleFilter) &&
        (statusFilter === "all" ||
          u.status === statusFilter)
    );
  }, [
    users,
    query,
    roleFilter,
    statusFilter,
  ]);

  const roleLabel = (r) =>
    ROLES.find((x) => x[0] === r)?.[1] ||
    r ||
    "Unknown";

  const date = (v) =>
    v
      ? new Date(v).toLocaleString(
          "en-IN",
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        )
      : "-";

  /* =====================================================
     CREATE / EDIT FORM
  ===================================================== */

  const openCreate = () => {
    setEditing(null);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "student",
    });

    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEdit = (u) => {
    setEditing(u);

    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "student",
    });

    setShowForm(true);
    setError("");
    setMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  /* =====================================================
     SAVE USER
  ===================================================== */

  const saveUser = async (e) => {
    e.preventDefault();

    setBusy("save");
    setError("");
    setMessage("");

    try {
      const p = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      if (!editing || form.password) {
        p.password = form.password;
      }

      if (
        !p.name ||
        !p.email ||
        (!editing && !form.password)
      ) {
        throw new Error(
          "Name, email and password are required."
        );
      }

      if (
        !editing &&
        form.password.length < 6
      ) {
        throw new Error(
          "Password must contain at least 6 characters."
        );
      }

      const r = await fetch(
        `${API_BASE}/users${
          editing
            ? `/${editing._id}`
            : ""
        }`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...auth(),
          },
          body: JSON.stringify(p),
        }
      );

      const d = await r.json();

      if (!r.ok || !d.success) {
        throw new Error(
          d.message ||
            "Unable to save user"
        );
      }

      setMessage(
        editing
          ? "User updated successfully."
          : "User created successfully."
      );

      closeForm();

      await fetchUsers();
    } catch (e) {
      setError(
        e.message ||
          "Unable to save user."
      );
    } finally {
      setBusy("");
    }
  };

  /* =====================================================
     STATUS ACTION
  ===================================================== */

  const statusAction = async (
    u,
    action,
    confirmText,
    success
  ) => {
    if (!window.confirm(confirmText)) {
      return;
    }

    setBusy(`${action}-${u._id}`);
    setError("");
    setMessage("");

    try {
      const r = await fetch(
        `${API_BASE}/users/${u._id}/${action}`,
        {
          method: "PUT",
          headers: auth(),
        }
      );

      const d = await r.json();

      if (!r.ok || !d.success) {
        throw new Error(
          d.message || "Action failed"
        );
      }

      setMessage(success);

      await fetchUsers();
    } catch (e) {
      setError(
        e.message || "Action failed."
      );
    } finally {
      setBusy("");
    }
  };

  /* =====================================================
     REMOVE / REJECT
  ===================================================== */

  const remove = (u) =>
    statusAction(
      u,
      "reject",
      "Remove this user's access? They will not be able to log in.",
      "User access removed successfully."
    );

  /* =====================================================
     APPROVE
     
     Frontend guard:
       1. Must be privileged role
       2. Must be email verified
       3. Must currently be pending

     Backend authRoutes.js has the same security guard.
  ===================================================== */

  const approve = (u) => {
    const isPrivileged =
      PRIVILEGED_ROLES.includes(u.role);

    if (!isPrivileged) {
      setError(
        "This account does not require Admin approval."
      );
      return;
    }

    if (u.emailVerified !== true) {
      setError(
        "Email verification is required before Admin approval."
      );
      return;
    }

    if (u.status !== "pending") {
      setError(
        "Only pending users can be approved."
      );
      return;
    }

    statusAction(
      u,
      "approve",
      "Approve this verified user's access?",
      "User access approved successfully."
    );
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const removeUser = async (u) => {
    if (
      !window.confirm(
        `Permanently delete ${u.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(`delete-${u._id}`);
    setError("");
    setMessage("");

    try {
      const r = await fetch(
        `${API_BASE}/users/${u._id}`,
        {
          method: "DELETE",
          headers: auth(),
        }
      );

      const d = await r.json();

      if (!r.ok || !d.success) {
        throw new Error(
          d.message || "Delete failed"
        );
      }

      setMessage(
        "User permanently deleted."
      );

      await fetchUsers();
    } catch (e) {
      setError(
        e.message ||
          "User delete nahi ho paya."
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="user-management-page">
      <style>{CVRU_MODULE_STYLES}</style>

      <div className="user-management-hero">
        <div>
          <span className="module-eyebrow">
            ADMIN CONTROL
          </span>

          <h1>User Management</h1>

          <p>
            Manage campus accounts, approval requests,
            roles and access.
          </p>
        </div>

        <div className="user-management-actions">
          <button
            className="module-secondary-btn"
            onClick={fetchUsers}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            className="module-primary-btn"
            onClick={openCreate}
          >
            ＋ Add User
          </button>
        </div>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="user-stats-grid">
        {[
          [
            "users",
            stats.total,
            "Total Users",
          ],
          [
            "clock",
            stats.pending,
            "Pending Approval",
          ],
          [
            "check",
            stats.approved,
            "Approved",
          ],
          [
            "lock",
            stats.removed,
            "Access Removed",
          ],
        ].map(([i, v, l]) => (
          <div
            className="user-stat-card"
            key={l}
          >
            <div
              className={`user-stat-icon ${i}`}
            >
              {i === "users"
                ? "♟"
                : i === "clock"
                ? "◷"
                : i === "check"
                ? "✓"
                : "⌁"}
            </div>

            <strong>{v}</strong>

            <span>{l}</span>
          </div>
        ))}
      </div>

      {/* =================================================
          NOTICES
      ================================================= */}

      {message && (
        <div className="module-notice success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="module-notice error">
          ! {error}
        </div>
      )}

      {/* =================================================
          CREATE / EDIT FORM
      ================================================= */}

      {showForm && (
        <div className="user-form-card">
          <div className="user-section-head">
            <div>
              <span className="module-eyebrow">
                ACCOUNT SETUP
              </span>

              <h2>
                {editing
                  ? "Edit User"
                  : "Create User"}
              </h2>
            </div>

            <button
              className="close-btn"
              onClick={closeForm}
            >
              ×
            </button>
          </div>

          <form
            onSubmit={saveUser}
            className="user-form-grid"
          >
            <label>
              Full Name

              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Email Address

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Role

              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value,
                  })
                }
              >
                {ROLES.map(([v, l]) => (
                  <option
                    key={v}
                    value={v}
                  >
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Password{" "}
              {editing && (
                <small>
                  (leave blank to keep current)
                </small>
              )}

              <input
                type="password"
                minLength="6"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                required={!editing}
              />
            </label>

            <div className="user-form-buttons">
              <button
                type="button"
                className="module-secondary-btn"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                className="module-primary-btn"
                disabled={busy === "save"}
              >
                {busy === "save"
                  ? "Saving..."
                  : editing
                  ? "Save Changes"
                  : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================
          USER DIRECTORY
      ================================================= */}

      <div className="user-toolbar">
        <div>
          <span className="module-eyebrow">
            USER DIRECTORY
          </span>

          <h2>All Users</h2>

          <p>
            Search and manage registered campus
            accounts.
          </p>
        </div>

        <div className="user-filters">
          <input
            placeholder="Search name, email or role..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
          />

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
          >
            <option value="all">
              All Roles
            </option>

            {ROLES.map(([v, l]) => (
              <option
                key={v}
                value={v}
              >
                {l}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Access Removed
            </option>
          </select>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="user-table-card">
        <div className="user-table-meta">
          Showing{" "}
          <strong>{filtered.length}</strong>{" "}
          of{" "}
          <strong>{users.length}</strong>{" "}
          users
        </div>

        {loading ? (
          <div className="module-empty">
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="module-empty">
            <strong>
              No matching users
            </strong>

            <span>
              Try changing the search or filters.
            </span>
          </div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email Verification</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const isPrivileged =
                    PRIVILEGED_ROLES.includes(
                      u.role
                    );

                  const isEmailVerified =
                    u.emailVerified === true;

                  const canApprove =
                    isPrivileged &&
                    isEmailVerified &&
                    u.status === "pending";

                  return (
                    <tr key={u._id}>
                      {/* USER */}
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {(u.name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {u.name}
                            </strong>

                            <span>
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td>
                        <span className="role-pill">
                          {roleLabel(u.role)}
                        </span>
                      </td>

                      {/* EMAIL VERIFICATION */}
                      <td>
                        {isEmailVerified ? (
                          <span className="status-pill approved">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="status-pill pending">
                            ⏳ Not Verified
                          </span>
                        )}
                      </td>

                      {/* ACCOUNT STATUS */}
                      <td>
                        <span
                          className={`status-pill ${
                            u.status
                          }`}
                        >
                          {STATUS[u.status] ||
                            u.status}
                        </span>
                      </td>

                      {/* REGISTERED */}
                      <td className="date-cell">
                        {date(u.createdAt)}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="table-actions">
                          {/* EDIT */}
                          <button
                            className="action-btn edit"
                            onClick={() =>
                              openEdit(u)
                            }
                          >
                            Edit
                          </button>

                          {/* APPROVE:
                              ONLY verified privileged
                              pending users */}
                          {canApprove && (
                            <button
                              className="action-btn approve"
                              disabled={
                                busy ===
                                `approve-${u._id}`
                              }
                              onClick={() =>
                                approve(u)
                              }
                            >
                              {busy ===
                              `approve-${u._id}`
                                ? "Approving..."
                                : "Approve"}
                            </button>
                          )}

                          {/* VERIFIED REQUIRED MESSAGE */}
                          {isPrivileged &&
                            u.status ===
                              "pending" &&
                            !isEmailVerified && (
                              <span className="protected-label">
                                Email verification required
                              </span>
                            )}

                          {/* RESTORE */}
                          {u.status ===
                            "rejected" &&
                            u.role !==
                              "admin" && (
                              <button
                                className="action-btn approve"
                                disabled={
                                  busy ===
                                  `approve-${u._id}`
                                }
                                onClick={() =>
                                  approve(u)
                                }
                              >
                                {busy ===
                                `approve-${u._id}`
                                  ? "Restoring..."
                                  : "Restore"}
                              </button>
                            )}

                          {/* REMOVE */}
                          {u.status ===
                            "approved" &&
                            u.role !==
                              "admin" && (
                              <button
                                className="action-btn reject"
                                disabled={
                                  busy ===
                                  `reject-${u._id}`
                                }
                                onClick={() =>
                                  remove(u)
                                }
                              >
                                {busy ===
                                `reject-${u._id}`
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            )}

                          {/* DELETE */}
                          {u.role !==
                            "admin" && (
                            <button
                              className="action-btn delete"
                              disabled={
                                busy ===
                                `delete-${u._id}`
                              }
                              onClick={() =>
                                removeUser(u)
                              }
                            >
                              {busy ===
                              `delete-${u._id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}

                          {/* ADMIN PROTECTION */}
                          {u.role ===
                            "admin" && (
                            <span className="protected-label">
                              Admin protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;