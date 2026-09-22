import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE}/entry-exit`;
const AUTOMATION_URL = `${API_BASE}/automation/vehicle-detected`;

function EntryExit() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =====================================
  // FETCH RECORDS
  // =====================================

  const fetchRecords = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
      } else {
        alert(data.message || "Failed to fetch records");
      }
    } catch (error) {
      console.error("FETCH ERROR:", error);
      alert("Server se connection nahi ho pa raha hai.");
    }
  };

  // =====================================
  // LOAD RECORDS ON PAGE OPEN
  // =====================================

  useEffect(() => {
    fetchRecords();
  }, []);

  // =====================================
  // AUTOMATIC VEHICLE DETECTION / ENTRY
  // =====================================

  const handleVehicleDetection = async (e) => {
    e.preventDefault();

    const number = vehicleNumber.trim().toUpperCase();

    if (!number) {
      alert("Vehicle number required hai.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(AUTOMATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleNumber: number,
          camera: "Main Gate",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { success: false, message: await response.text() };

      if (!response.ok || !data.success) {
        alert(data.message || "Vehicle processing failed.");
        return;
      }

      if (data.action === "ALERT") {
        alert(
          `⚠️ ${data.message || "Unauthorized vehicle detected."}\n\nSecurity alert create ho gaya.`
        );
      } else if (data.action === "ENTRY") {
        alert(
          data.parkingSlot
            ? `✅ Entry recorded.\nParking Slot: ${data.parkingSlot}`
            : "✅ Vehicle entry recorded.\n⚠️ Parking slot currently unavailable."
        );
      } else if (data.action === "EXIT") {
        alert(
          data.parkingReleased > 0
            ? `✅ Vehicle exit recorded.\nParking slot released.`
            : "✅ Vehicle exit recorded successfully."
        );
      } else {
        alert(data.message || "Vehicle processed successfully.");
      }

      setVehicleNumber("");
      setOwnerName("");
      fetchRecords();
    } catch (error) {
      console.error("AUTOMATION VEHICLE ERROR:", error);
      alert("Server se connection nahi ho pa raha hai.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // MARK VEHICLE EXIT
  // =====================================

  const handleExit = async (id, number) => {
    const confirmExit = window.confirm(
      "Kya aap is vehicle ko exited mark karna chahte hain?"
    );

    if (!confirmExit) {
      return;
    }

    try {
      const response = await fetch(AUTOMATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleNumber: String(number || "").trim().toUpperCase(),
          camera: "Main Gate",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { success: false, message: await response.text() };

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to record exit.");
        return;
      }

      if (data.action === "EXIT") {
        alert(
          data.parkingReleased > 0
            ? "Vehicle exit recorded and parking slot released."
            : "Vehicle exit recorded successfully."
        );
      } else {
        alert(data.message || "Vehicle processed successfully.");
      }

      fetchRecords();
    } catch (error) {
      console.error("EXIT ERROR:", error);
      alert("Server se connection nahi ho pa raha hai.");
    }
  };

  // =====================================
  // DELETE RECORD
  // =====================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap ye entry/exit record delete karna chahte hain?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Record deleted successfully.");
        fetchRecords();
      } else {
        alert(data.message || "Failed to delete record.");
      }
    } catch (error) {
      console.error("DELETE ERROR:", error);
      alert("Server se connection nahi ho pa raha hai.");
    }
  };

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const todayKey = new Date().toLocaleDateString("en-CA");
  const insideCount = records.filter((record) => record.status === "Inside Campus").length;
  const exitedCount = records.filter((record) => record.status === "Exited").length;
  const todayCount = records.filter((record) => {
    if (!record.entryTime) return false;
    return new Date(record.entryTime).toLocaleDateString("en-CA") === todayKey;
  }).length;

  const filteredRecords = records.filter((record) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [
      record.vehicleNumber,
      record.ownerName,
      record.status,
    ].some((value) => String(value || "").toLowerCase().includes(term));
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="entry-exit-page">
      <div className="entry-exit-container">

        {/* PAGE HEADER */}

        <div className="entry-exit-header">
          <div>
            <div className="module-kicker">CAMPUS SECURITY / VEHICLE MOVEMENT</div>
            <h1>Entry &amp; Exit</h1>
            <p>Record, monitor and manage vehicle movement across campus gates.</p>
          </div>
          <div className="entry-exit-live">
            <span className="live-dot" />
            <span>Live Records</span>
            <strong>{records.length}</strong>
          </div>
        </div>

        <div className="entry-stats-grid">
          <div className="entry-stat-card"><span className="entry-stat-icon">↕</span><div><strong>{records.length}</strong><small>Total Records</small></div></div>
          <div className="entry-stat-card"><span className="entry-stat-icon entry-green">IN</span><div><strong>{insideCount}</strong><small>Currently Inside</small></div></div>
          <div className="entry-stat-card"><span className="entry-stat-icon entry-slate">OUT</span><div><strong>{exitedCount}</strong><small>Exited Vehicles</small></div></div>
          <div className="entry-stat-card"><span className="entry-stat-icon entry-blue">24H</span><div><strong>{todayCount}</strong><small>Today's Entries</small></div></div>
        </div>

        {/* ENTRY FORM */}

        <div className="entry-card">
          <h2>Record Vehicle Entry</h2>

          <form onSubmit={handleVehicleDetection} className="entry-form">

            <div className="entry-input-group">
              <label>Vehicle Number</label>

              <input
                type="text"
                placeholder="e.g. BR01AB1234"
                value={vehicleNumber}
                onChange={(e) =>
                  setVehicleNumber(e.target.value.toUpperCase())
                }
              />
            </div>

            <div className="entry-input-group">
              <label>Owner Name</label>

              <input
                type="text"
                placeholder="Registered vehicle par automatically identify hoga"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="entry-submit-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Process Vehicle"}
            </button>

          </form>
        </div>

        {/* RECORDS TABLE */}

        <div className="records-card">

          <div className="records-header">
            <div>
              <h2>Entry / Exit Records</h2>
              <p>All campus vehicle movement records.</p>
            </div>
            <button className="refresh-btn" onClick={fetchRecords}>
              Refresh
            </button>
          </div>

          <div className="records-toolbar">
            <div className="record-search-wrap">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle, owner or status"
                aria-label="Search entry exit records"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="All">All Status</option>
              <option value="Inside Campus">Inside Campus</option>
              <option value="Exited">Exited</option>
            </select>
            <span className="result-count">Showing {filteredRecords.length} of {records.length}</span>
          </div>

          {records.length === 0 ? (
            <div className="empty-records">
              <div className="empty-icon">🚗</div>
              <h3>No Records Found</h3>
              <p>
                Abhi tak koi vehicle entry record nahi hai.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-records compact-empty">
              <div className="empty-icon">⌕</div>
              <h3>No matching records</h3>
              <p>Try a different search term or status filter.</p>
            </div>
          ) : (
            <div className="table-wrapper">

              <table className="entry-exit-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vehicle Number</th>
                    <th>Owner Name</th>
                    <th>Entry Time</th>
                    <th>Exit Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredRecords.map((record, index) => (
                    <tr key={record._id}>

                      <td>{index + 1}</td>

                      <td>
                        <strong className="vehicle-number">
                          {record.vehicleNumber}
                        </strong>
                      </td>

                      <td>{record.ownerName}</td>

                      <td>
                        {formatDateTime(record.entryTime)}
                      </td>

                      <td>
                        {formatDateTime(record.exitTime)}
                      </td>

                      <td>

                        <span
                          className={
                            record.status === "Inside Campus"
                              ? "status-badge inside"
                              : "status-badge exited"
                          }
                        >
                          {record.status}
                        </span>

                      </td>

                      <td>

                        <div className="action-buttons">

                          {record.status === "Inside Campus" && (
                            <button
                              className="exit-btn"
                              onClick={() =>
                                handleExit(record._id, record.vehicleNumber)
                              }
                            >
                              Mark Exit
                            </button>
                          )}

                          <button
                            className="delete-record-btn"
                            onClick={() =>
                              handleDelete(record._id)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* PAGE CSS */}

      <style>{`

        .entry-exit-page {
          min-height: 100vh;
          background: #f4f7fb;
          padding: 30px;
          box-sizing: border-box;
        }

        .entry-exit-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .entry-exit-header {
          background: linear-gradient(135deg, #0f4c81, #1769aa);
          color: white;
          border-radius: 18px;
          padding: 28px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          box-shadow: 0 8px 25px rgba(15, 76, 129, 0.18);
        }

        .entry-exit-header h1 {
          margin: 0 0 8px;
          font-size: 30px;
        }

        .entry-exit-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 15px;
        }

        .entry-exit-count {
          min-width: 110px;
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          text-align: center;
        }

        .entry-exit-count span {
          display: block;
          font-size: 28px;
          font-weight: 700;
        }

        .entry-exit-count small {
          opacity: 0.9;
        }

        .entry-card,
        .records-card {
          background: white;
          border-radius: 18px;
          padding: 25px;
          margin-bottom: 24px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.07);
        }

        .entry-card h2,
        .records-card h2 {
          margin: 0;
          color: #17324d;
        }

        .entry-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 18px;
          align-items: end;
          margin-top: 22px;
        }

        .entry-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .entry-input-group label {
          font-size: 14px;
          font-weight: 600;
          color: #334e68;
        }

        .entry-input-group input {
          height: 46px;
          padding: 0 14px;
          border: 1px solid #d5dee8;
          border-radius: 9px;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
        }

        .entry-input-group input:focus {
          border-color: #1769aa;
          box-shadow: 0 0 0 3px rgba(23, 105, 170, 0.1);
        }

        .entry-submit-btn {
          height: 46px;
          padding: 0 24px;
          border: none;
          border-radius: 9px;
          background: #1769aa;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-size: 15px;
        }

        .entry-submit-btn:hover {
          background: #0f4c81;
        }

        .entry-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .records-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .records-header p {
          margin: 6px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .refresh-btn {
          border: 1px solid #d5dee8;
          background: white;
          color: #1769aa;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .refresh-btn:hover {
          background: #f1f7fc;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .entry-exit-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        .entry-exit-table th {
          background: #f5f8fb;
          color: #40566d;
          font-size: 13px;
          text-align: left;
          padding: 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .entry-exit-table td {
          padding: 15px 14px;
          border-bottom: 1px solid #edf1f5;
          color: #334e68;
          font-size: 14px;
        }

        .entry-exit-table tbody tr:hover {
          background: #fafcff;
        }

        .vehicle-number {
          color: #1769aa;
          letter-spacing: 0.5px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 11px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-badge.inside {
          background: #e6f7ed;
          color: #16834b;
        }

        .status-badge.exited {
          background: #edf0f4;
          color: #5c6773;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .exit-btn,
        .delete-record-btn {
          border: none;
          border-radius: 7px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .exit-btn {
          background: #fff3df;
          color: #b56b00;
        }

        .exit-btn:hover {
          background: #ffe6bb;
        }

        .delete-record-btn {
          background: #fff0f0;
          color: #c0392b;
        }

        .delete-record-btn:hover {
          background: #ffdede;
        }

        .empty-records {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-records h3 {
          margin: 0 0 8px;
          color: #334e68;
        }

        .empty-records p {
          margin: 0;
        }

        .module-kicker {
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 700;
          opacity: .72;
          margin-bottom: 7px;
        }

        .entry-exit-live {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 15px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 10px;
          background: rgba(255,255,255,.10);
          font-size: 13px;
        }

        .entry-exit-live strong { margin-left: 4px; font-size: 17px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #55d98b; box-shadow: 0 0 0 4px rgba(85,217,139,.13); }

        .entry-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .entry-stat-card {
          background: #fff;
          border: 1px solid #e4eaf1;
          border-radius: 14px;
          padding: 17px 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow: 0 3px 12px rgba(16, 43, 72, .045);
        }

        .entry-stat-icon {
          width: 42px; height: 42px; border-radius: 10px; display: grid; place-items: center;
          background: #edf5ff; color: #155ca8; font-size: 13px; font-weight: 800;
        }
        .entry-stat-icon.entry-green { background:#e9f8f0; color:#17804c; }
        .entry-stat-icon.entry-slate { background:#eef1f5; color:#566678; }
        .entry-stat-icon.entry-blue { background:#eaf3ff; color:#1769aa; font-size:10px; }
        .entry-stat-card strong { display:block; color:#17324d; font-size:24px; line-height:1.1; }
        .entry-stat-card small { display:block; color:#718096; font-size:12px; margin-top:5px; }

        .records-toolbar {
          display:flex; align-items:center; gap:10px; margin-bottom:17px; flex-wrap:wrap;
        }
        .record-search-wrap {
          flex:1 1 300px; min-width:240px; height:42px; border:1px solid #dbe3ec; border-radius:9px;
          display:flex; align-items:center; padding:0 12px; background:#fff; box-sizing:border-box;
        }
        .record-search-wrap span { color:#7a8a9a; font-size:19px; margin-right:7px; }
        .record-search-wrap input { border:0; outline:0; width:100%; font-size:13px; color:#334e68; background:transparent; }
        .records-toolbar select { height:42px; border:1px solid #dbe3ec; border-radius:9px; padding:0 12px; background:#fff; color:#40566d; font-size:13px; }
        .result-count { color:#718096; font-size:12px; margin-left:auto; }
        .compact-empty { padding:48px 20px; }

        @media (max-width: 900px) {

          .entry-form {
            grid-template-columns: 1fr;
          }

          .entry-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .entry-exit-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .entry-exit-count {
            width: 100%;
            box-sizing: border-box;
          }

        }

        /* =====================================================
           PROFESSIONAL CAMPUS SECURITY OVERRIDES
           Existing API / automation logic intentionally preserved.
        ===================================================== */

        .entry-exit-page {
          background: #f3f7fc;
          padding: 24px;
        }

        .entry-exit-container {
          max-width: 1450px;
        }

        .entry-exit-header {
          position: relative;
          overflow: hidden;
          min-height: 178px;
          padding: 30px 34px;
          border-radius: 16px;
          background-image:
            linear-gradient(90deg, rgba(4,35,78,.96) 0%, rgba(7,54,104,.90) 42%, rgba(7,54,104,.34) 72%, rgba(7,54,104,.20) 100%),
            url('/cvru-campus.png');
          background-size: cover;
          background-position: center;
          box-shadow: 0 10px 28px rgba(12,45,82,.16);
        }

        .entry-exit-header h1 {
          font-size: 34px;
          letter-spacing: -.5px;
          margin-bottom: 7px;
        }

        .entry-exit-header p {
          font-size: 14px;
          max-width: 540px;
        }

        .module-kicker {
          color: #bcdcff;
          opacity: 1;
          letter-spacing: 1.7px;
        }

        .entry-exit-live {
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.24);
          backdrop-filter: blur(8px);
        }

        .entry-stats-grid {
          gap: 14px;
        }

        .entry-stat-card,
        .entry-card,
        .records-card {
          border: 1px solid #e1e8f0;
          box-shadow: 0 5px 18px rgba(18,48,80,.055);
        }

        .entry-card,
        .records-card {
          border-radius: 15px;
        }

        .entry-card h2,
        .records-card h2 {
          font-size: 18px;
          color: #123d6b;
        }

        .entry-submit-btn {
          background: #1269d5;
          box-shadow: 0 5px 12px rgba(18,105,213,.18);
        }

        .entry-submit-btn:hover {
          background: #0c55b3;
        }

        .entry-exit-table th {
          background: #f6f9fc;
          color: #52677d;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .35px;
        }

        .entry-exit-table td {
          color: #344e68;
        }

        .vehicle-number {
          color: #0d5db7;
          font-size: 14px;
        }

        .status-badge.inside {
          background: #e7f8ef;
          color: #13814a;
        }

        .status-badge.exited {
          background: #eaf1fa;
          color: #37658f;
        }

        .refresh-btn {
          min-width: 86px;
        }

                @media (max-width: 600px) {

          .entry-exit-page {
            padding: 15px;
          }

          .entry-card,
          .records-card {
            padding: 18px;
          }

          .entry-exit-header {
            padding: 22px;
          }

          .entry-exit-header h1 {
            font-size: 24px;
          }

          .entry-stats-grid {
            grid-template-columns: 1fr;
          }

          .result-count {
            width: 100%;
            margin-left: 0;
          }

          .records-header {
            align-items: flex-start;
            gap: 12px;
            flex-direction: column;
          }

        }

      `}</style>
    </div>
  );
}

export default EntryExit;