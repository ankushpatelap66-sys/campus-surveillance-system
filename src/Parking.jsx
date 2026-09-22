import React, { useEffect, useState } from "react";

const CVRU_MODULE_STYLES = `
  .cvru-module-brand{
    width:100%;

max-width:1280px;margin:0 auto 24px;box-sizing:border-box;
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

// =====================================================
// API URL
// =====================================================

const API_URL =
  `${import.meta.env.VITE_API_URL}/parking`;

// =====================================================
// AUTH HEADERS
// =====================================================

const getAuthHeaders = (
  includeJson = false
) => {
  const token =
    localStorage.getItem("token");

  const headers = {
    Authorization:
      `Bearer ${token}`,
  };

  if (includeJson) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
};

// =====================================================
// COMPONENT
// =====================================================

function Parking() {
  const [slotNumber, setSlotNumber] =
    useState("");

  const [vehicleNumber, setVehicleNumber] =
    useState("");

  const [ownerName, setOwnerName] =
    useState("");

  const [parkingRecords, setParkingRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // =====================================================
  // FETCH PARKING RECORDS
  // =====================================================

  const fetchParkingRecords =
    async () => {
      try {
        const response =
          await fetch(API_URL, {
            method: "GET",
            headers:
              getAuthHeaders(),
          });

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          alert(
            data.message ||
              "You do not have permission to view parking records."
          );
          return;
        }

        if (data.success) {
          setParkingRecords(
            data.parkingRecords ||
              []
          );
        } else {
          alert(
            data.message ||
              "Failed to fetch parking records."
          );
        }
      } catch (error) {
        console.error(
          "FETCH PARKING ERROR:",
          error
        );

        alert(
          "Server se connection nahi ho pa raha hai."
        );
      }
    };

  // =====================================================
  // LOAD RECORDS
  // =====================================================

  useEffect(() => {
    fetchParkingRecords();
  }, []);

  // =====================================================
  // PARK VEHICLE
  // =====================================================

  const handleParkVehicle =
    async (e) => {
      e.preventDefault();

      if (
        !slotNumber.trim() ||
        !vehicleNumber.trim() ||
        !ownerName.trim()
      ) {
        alert(
          "Slot number, vehicle number aur owner name required hai."
        );
        return;
      }

      setLoading(true);

      try {
        const response =
          await fetch(API_URL, {
            method: "POST",

            headers:
              getAuthHeaders(true),

            body: JSON.stringify({
              slotNumber:
                slotNumber
                  .trim()
                  .toUpperCase(),

              vehicleNumber:
                vehicleNumber
                  .trim()
                  .toUpperCase(),

              ownerName:
                ownerName.trim(),
            }),
          });

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          alert(
            data.message ||
              "You do not have permission to park a vehicle."
          );

          return;
        }

        if (data.success) {
          alert(
            "Vehicle parked successfully."
          );

          setSlotNumber("");
          setVehicleNumber("");
          setOwnerName("");

          await fetchParkingRecords();
        } else {
          alert(
            data.message ||
              "Failed to park vehicle."
          );
        }
      } catch (error) {
        console.error(
          "PARK VEHICLE ERROR:",
          error
        );

        alert(
          "Server se connection nahi ho pa raha hai."
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // RELEASE PARKING SLOT
  // =====================================================

  const handleReleaseSlot =
    async (id) => {
      const confirmRelease =
        window.confirm(
          "Kya aap is parking slot ko release karna chahte hain?"
        );

      if (!confirmRelease) {
        return;
      }

      setLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/${id}/release`,
            {
              method: "PUT",

              headers:
                getAuthHeaders(true),
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          alert(
            data.message ||
              "You do not have permission to release this parking slot."
          );

          return;
        }

        if (data.success) {
          alert(
            "Parking slot released successfully."
          );

          await fetchParkingRecords();
        } else {
          alert(
            data.message ||
              "Failed to release parking slot."
          );
        }
      } catch (error) {
        console.error(
          "RELEASE PARKING ERROR:",
          error
        );

        alert(
          "Server se connection nahi ho pa raha hai."
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // DELETE PARKING RECORD
  // ADMIN ONLY
  // =====================================================

  const handleDelete =
    async (id) => {
      const confirmDelete =
        window.confirm(
          "Kya aap ye parking record delete karna chahte hain?"
        );

      if (!confirmDelete) {
        return;
      }

      setLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/${id}`,
            {
              method: "DELETE",

              headers:
                getAuthHeaders(),
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          alert(
            data.message ||
              "Only Admin can delete parking records."
          );

          return;
        }

        if (data.success) {
          alert(
            "Parking record deleted successfully."
          );

          await fetchParkingRecords();
        } else {
          alert(
            data.message ||
              "Failed to delete parking record."
          );
        }
      } catch (error) {
        console.error(
          "DELETE PARKING ERROR:",
          error
        );

        alert(
          "Server se connection nahi ho pa raha hai."
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDateTime =
    (date) => {
      if (!date) {
        return "-";
      }

      return new Date(
        date
      ).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    };

  // =====================================================
  // COUNTS
  // =====================================================

  const PARKING_CAPACITY = 120;

  const occupiedCount =
    parkingRecords.filter(
      (record) =>
        record.status ===
        "Occupied"
    ).length;

  const availableCount = Math.max(
    PARKING_CAPACITY - occupiedCount,
    0
  );

  const filteredParkingRecords =
    parkingRecords.filter((record) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;

      return [
        record.slotNumber,
        record.vehicleNumber,
        record.ownerName,
        record.status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });

  const occupiedSlots = new Set(
    parkingRecords
      .filter((record) => record.status === "Occupied")
      .map((record) => record.slotNumber)
  );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="parking-page">
      <style>{CVRU_MODULE_STYLES}</style>
      <div className="parking-container">
  
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="parking-hero">
          <div className="parking-hero-overlay">
            <div>
              <div className="parking-hero-kicker">CAMPUS PARKING MANAGEMENT</div>
              <h1>Parking Management</h1>
              <p>Manage campus parking slots and parked vehicles for smooth, secure vehicle operations.</p>
            </div>
            <button className="parking-refresh-btn parking-hero-refresh" onClick={fetchParkingRecords} disabled={loading}>↻ Refresh</button>
          </div>
        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="parking-stats">

          <div className="parking-stat-card">
            <div className="stat-icon">
              🅿️
            </div>

            <div>
              <span className="stat-number">
                {PARKING_CAPACITY}
              </span>

              <span className="stat-label">
                Total Capacity
              </span>
            </div>
          </div>

          <div className="parking-stat-card occupied-card">
            <div className="stat-icon">
              🚗
            </div>

            <div>
              <span className="stat-number">
                {occupiedCount}
              </span>

              <span className="stat-label">
                Occupied
              </span>
            </div>
          </div>

          <div className="parking-stat-card available-card">
            <div className="stat-icon">
              ✅
            </div>

            <div>
              <span className="stat-number">
                {availableCount}
              </span>

              <span className="stat-label">
                Available Slots
              </span>
            </div>
          </div>

          <div className="parking-stat-card capacity-card">
            <div className="stat-icon">▦</div>
            <div>
              <span className="stat-number">
                {occupiedCount} / {PARKING_CAPACITY}
              </span>
              <span className="stat-label">
                Occupancy
              </span>
            </div>
          </div>

        </div>

        <div className="parking-capacity-card">
          <div>
            <strong>Campus Parking Capacity</strong>
            <span>{occupiedCount} occupied · {availableCount} available</span>
          </div>
          <div className="parking-capacity-track">
            <div
              className="parking-capacity-fill"
              style={{ width: `${Math.min((occupiedCount / PARKING_CAPACITY) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="parking-slot-card">
          <div className="parking-section-heading">
            <div>
              <h2>Parking Slot Overview</h2>
              <p>Live status of the 120 campus parking slots.</p>
            </div>
            <div className="parking-slot-legend">
              <span><i className="legend-dot available-dot" /> Available</span>
              <span><i className="legend-dot occupied-dot" /> Occupied</span>
            </div>
          </div>
          <div className="parking-slot-grid">
            {Array.from({ length: PARKING_CAPACITY }, (_, index) => {
              const slot = `P-${String(index + 1).padStart(2, "0")}`;
              const occupied = occupiedSlots.has(slot);
              return (
                <div key={slot} className={`parking-slot ${occupied ? "is-occupied" : "is-available"}`} title={occupied ? `${slot} • Occupied` : `${slot} • Available`}>
                  {slot}
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================
            PARK VEHICLE FORM
        ================================================= */}

        <div className="parking-form-card">

          <div className="card-title">

            <div>
              <h2>
                Park Vehicle
              </h2>

              <p>
                Assign a parking slot
                to a vehicle.
              </p>
            </div>

            <div className="title-icon">
              🚗
            </div>

          </div>

          <form
            onSubmit={
              handleParkVehicle
            }
            className="parking-form"
          >

            {/* SLOT */}

            <div className="parking-input-group">

              <label>
                Parking Slot Number
              </label>

              <input
                type="text"
                placeholder="e.g. P-01"
                value={
                  slotNumber
                }
                onChange={(e) =>
                  setSlotNumber(
                    e.target.value.toUpperCase()
                  )
                }
              />

            </div>

            {/* VEHICLE */}

            <div className="parking-input-group">

              <label>
                Vehicle Number
              </label>

              <input
                type="text"
                placeholder="e.g. BR01AB1234"
                value={
                  vehicleNumber
                }
                onChange={(e) =>
                  setVehicleNumber(
                    e.target.value.toUpperCase()
                  )
                }
              />

            </div>

            {/* OWNER */}

            <div className="parking-input-group">

              <label>
                Owner Name
              </label>

              <input
                type="text"
                placeholder="Enter owner name"
                value={
                  ownerName
                }
                onChange={(e) =>
                  setOwnerName(
                    e.target.value
                  )
                }
              />

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="park-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : "🅿️ Park Vehicle"}
            </button>

          </form>
        </div>

        {/* =================================================
            PARKING RECORDS
        ================================================= */}

        <div className="parking-records-card">

          <div className="records-header">

            <div>
              <h2>
                Parking Records
              </h2>

              <p>
                All current and previous
                parking records.
              </p>
            </div>

            <div className="parking-record-actions">
              <input
                className="parking-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search slot, vehicle or owner"
                aria-label="Search parking records"
              />
              <button
                className="parking-refresh-btn"
                onClick={
                  fetchParkingRecords
                }
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredParkingRecords.length ===
          0 ? (

            <div className="parking-empty">

              <div className="parking-empty-icon">
                🅿️
              </div>

              <h3>
                {searchTerm ? "No Matching Parking Records" : "No Parking Records"}
              </h3>

              <p>
                {searchTerm
                  ? "Try another slot, vehicle number or owner name."
                  : "Abhi tak koi parking record available nahi hai."}
              </p>

            </div>

          ) : (

            <div className="parking-table-wrapper">

              <table className="parking-table">

                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Slot
                    </th>

                    <th>
                      Vehicle Number
                    </th>

                    <th>
                      Owner Name
                    </th>

                    <th>
                      Parking Time
                    </th>

                    <th>
                      Exit Time
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredParkingRecords.map(
                    (
                      record,
                      index
                    ) => (

                      <tr
                        key={
                          record._id
                        }
                      >

                        {/* NUMBER */}

                        <td>
                          {index + 1}
                        </td>

                        {/* SLOT */}

                        <td>

                          <strong className="slot-number">
                            {
                              record.slotNumber
                            }
                          </strong>

                        </td>

                        {/* VEHICLE */}

                        <td>

                          <strong className="parking-vehicle-number">
                            {
                              record.vehicleNumber
                            }
                          </strong>

                        </td>

                        {/* OWNER */}

                        <td>
                          {
                            record.ownerName
                          }
                        </td>

                        {/* PARKING TIME */}

                        <td>
                          {
                            formatDateTime(
                              record.parkingTime
                            )
                          }
                        </td>

                        {/* EXIT TIME */}

                        <td>
                          {
                            formatDateTime(
                              record.exitTime
                            )
                          }
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              record.status ===
                              "Occupied"
                                ? "parking-status occupied"
                                : "parking-status available"
                            }
                          >
                            {
                              record.status
                            }
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          <div className="parking-actions">

                            {/* RELEASE */}

                            {record.status ===
                              "Occupied" && (

                              <button
                                className="release-btn"
                                onClick={() =>
                                  handleReleaseSlot(
                                    record._id
                                  )
                                }
                                disabled={
                                  loading
                                }
                              >
                                Release
                              </button>

                            )}

                            {/* DELETE */}

                            <button
                              className="parking-delete-btn"
                              onClick={() =>
                                handleDelete(
                                  record._id
                                )
                              }
                              disabled={
                                loading
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          PAGE STYLES
      ===================================================== */}

      <style>{`

        .parking-page {
          min-height: 100vh;
          background: #f4f7fb;
          padding: 30px;
          box-sizing: border-box;
        }

        .parking-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .parking-header {
          background: linear-gradient(
            135deg,
            #0f4c81,
            #1769aa
          );

          color: white;
          border-radius: 18px;
          padding: 28px 32px;

          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-bottom: 24px;

          box-shadow:
            0 8px 25px
            rgba(
              15,
              76,
              129,
              0.18
            );
        }

        .parking-header h1 {
          margin: 0 0 8px;
          font-size: 30px;
        }

        .parking-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 15px;
        }

        .parking-header-icon {
          width: 65px;
          height: 65px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 15px;

          background:
            rgba(
              255,
              255,
              255,
              0.15
            );

          font-size: 32px;
        }

        .parking-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);

          gap: 18px;
          margin-bottom: 24px;
        }

        .parking-stat-card {
          background: white;

          border-radius: 16px;

          padding: 20px;

          display: flex;
          align-items: center;

          gap: 16px;

          box-shadow:
            0 5px 20px
            rgba(
              0,
              0,
              0,
              0.06
            );
        }

        .stat-icon {
          width: 52px;
          height: 52px;

          border-radius: 13px;

          background: #edf5fb;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 25px;
        }

        .stat-number {
          display: block;

          font-size: 25px;
          font-weight: 700;

          color: #17324d;
        }

        .stat-label {
          display: block;

          margin-top: 3px;

          color: #718096;

          font-size: 13px;
        }

        .occupied-card .stat-icon {
          background: #fff3df;
        }

        .available-card .stat-icon {
          background: #e7f7ee;
        }

        .parking-form-card,
        .parking-records-card {
          background: white;

          border-radius: 18px;

          padding: 25px;

          margin-bottom: 24px;

          box-shadow:
            0 5px 20px
            rgba(
              0,
              0,
              0,
              0.07
            );
        }

        .card-title {
          display: flex;

          justify-content:
            space-between;

          align-items: center;
        }

        .card-title h2,
        .records-header h2 {
          margin: 0;
          color: #17324d;
        }

        .card-title p,
        .records-header p {
          margin: 6px 0 0;

          color: #718096;

          font-size: 14px;
        }

        .title-icon {
          width: 45px;
          height: 45px;

          border-radius: 11px;

          background: #edf5fb;

          display: flex;

          align-items: center;
          justify-content: center;

          font-size: 22px;
        }

        .parking-form {
          display: grid;

          grid-template-columns:
            1fr
            1fr
            1fr
            auto;

          gap: 18px;

          align-items: end;

          margin-top: 22px;
        }

        .parking-input-group {
          display: flex;

          flex-direction: column;

          gap: 8px;
        }

        .parking-input-group label {
          font-size: 14px;

          font-weight: 600;

          color: #334e68;
        }

        .parking-input-group input {
          height: 46px;

          padding: 0 14px;

          border:
            1px solid
            #d5dee8;

          border-radius: 9px;

          font-size: 15px;

          outline: none;

          box-sizing: border-box;
        }

        .parking-input-group input:focus {
          border-color: #1769aa;

          box-shadow:
            0 0 0 3px
            rgba(
              23,
              105,
              170,
              0.1
            );
        }

        .park-submit-btn {
          height: 46px;

          padding:
            0 22px;

          border: none;

          border-radius: 9px;

          background: #1769aa;

          color: white;

          font-weight: 600;

          font-size: 14px;

          cursor: pointer;

          white-space: nowrap;
        }

        .park-submit-btn:hover {
          background: #0f4c81;
        }

        .park-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .records-header {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 20px;
        }

        .parking-refresh-btn {
          border:
            1px solid
            #d5dee8;

          background: white;

          color: #1769aa;

          padding:
            10px 16px;

          border-radius: 8px;

          cursor: pointer;

          font-weight: 600;
        }

        .parking-refresh-btn:hover {
          background: #f1f7fc;
        }

        .parking-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .parking-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .parking-table {
          width: 100%;

          border-collapse:
            collapse;

          min-width:
            1150px;
        }

        .parking-table th {
          background: #f5f8fb;

          color: #40566d;

          font-size: 13px;

          text-align: left;

          padding: 14px;

          border-bottom:
            1px solid
            #e2e8f0;
        }

        .parking-table td {
          padding: 15px 14px;

          border-bottom:
            1px solid
            #edf1f5;

          color: #334e68;

          font-size: 14px;
        }

        .parking-table tbody tr:hover {
          background: #fafcff;
        }

        .slot-number {
          color: #1769aa;
          letter-spacing: 0.5px;
        }

        .parking-vehicle-number {
          color: #17324d;
          letter-spacing: 0.5px;
        }

        .parking-status {
          display: inline-block;

          padding:
            6px 11px;

          border-radius: 20px;

          font-size: 12px;

          font-weight: 700;

          white-space: nowrap;
        }

        .parking-status.occupied {
          background: #fff3df;
          color: #b56b00;
        }

        .parking-status.available {
          background: #e6f7ed;
          color: #16834b;
        }

        .parking-actions {
          display: flex;
          gap: 8px;
        }

        .release-btn,
        .parking-delete-btn {
          border: none;

          border-radius: 7px;

          padding:
            8px 12px;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;

          white-space: nowrap;
        }

        .release-btn {
          background: #fff3df;
          color: #b56b00;
        }

        .release-btn:hover {
          background: #ffe6bb;
        }

        .parking-delete-btn {
          background: #fff0f0;
          color: #c0392b;
        }

        .parking-delete-btn:hover {
          background: #ffdede;
        }

        .release-btn:disabled,
        .parking-delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .parking-empty {
          text-align: center;

          padding: 60px 20px;

          color: #718096;
        }

        .parking-empty-icon {
          font-size: 48px;

          margin-bottom: 12px;
        }

        .parking-empty h3 {
          margin:
            0 0 8px;

          color: #334e68;
        }

        .parking-empty p {
          margin: 0;
        }

        @media (max-width: 1100px) {

          .parking-form {
            grid-template-columns:
              1fr
              1fr;
          }

          .park-submit-btn {
            width: 100%;
          }

        }

        @media (max-width: 700px) {

          .parking-page {
            padding: 15px;
          }

          .parking-header {
            padding: 22px;

            align-items:
              flex-start;

            gap: 15px;
          }

          .parking-header h1 {
            font-size: 24px;
          }

          .parking-stats {
            grid-template-columns:
              1fr;
          }

          .parking-form {
            grid-template-columns:
              1fr;
          }

          .parking-form-card,
          .parking-records-card {
            padding: 18px;
          }

          .records-header {
            flex-direction:
              column;

            align-items:
              flex-start;

            gap: 12px;
          }

          .parking-refresh-btn {
            width: 100%;
          }

        }


        /* NEXT 8 — CVRU PARKING MANAGEMENT */
        .parking-page {
          background: #f4f7fb;
          padding: 26px 32px 42px;
        }
        .parking-container { max-width: 1240px; }
        .parking-header {
          background: linear-gradient(135deg, #082d63, #1767bd);
          border-radius: 10px;
          padding: 22px 25px;
          margin-bottom: 16px;
          box-shadow: 0 7px 20px rgba(8,45,99,.10);
        }
        .parking-header h1 { font-size: 23px; margin-bottom: 5px; }
        .parking-header p { font-size: 11px; }
        .parking-header-icon { width: 50px; height: 50px; border-radius: 9px; font-size: 23px; }
        .parking-stats { grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
        .parking-stat-card { min-height: 74px; padding: 14px; border-radius: 9px; border: 1px solid #e1e9f3; box-shadow: 0 5px 16px rgba(18,55,108,.06); }
        .parking-stat-card .stat-icon { width: 40px; height: 40px; border-radius: 8px; font-size: 18px; }
        .parking-stat-card .stat-number { font-size: 21px; color: #0a2d62; }
        .parking-stat-card .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: .35px; font-weight: 700; }
        .parking-capacity-card, .parking-slot-card, .parking-form-card, .parking-records-card {
          background: #fff; border: 1px solid #e1e9f3; border-radius: 10px; box-shadow: 0 6px 18px rgba(18,55,108,.06);
        }
        .parking-capacity-card { padding: 14px 16px; margin-bottom: 12px; }
        .parking-capacity-card > div:first-child { display:flex; justify-content:space-between; gap:12px; margin-bottom:8px; }
        .parking-capacity-card strong { color:#0a2d62; font-size:12px; }
        .parking-capacity-card span { color:#6b7f9c; font-size:10px; }
        .parking-capacity-track { height:7px; background:#eaf0f7; border-radius:999px; overflow:hidden; }
        .parking-capacity-fill { height:100%; background:linear-gradient(90deg,#1767bd,#0a8e5e); border-radius:999px; transition:width .25s ease; }
        .parking-slot-card { padding: 16px; margin-bottom: 12px; }
        .parking-section-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:13px; }
        .parking-section-heading h2 { margin:0; color:#0a2d62; font-size:15px; }
        .parking-section-heading p { margin:4px 0 0; color:#6b7f9c; font-size:10px; }
        .parking-slot-legend { display:flex; gap:12px; color:#6b7f9c; font-size:9px; font-weight:700; }
        .parking-slot-legend span { display:flex; align-items:center; gap:5px; }
        .legend-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }
        .available-dot { background:#19a46b; } .occupied-dot { background:#d78a1f; }
        .parking-slot-grid { display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:6px; }
        .parking-slot { padding:7px 3px; border-radius:5px; text-align:center; font-size:8px; font-weight:800; border:1px solid; cursor:default; }
        .parking-slot.is-available { background:#edf9f3; color:#16834b; border-color:#cceedd; }
        .parking-slot.is-occupied { background:#fff5e5; color:#b56b00; border-color:#f4d9a9; }
        .parking-form-card, .parking-records-card { padding:17px; margin-bottom:12px; }
        .card-title h2, .records-header h2 { font-size:15px; color:#0a2d62; }
        .card-title p, .records-header p { font-size:10px; }
        .title-icon { width:40px; height:40px; font-size:18px; }
        .parking-form { gap:12px; margin-top:15px; }
        .parking-input-group { gap:6px; }
        .parking-input-group label { font-size:10px; font-weight:700; color:#405b7d; }
        .parking-input-group input { height:38px; border-radius:6px; font-size:11px; }
        .park-submit-btn { height:38px; border-radius:6px; font-size:10px; background:#1767bd; }
        .records-header { margin-bottom:12px; }
        .parking-record-actions { display:flex; align-items:center; gap:8px; }
        .parking-search-input { width:220px; height:34px; box-sizing:border-box; border:1px solid #d9e3ef; border-radius:6px; padding:0 10px; outline:none; font-size:10px; color:#294d7b; }
        .parking-search-input:focus { border-color:#1767bd; box-shadow:0 0 0 3px rgba(23,103,189,.08); }
        .parking-refresh-btn { padding:8px 11px; border-radius:6px; font-size:10px; }
        .parking-table { min-width:980px; }
        .parking-table th { padding:10px 11px; font-size:9px; text-transform:uppercase; letter-spacing:.25px; }
        .parking-table td { padding:11px; font-size:10px; }
        .parking-status { padding:4px 8px; font-size:9px; }
        .release-btn, .parking-delete-btn { padding:6px 9px; font-size:9px; border-radius:5px; }
        @media (max-width: 1050px) { .parking-stats { grid-template-columns:repeat(2,1fr); } .parking-slot-grid { grid-template-columns:repeat(10,1fr); } }
        @media (max-width: 700px) { .parking-page { padding:20px 12px 30px; } .parking-stats { grid-template-columns:1fr; } .parking-section-heading, .records-header { flex-direction:column; align-items:flex-start; } .parking-record-actions { width:100%; flex-direction:column; align-items:stretch; } .parking-search-input { width:100%; } .parking-slot-grid { grid-template-columns:repeat(6,1fr); } }

        /* PARKING HERO — same visual language as Vehicle Management */
        .parking-hero {
          position: relative;
          min-height: 190px;
          margin-bottom: 16px;
          border-radius: 14px;
          overflow: hidden;
          background-image: url("/cvru-campus.png");
          background-size: cover;
          background-position: center 48%;
          box-shadow: 0 8px 22px rgba(10,47,90,.10);
        }
        .parking-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(4,34,70,.88) 0%, rgba(7,53,99,.68) 48%, rgba(7,53,99,.20) 100%);
        }
        .parking-hero-overlay {
          position: relative;
          z-index: 1;
          min-height: 190px;
          padding: 28px 30px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          color: #fff;
        }
        .parking-hero-kicker {
          margin-bottom: 7px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.6px;
          color: #b9dcff;
        }
        .parking-hero h1 {
          margin: 0 0 7px;
          font-size: 30px;
          line-height: 1.1;
          color: #fff;
        }
        .parking-hero p {
          margin: 0;
          max-width: 760px;
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255,255,255,.92);
        }
        .parking-hero-refresh {
          flex: 0 0 auto;
          border: 0 !important;
          background: #fff !important;
          color: #0a4f93 !important;
          box-shadow: 0 6px 16px rgba(0,0,0,.14);
        }
        @media (max-width: 700px) {
          .parking-hero, .parking-hero-overlay { min-height: 210px; }
          .parking-hero-overlay { align-items: flex-start; flex-direction: column; justify-content: center; padding: 24px; }
          .parking-hero h1 { font-size: 25px; }
          .parking-hero-refresh { width: auto; }
        }
      `}</style>
    </div>
  );
}

export default Parking;
