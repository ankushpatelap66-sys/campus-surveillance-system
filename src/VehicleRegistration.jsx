import React, { useEffect, useMemo, useState } from "react";

const API_URL = `${import.meta.env.VITE_API_URL}/vehicles`;

const getAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem("token");
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const emptyForm = {
  ownerName: "",
  vehicleNumber: "",
  vehicleType: "Car",
  personType: "Student",
  contact: "",
};

function VehicleRegistration({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      setErrorMessage("");

      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load vehicles");
      }

      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error("GET VEHICLES ERROR:", error);
      setErrorMessage(error.message || "Vehicles load nahi ho pa rahe hain.");
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const isEditing = Boolean(editingId);
      const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Vehicle request failed");
      }

      setSuccessMessage(
        isEditing ? "Vehicle details updated successfully." : "Vehicle registered successfully."
      );
      resetForm();
      await loadVehicles();
    } catch (error) {
      console.error("VEHICLE SUBMIT ERROR:", error);
      setErrorMessage(error.message || "Server se connection nahi ho pa raha hai.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle._id);
    setFormData({
      ownerName: vehicle.ownerName || "",
      vehicleNumber: vehicle.vehicleNumber || "",
      vehicleType: vehicle.vehicleType || "Car",
      personType: vehicle.personType || "Student",
      contact: vehicle.contact || "",
    });
    setSuccessMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setSuccessMessage("Vehicle deleted successfully.");
      await loadVehicles();
    } catch (error) {
      console.error("DELETE VEHICLE ERROR:", error);
      setErrorMessage(error.message || "Vehicle delete nahi ho pa raha hai.");
    }
  };

  const vehicleStats = useMemo(() => {
    const normalized = vehicles.map((vehicle) => ({
      ...vehicle,
      type: String(vehicle.vehicleType || "Other").toLowerCase(),
      person: String(vehicle.personType || "Other").toLowerCase(),
    }));

    return {
      total: vehicles.length,
      cars: normalized.filter((vehicle) => vehicle.type === "car").length,
      twoWheelers: normalized.filter(
        (vehicle) => vehicle.type === "bike" || vehicle.type === "scooter" || vehicle.type === "motorcycle"
      ).length,
      staff: normalized.filter(
        (vehicle) => vehicle.person === "staff" || vehicle.person === "faculty"
      ).length,
    };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return vehicles;

    return vehicles.filter((vehicle) =>
      [
        vehicle.ownerName,
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.personType,
        vehicle.contact,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [vehicles, searchTerm]);

  return (
    <div className="vms-page">
      <style>{`
        .vms-page{min-height:100vh;background:#f4f7fc;color:#0d376d;padding:34px 32px 60px;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
        .vms-page *{box-sizing:border-box}
        .vms-container{width:100%;max-width:1320px;margin:0 auto}
        .vms-top{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:24px}
        .vms-kicker{font-size:12px;font-weight:800;letter-spacing:1.5px;color:#3970a8;text-transform:uppercase;margin-bottom:8px}
        .vms-title{margin:0;color:#103f77;font-size:36px;line-height:1.1;font-weight:800}
        .vms-subtitle{margin:9px 0 0;color:#6b83a0;font-size:15px}
        .vms-back{border:1px solid #c9dbef;background:#fff;color:#1768d8;border-radius:9px;padding:12px 19px;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap}
        .vms-back:hover{background:#f3f8ff}

        .vms-brand{display:none}
        .vms-hero{position:relative;overflow:hidden;border-radius:18px;min-height:210px;background-image:linear-gradient(90deg,rgba(6,43,83,.94) 0%,rgba(8,58,105,.80) 42%,rgba(8,58,105,.34) 100%),url("/cvru-campus.png");background-size:cover;background-position:center;color:#fff;padding:34px 34px;display:flex;align-items:flex-end;justify-content:space-between;gap:28px;box-shadow:0 12px 28px rgba(9,54,100,.16);margin-bottom:22px}
        .vms-brand-left{display:flex;align-items:center;gap:18px;min-width:0}
        .vms-brand-logo{width:82px;height:72px;object-fit:contain;display:block;flex:0 0 auto}
        .vms-brand-name{font-size:22px;font-weight:800;color:#103b70;letter-spacing:.1px}
        .vms-brand-place{margin-top:4px;font-size:13px;font-weight:700;letter-spacing:1px;color:#5d7693}
        .vms-online{display:flex;align-items:center;gap:9px;color:#55718e;font-size:14px;white-space:nowrap}
        .vms-online-dot{width:10px;height:10px;border-radius:50%;background:#1fbe79;box-shadow:0 0 0 5px #e5f8ef}
        .vms-online strong{color:#365a7e}

        
        .vms-hero-kicker{font-size:12px;font-weight:800;letter-spacing:1.6px;color:#a9d7ff;text-transform:uppercase;margin-bottom:8px}
        .vms-hero h2{margin:0;font-size:29px;line-height:1.1;font-weight:800}
        .vms-hero p{margin:9px 0 0;color:#e0f0ff;font-size:15px;max-width:760px;line-height:1.5}
        .vms-refresh{border:0;border-radius:10px;background:#fff;color:#125da9;padding:13px 20px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 5px 15px rgba(0,0,0,.12);white-space:nowrap}
        .vms-refresh:disabled{opacity:.65;cursor:wait}

        .vms-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:22px}
        .vms-stat{background:#fff;border:1px solid #d9e6f3;border-radius:15px;padding:20px 20px 18px;min-height:136px;box-shadow:0 5px 18px rgba(18,62,108,.06);position:relative;overflow:hidden}
        .vms-stat:after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:#2d7be5}
        .vms-stat.green:after{background:#28be86}.vms-stat.orange:after{background:#f0a528}.vms-stat.purple:after{background:#7b8eea}
        .vms-stat-head{display:flex;align-items:center;gap:13px}
        .vms-stat-icon{width:43px;height:43px;border-radius:12px;background:#eaf3ff;color:#176bd4;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800}
        .vms-stat.green .vms-stat-icon{background:#e8f8f1;color:#13a76f}.vms-stat.orange .vms-stat-icon{background:#fff5e5;color:#df8c00}.vms-stat.purple .vms-stat-icon{background:#eef0ff;color:#6476d8}
        .vms-stat-label{font-size:14px;font-weight:700;color:#57718e}.vms-stat-value{font-size:29px;font-weight:800;color:#103e73;margin-top:3px}.vms-stat-note{font-size:12px;color:#7890a9;margin-top:6px}

        .vms-grid{display:grid;grid-template-columns:minmax(0,390px) minmax(0,1fr);gap:22px;align-items:start}
        .vms-card{background:#fff;border:1px solid #d8e5f2;border-radius:16px;overflow:hidden;box-shadow:0 5px 18px rgba(18,62,108,.06)}
        .vms-card-head{padding:19px 22px;border-bottom:1px solid #e3edf6;display:flex;align-items:center;justify-content:space-between;gap:15px}
        .vms-card-head h3{margin:0;color:#103d72;font-size:19px;font-weight:800}.vms-card-head span{font-size:12px;color:#7890aa}
        .vms-form{padding:22px}
        .vms-field{margin-bottom:16px}.vms-field:last-child{margin-bottom:0}
        .vms-field label{display:block;font-size:12px;font-weight:800;color:#486986;margin-bottom:7px;letter-spacing:.2px}
        .vms-field input,.vms-field select{width:100%;height:45px;border:1px solid #cdddeb;border-radius:9px;padding:0 13px;background:#fbfdff;color:#173f70;font-size:14px;outline:none;transition:.18s}
        .vms-field input:focus,.vms-field select:focus{border-color:#3181e6;box-shadow:0 0 0 3px rgba(49,129,230,.10);background:#fff}
        .vms-form-row{display:grid;grid-template-columns:1fr 1fr;gap:13px}
        .vms-actions{display:flex;gap:10px;margin-top:20px}.vms-primary,.vms-secondary{height:44px;border-radius:9px;padding:0 17px;font-weight:800;font-size:14px;cursor:pointer}
        .vms-primary{border:0;background:#176ddd;color:#fff;flex:1}.vms-primary:hover{background:#0d5bc2}.vms-primary:disabled{opacity:.65;cursor:wait}
        .vms-secondary{border:1px solid #cbdceb;background:#fff;color:#41627f}.vms-secondary:hover{background:#f5f9fd}
        .vms-editing{background:#fff7df;border:1px solid #f2d98f;color:#85620c;border-radius:9px;padding:10px 12px;font-size:12px;font-weight:700;margin-bottom:15px}

        .vms-list{min-width:0}.vms-list-toolbar{padding:16px 20px;border-bottom:1px solid #e4edf6;display:flex;gap:10px;align-items:center}
        .vms-search{height:43px;flex:1;min-width:180px;border:1px solid #cfdeed;border-radius:9px;padding:0 13px;font-size:14px;color:#173f70;outline:none}.vms-search:focus{border-color:#3181e6;box-shadow:0 0 0 3px rgba(49,129,230,.10)}
        .vms-count{font-size:12px;font-weight:800;color:#5e7894;background:#eef5fd;border:1px solid #d7e7f7;border-radius:20px;padding:9px 12px;white-space:nowrap}
        .vms-table-wrap{overflow:auto}.vms-table{width:100%;border-collapse:collapse;min-width:720px}.vms-table th{background:#f7faff;color:#58728f;font-size:11px;text-transform:uppercase;letter-spacing:.8px;text-align:left;padding:13px 14px;border-bottom:1px solid #dfeaf5}.vms-table td{padding:15px 14px;border-bottom:1px solid #edf2f7;color:#23496e;font-size:13px;vertical-align:middle}.vms-table tr:hover td{background:#fbfdff}.vms-owner{font-weight:800;color:#163f72}.vms-number{font-weight:800;color:#145fb7;letter-spacing:.4px}.vms-muted{color:#7790aa}.vms-pill{display:inline-flex;align-items:center;border-radius:20px;padding:6px 9px;background:#edf5ff;color:#2865a5;font-size:11px;font-weight:800}.vms-pill.person{background:#eef9f5;color:#168261}.vms-actions-cell{white-space:nowrap}.vms-mini-btn{border:1px solid #d4e1ee;background:#fff;border-radius:7px;padding:7px 9px;font-size:12px;font-weight:800;cursor:pointer;margin-right:6px}.vms-mini-btn.edit{color:#1265ca}.vms-mini-btn.edit:hover{background:#eef6ff}.vms-mini-btn.delete{color:#d33c47}.vms-mini-btn.delete:hover{background:#fff0f1}
        .vms-empty{padding:48px 20px;text-align:center;color:#7a91aa}.vms-empty-icon{font-size:30px;margin-bottom:8px}.vms-empty strong{display:block;color:#345a7e;margin-bottom:4px}

        .vms-alert{margin-bottom:18px;padding:13px 16px;border-radius:10px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:9px}.vms-success{background:#eaf9f1;border:1px solid #b6e5cb;color:#12784f}.vms-error{background:#fff0f1;border:1px solid #efbdc2;color:#b32e38}.vms-close{margin-left:auto;border:0;background:transparent;color:inherit;font-size:18px;cursor:pointer}

        @media(max-width:1050px){.vms-stats{grid-template-columns:repeat(2,1fr)}.vms-grid{grid-template-columns:1fr}.vms-form-card{order:1}.vms-list{order:2}}
        @media(max-width:700px){.vms-page{padding:22px 15px 40px}.vms-top{flex-direction:column}.vms-back{width:100%}.vms-brand{align-items:flex-start}.vms-online{display:none}.vms-brand-logo{width:65px;height:60px}.vms-brand-name{font-size:17px}.vms-hero{padding:23px 20px;align-items:flex-start;flex-direction:column}.vms-refresh{width:100%}.vms-stats{grid-template-columns:1fr}.vms-form-row{grid-template-columns:1fr}.vms-list-toolbar{flex-direction:column;align-items:stretch}.vms-count{text-align:center}}
      `}</style>

      <div className="vms-container">
        {(successMessage || errorMessage) && (
          <div className={`vms-alert ${successMessage ? "vms-success" : "vms-error"}`}>
            <span>{successMessage ? "✓" : "!"}</span>
            <span>{successMessage || errorMessage}</span>
            <button className="vms-close" onClick={() => { setSuccessMessage(""); setErrorMessage(""); }}>×</button>
          </div>
        )}

        <section className="vms-hero">
          <div>
            <div className="vms-hero-kicker">CAMPUS VEHICLE REGISTRY</div>
            <h2>Vehicle Management</h2>
            <p>Register and manage authorized campus vehicles for automated entry, parking and security monitoring.</p>
          </div>
          <button className="vms-refresh" onClick={loadVehicles} disabled={loadingVehicles}>↻ Refresh</button>
        </section>

        <section className="vms-stats">
          <div className="vms-stat"><div className="vms-stat-head"><div className="vms-stat-icon">🚗</div><div><div className="vms-stat-label">Registered Vehicles</div><div className="vms-stat-value">{vehicleStats.total}</div></div></div><div className="vms-stat-note">Total authorized records</div></div>
          <div className="vms-stat green"><div className="vms-stat-head"><div className="vms-stat-icon">🚘</div><div><div className="vms-stat-label">Cars</div><div className="vms-stat-value">{vehicleStats.cars}</div></div></div><div className="vms-stat-note">Four-wheelers registered</div></div>
          <div className="vms-stat orange"><div className="vms-stat-head"><div className="vms-stat-icon">🏍</div><div><div className="vms-stat-label">Two Wheelers</div><div className="vms-stat-value">{vehicleStats.twoWheelers}</div></div></div><div className="vms-stat-note">Bikes and scooters</div></div>
          <div className="vms-stat purple"><div className="vms-stat-head"><div className="vms-stat-icon">👥</div><div><div className="vms-stat-label">Staff / Faculty</div><div className="vms-stat-value">{vehicleStats.staff}</div></div></div><div className="vms-stat-note">Staff-owned vehicles</div></div>
        </section>

        <div className="vms-grid">
          <section className="vms-card vms-form-card">
            <div className="vms-card-head"><h3>{editingId ? "Edit Vehicle" : "Register Vehicle"}</h3><span>{editingId ? "Update record" : "New record"}</span></div>
            <form className="vms-form" onSubmit={handleSubmit}>
              {editingId && <div className="vms-editing">✎ Editing an existing vehicle record</div>}
              <div className="vms-field"><label>OWNER NAME</label><input name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Enter owner name" required /></div>
              <div className="vms-field"><label>VEHICLE NUMBER</label><input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="e.g. BR01AB1234" required /></div>
              <div className="vms-form-row">
                <div className="vms-field"><label>VEHICLE TYPE</label><select name="vehicleType" value={formData.vehicleType} onChange={handleChange}><option>Car</option><option>Bike</option><option>Scooter</option><option>Bus</option><option>Other</option></select></div>
                <div className="vms-field"><label>PERSON TYPE</label><select name="personType" value={formData.personType} onChange={handleChange}><option>Student</option><option>Staff</option><option>Faculty</option><option>Visitor</option><option>Other</option></select></div>
              </div>
              <div className="vms-field"><label>CONTACT NUMBER</label><input name="contact" value={formData.contact} onChange={handleChange} placeholder="Enter contact number" /></div>
              <div className="vms-actions">
                <button className="vms-primary" type="submit" disabled={loading}>{loading ? "Saving..." : editingId ? "Update Vehicle" : "Register Vehicle"}</button>
                {editingId && <button className="vms-secondary" type="button" onClick={resetForm}>Cancel</button>}
              </div>
            </form>
          </section>

          <section className="vms-card vms-list">
            <div className="vms-card-head"><div><h3>Registered Vehicles</h3><span>Authorized campus vehicle records</span></div><div className="vms-count">{filteredVehicles.length} shown</div></div>
            <div className="vms-list-toolbar">
              <input className="vms-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search owner, vehicle number, type, person..." />
            </div>
            <div className="vms-table-wrap">
              {loadingVehicles ? (
                <div className="vms-empty"><div className="vms-empty-icon">⏳</div><strong>Loading vehicles...</strong>Please wait while the registry is refreshed.</div>
              ) : filteredVehicles.length === 0 ? (
                <div className="vms-empty"><div className="vms-empty-icon">🚗</div><strong>No vehicles found</strong>{searchTerm ? "Try a different search." : "Register the first authorized campus vehicle."}</div>
              ) : (
                <table className="vms-table">
                  <thead><tr><th>Owner</th><th>Vehicle No.</th><th>Type</th><th>Person</th><th>Contact</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle._id}>
                        <td><span className="vms-owner">{vehicle.ownerName || "—"}</span></td>
                        <td><span className="vms-number">{vehicle.vehicleNumber || "—"}</span></td>
                        <td><span className="vms-pill">{vehicle.vehicleType || "Other"}</span></td>
                        <td><span className="vms-pill person">{vehicle.personType || "Other"}</span></td>
                        <td><span className="vms-muted">{vehicle.contact || "—"}</span></td>
                        <td className="vms-actions-cell"><button className="vms-mini-btn edit" onClick={() => handleEdit(vehicle)}>✎ Edit</button><button className="vms-mini-btn delete" onClick={() => handleDelete(vehicle._id)}>🗑 Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default VehicleRegistration;
