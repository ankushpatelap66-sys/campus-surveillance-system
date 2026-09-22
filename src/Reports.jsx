import React, { useEffect, useMemo, useState } from "react";


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
  @media(max-width:760px){.cvru-module-brand{align-items:flex-start;padding:15px;}.cvru-module-brand-right{display:none}.cvru-module-logo-box{width:62px;height:52px;flex-basis:62px}.cvru-module-brand-name{font-size:16px}.cvru-module-brand-location{font-size:10px}}
`;

function CVRUModuleBrand(){
  return (
    <section className="cvru-module-brand">
      <div className="cvru-module-brand-left">
        <div className="cvru-module-logo-box">
          <img className="cvru-module-logo" src="/cvru-logo.png" alt="CVRU logo" onError={(e)=>{e.currentTarget.style.display="none";}} />
        </div>
        <div>
          <div className="cvru-module-brand-name">DR. C. V. RAMAN UNIVERSITY</div>
          <div className="cvru-module-brand-location">VAISHALI, BIHAR</div>
        </div>
      </div>
      <div className="cvru-module-brand-right">
        <span className="cvru-module-online-dot"/>
        <span>Security Monitoring</span>
        <strong>System Online</strong>
      </div>
    </section>
  );
}

const API_BASE = import.meta.env.VITE_API_URL;
const REPORT_URL = `${API_BASE}/automation/dashboard-summary`;

function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const fetchReport = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(REPORT_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { success: false, message: await response.text() };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Report data load nahi ho pa raha hai.");
      }

      setReport(data);
      setError("");
    } catch (err) {
      console.error("REPORTS ERROR:", err);
      setError(err.message || "Report data load nahi ho pa raha hai.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();

    const interval = setInterval(() => {
      fetchReport(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const summary = report?.summary || {};
  const changes = summary.changes || {};

  const activity = useMemo(() => {
    const rows = Array.isArray(report?.activity) ? report.activity : [];
    const now = new Date();

    return rows.filter((row) => {
      const vehicle = String(row.vehicleNumber || "").toLowerCase();
      const matchesSearch =
        !search.trim() ||
        vehicle.includes(search.trim().toLowerCase()) ||
        String(row.event || "").toLowerCase().includes(search.trim().toLowerCase()) ||
        String(row.location || "").toLowerCase().includes(search.trim().toLowerCase());

      const event = String(row.event || "").toLowerCase();
      let matchesType = true;

      if (typeFilter === "Entry") matchesType = event.includes("entry");
      if (typeFilter === "Exit") matchesType = event.includes("exit");
      if (typeFilter === "Alert") matchesType = event.includes("alert");
      if (typeFilter === "Parking") matchesType = event.includes("parking");

      const rowDate = row.time ? new Date(row.time) : null;
      let matchesDate = true;

      if (dateFilter === "Today" && rowDate) {
        matchesDate = rowDate.toDateString() === now.toDateString();
      }

      if (dateFilter === "Yesterday" && rowDate) {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        matchesDate = rowDate.toDateString() === yesterday.toDateString();
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [report, search, typeFilter, dateFilter]);

  const alerts = Array.isArray(report?.alerts) ? report.alerts : [];

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const printReport = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setDateFilter("All");
  };

  return (
    <div className="reports-page">
      <style>{CVRU_MODULE_STYLES}</style>
      <div className="reports-container">
          <section className="reports-header">
          <div>
            <div className="reports-kicker">CAMPUS SURVEILLANCE SYSTEM</div>
            <h1>Reports & Analytics</h1>
            <p>
              Vehicle movement, parking usage and security activity from the
              campus monitoring system.
            </p>
          </div>

          <div className="reports-header-actions">
            <span className="reports-live">
              <span />
              Live Data
            </span>

            <button
              type="button"
              className="reports-refresh-btn"
              onClick={() => fetchReport(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              className="reports-print-btn"
              onClick={printReport}
            >
              🖨 Print
            </button>
          </div>
        </section>

        {error && (
          <div className="reports-error">
            <strong>⚠️ Report Error:</strong> {error}
            <button type="button" onClick={() => fetchReport()}>
              Retry
            </button>
          </div>
        )}

        <section className="reports-stat-grid">
          <ReportStat
            icon="🚗"
            title="Registered Vehicles"
            value={loading ? "—" : summary.totalVehicles ?? 0}
            text="Authorized campus vehicles"
          />

          <ReportStat
            icon="↕"
            title="Inside Campus"
            value={loading ? "—" : summary.insideCampus ?? 0}
            text="Currently inside"
          />

          <ReportStat
            icon="🅿️"
            title="Parking Occupied"
            value={
              loading
                ? "—"
                : `${summary.parkingOccupied ?? 0}/${summary.parkingCapacity ?? 120}`
            }
            text="Occupied parking capacity"
          />

          <ReportStat
            icon="🚨"
            title="Active Alerts"
            value={loading ? "—" : summary.activeAlerts ?? 0}
            text="Security alerts requiring attention"
          />
        </section>

        <section className="reports-summary-grid">
          <article className="report-summary-card">
            <div className="summary-card-icon">↗</div>
            <div>
              <span>Today's Activity</span>
              <strong>
                {changes.entriesToday == null
                  ? "0%"
                  : changes.entriesToday >= 0
                    ? `+${changes.entriesToday}%`
                    : `${changes.entriesToday}%`}
              </strong>
              <small>Entry activity vs previous day</small>
            </div>
          </article>

          <article className="report-summary-card">
            <div className="summary-card-icon alert">!</div>
            <div>
              <span>Today's Alerts</span>
              <strong>
                {changes.alertsToday == null
                  ? "0%"
                  : changes.alertsToday >= 0
                    ? `+${changes.alertsToday}%`
                    : `${changes.alertsToday}%`}
              </strong>
              <small>Alert activity vs previous day</small>
            </div>
          </article>

          <article className="report-summary-card">
            <div className="summary-card-icon parking">P</div>
            <div>
              <span>Parking Available</span>
              <strong>
                {Math.max(
                  0,
                  (summary.parkingCapacity ?? 120) -
                    (summary.parkingOccupied ?? 0)
                )}
              </strong>
              <small>Slots currently available</small>
            </div>
          </article>
        </section>

        <section className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <span className="panel-kicker">ACTIVITY REPORT</span>
              <h2>Recent Vehicle Activity</h2>
              <p>Latest movement and security events recorded by the system.</p>
            </div>

            <div className="report-count">
              {activity.length} record{activity.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="reports-filters">
            <div className="report-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle, event or location..."
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Events</option>
              <option value="Entry">Entry</option>
              <option value="Exit">Exit</option>
              <option value="Parking">Parking</option>
              <option value="Alert">Alerts</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
            </select>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          {loading ? (
            <div className="reports-empty">Loading report data...</div>
          ) : activity.length === 0 ? (
            <div className="reports-empty">
              No activity matches the selected filters.
            </div>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Vehicle Number</th>
                    <th>Event</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activity.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDateTime(row.time)}</td>

                      <td>
                        <strong>{row.vehicleNumber || "-"}</strong>
                      </td>

                      <td>
                        <span className={`report-event ${row.tone || "info"}`}>
                          {row.event || "Activity"}
                        </span>
                      </td>

                      <td>{row.location || "-"}</td>

                      <td>
                        <span
                          className={`report-status ${String(
                            row.status || ""
                          ).toLowerCase()}`}
                        >
                          {row.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="reports-panel alerts-report-panel">
          <div className="reports-panel-header">
            <div>
              <span className="panel-kicker">SECURITY REPORT</span>
              <h2>Recent Security Alerts</h2>
              <p>Latest alerts generated by campus vehicle monitoring.</p>
            </div>

            <div className="alert-total">{summary.activeAlerts ?? 0} Active</div>
          </div>

          {alerts.length === 0 ? (
            <div className="reports-empty success-empty">
              ✓ No recent security alerts.
            </div>
          ) : (
            <div className="alert-report-list">
              {alerts.map((alert) => (
                <div className="alert-report-row" key={alert.id}>
                  <div className={`alert-report-icon ${alert.severity || "medium"}`}>
                    🚨
                  </div>

                  <div className="alert-report-main">
                    <strong>{alert.type || "Security Alert"}</strong>
                    <span>
                      Vehicle: {alert.vehicleNumber || "Unknown Vehicle"}
                    </span>
                    <small>
                      {alert.location || "Main Gate"} •{" "}
                      {formatDateTime(alert.time)}
                    </small>
                  </div>

                  <div className="alert-report-right">
                    <span className={`priority-badge ${alert.severity || "medium"}`}>
                      {alert.priority || "Medium Priority"}
                    </span>
                    <span className="alert-status">{alert.status || "Active"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="reports-footer-note">
          <div>
            <strong>Dr. C. V. Raman University</strong>
            <span>Vaishali, Bihar • Campus Surveillance System</span>
          </div>
          <span>
            Data is generated from the live vehicle, parking and security
            monitoring records.
          </span>
        </section>
      </div>

      <style>{`
        .reports-page {
          min-height: 100%;
          background: #f4f7fb;
          padding: 28px;
          box-sizing: border-box;
        }

        .reports-container {
          width: 100%;
          max-width: 1450px;
          margin: 0 auto;
        }

        .reports-header {
          background-image: linear-gradient(90deg, rgba(4,35,69,.94) 0%, rgba(8,55,96,.78) 48%, rgba(8,55,96,.28) 100%), url('/cvru-campus.png');
          background-size: cover;
          background-position: center;
          color: white;
          border-radius: 18px;
          padding: 28px 32px;
          min-height: 138px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 10px 28px rgba(8, 43, 82, 0.18);
          margin-bottom: 20px;
        }

        .reports-kicker,
        .panel-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .reports-kicker {
          color: #a9d7ff;
          margin-bottom: 7px;
        }

        .reports-header h1 {
          margin: 0;
          font-size: 29px;
          letter-spacing: -0.5px;
          color: #ffffff !important;
          opacity: 1 !important;
          text-shadow: 0 1px 2px rgba(0,0,0,.18);
        }

        .reports-header p {
          margin: 7px 0 0;
          color: #d8e8f7;
          font-size: 13px;
        }

        .reports-header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .reports-live {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          font-size: 11px;
          font-weight: 800;
        }

        .reports-live span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 4px rgba(74,222,128,0.12);
        }

        .reports-refresh-btn,
        .reports-print-btn {
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.1);
          color: white;
          border-radius: 9px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 11px;
        }

        .reports-refresh-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .reports-error {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #991b1b;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
        }

        .reports-error button {
          margin-left: auto;
          border: 0;
          border-radius: 7px;
          padding: 7px 11px;
          cursor: pointer;
          font-weight: 700;
          background: #991b1b;
          color: white;
        }

        .reports-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .report-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.05);
        }

        .report-stat-icon {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eef5ff;
          font-size: 21px;
        }

        .report-stat span {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .report-stat strong {
          display: block;
          color: #0f2742;
          font-size: 25px;
          line-height: 1.1;
          margin: 4px 0;
        }

        .report-stat small {
          color: #94a3b8;
          font-size: 10px;
        }

        .reports-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .report-summary-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .summary-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #ecfdf5;
          color: #15803d;
          font-size: 18px;
          font-weight: 900;
        }

        .summary-card-icon.alert {
          background: #fff1f2;
          color: #dc2626;
        }

        .summary-card-icon.parking {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .report-summary-card span,
        .report-summary-card small {
          display: block;
        }

        .report-summary-card span {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .report-summary-card strong {
          display: block;
          color: #0f2742;
          font-size: 21px;
          margin: 2px 0;
        }

        .report-summary-card small {
          color: #94a3b8;
          font-size: 10px;
        }

        .reports-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 5px 18px rgba(15,23,42,0.045);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .reports-panel-header {
          padding: 20px 21px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid #edf2f7;
        }

        .panel-kicker {
          color: #64748b;
        }

        .reports-panel-header h2 {
          margin: 4px 0;
          color: #102a43;
          font-size: 19px;
        }

        .reports-panel-header p {
          margin: 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .report-count,
        .alert-total {
          padding: 7px 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .alert-total {
          background: #fff1f2;
          color: #be123c;
        }

        .reports-filters {
          padding: 13px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #edf2f7;
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 150px 150px auto;
          gap: 9px;
        }

        .report-search {
          background: white;
          border: 1px solid #dbe5ef;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 10px;
        }

        .report-search span {
          color: #94a3b8;
          font-size: 17px;
        }

        .report-search input {
          width: 100%;
          border: 0;
          outline: 0;
          padding: 9px 8px;
          font-size: 11px;
          color: #334155;
          background: transparent;
        }

        .reports-filters select,
        .clear-filter-btn {
          border: 1px solid #dbe5ef;
          background: white;
          border-radius: 8px;
          padding: 9px 10px;
          font-size: 11px;
          color: #334155;
          outline: none;
        }

        .clear-filter-btn {
          cursor: pointer;
          font-weight: 700;
        }

        .reports-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }

        .reports-table th {
          text-align: left;
          padding: 11px 20px;
          background: #f8fafc;
          color: #64748b;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: .7px;
          border-bottom: 1px solid #e5edf5;
        }

        .reports-table td {
          padding: 13px 20px;
          color: #475569;
          font-size: 11px;
          border-bottom: 1px solid #eef2f6;
        }

        .reports-table tbody tr:hover {
          background: #fbfdff;
        }

        .reports-table td strong {
          color: #102a43;
          letter-spacing: .4px;
        }

        .report-event,
        .report-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 9px;
          font-weight: 800;
        }

        .report-event.success,
        .report-status.in {
          background: #ecfdf5;
          color: #15803d;
        }

        .report-event.info,
        .report-status.out {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .report-event.danger,
        .report-status.alert {
          background: #fff1f2;
          color: #be123c;
        }

        .report-event.purple,
        .report-status.parked {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .reports-empty {
          padding: 42px 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
        }

        .success-empty {
          color: #15803d;
          font-weight: 700;
        }

        .alert-report-list {
          padding: 6px 20px 12px;
        }

        .alert-report-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid #eef2f6;
        }

        .alert-report-row:last-child {
          border-bottom: 0;
        }

        .alert-report-icon {
          width: 39px;
          height: 39px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #fff1f2;
        }

        .alert-report-icon.medium {
          background: #fff7ed;
        }

        .alert-report-main {
          flex: 1;
          min-width: 0;
        }

        .alert-report-main strong,
        .alert-report-main span,
        .alert-report-main small {
          display: block;
        }

        .alert-report-main strong {
          color: #102a43;
          font-size: 12px;
        }

        .alert-report-main span {
          margin-top: 2px;
          color: #475569;
          font-size: 10px;
        }

        .alert-report-main small {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 9px;
        }

        .alert-report-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .priority-badge,
        .alert-status {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 800;
        }

        .priority-badge.high {
          background: #fff1f2;
          color: #be123c;
        }

        .priority-badge.medium {
          background: #fff7ed;
          color: #c2410c;
        }

        .alert-status {
          background: #ecfdf5;
          color: #15803d;
        }

        .reports-footer-note {
          padding: 16px 4px 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: #94a3b8;
          font-size: 9px;
        }

        .reports-footer-note div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .reports-footer-note strong {
          color: #334155;
          font-size: 10px;
        }

        @media (max-width: 1050px) {
          .reports-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .reports-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .reports-page {
            padding: 14px;
          }

          .reports-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .reports-header-actions {
            justify-content: flex-start;
          }

          .reports-stat-grid {
            grid-template-columns: 1fr;
          }

          .reports-filters {
            grid-template-columns: 1fr;
          }

          .reports-panel-header,
          .reports-footer-note {
            align-items: flex-start;
            flex-direction: column;
          }

          .alert-report-row {
            align-items: flex-start;
          }

          .alert-report-right {
            align-items: flex-start;
          }
        }

        @media print {
          .reports-page {
            padding: 0;
            background: white;
          }

          .reports-header-actions,
          .reports-filters,
          .reports-error,
          .reports-footer-note {
            display: none !important;
          }

          .reports-header {
            box-shadow: none;
            print-color-adjust: exact;
          }

          .reports-panel,
          .report-stat,
          .report-summary-card {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

function ReportStat({ icon, title, value, text }) {
  return (
    <article className="report-stat">
      <div className="report-stat-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{text}</small>
      </div>
    </article>
  );
}

export default Reports;