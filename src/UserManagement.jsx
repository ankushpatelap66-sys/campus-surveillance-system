import { useEffect, useMemo, useState } from "react";


const CVRU_MODULE_STYLES = `
  .user-management-page{width:100%;max-width:1280px;margin:0 auto;padding:0 8px 40px;box-sizing:border-box;color:#123b6b}
  .user-management-hero{position:relative;min-height:220px;margin:0 0 22px;border-radius:18px;overflow:hidden;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:30px 34px;box-sizing:border-box;background-image:linear-gradient(90deg,rgba(7,43,82,.94) 0%,rgba(10,61,105,.82) 42%,rgba(10,61,105,.35) 72%,rgba(10,61,105,.18) 100%),url('/cvru-campus.png');background-size:cover;background-position:center;box-shadow:0 10px 28px rgba(10,47,90,.12)}
  .user-management-hero>div:first-child{position:relative;z-index:1;max-width:760px}
  .module-eyebrow{display:block;font-size:12px;font-weight:900;letter-spacing:1.5px;color:#4b8bd8;margin-bottom:8px;text-transform:uppercase}
  .user-management-hero .module-eyebrow{color:#bfe0ff}
  .user-management-hero h1{margin:0;color:#fff;font-size:38px;line-height:1.08;font-weight:900;letter-spacing:-.5px}
  .user-management-hero p{margin:10px 0 0;color:#e6f1fc;font-size:15px;line-height:1.55}
  .user-management-actions{position:relative;z-index:2;display:flex;gap:10px;align-items:center;flex-shrink:0}
  .module-primary-btn,.module-secondary-btn{border:0;border-radius:10px;padding:12px 17px;font-weight:800;font-size:14px;cursor:pointer;transition:.2s ease;white-space:nowrap}
  .module-primary-btn{background:#1976ed;color:#fff;box-shadow:0 6px 16px rgba(25,118,237,.24)}
  .module-primary-btn:hover{background:#1265d1;transform:translateY(-1px)}
  .module-secondary-btn{background:#fff;color:#0b4b86;border:1px solid #d4e3f3}
  .module-secondary-btn:hover{background:#f3f8ff}
  .module-primary-btn:disabled,.module-secondary-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
  .user-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:18px}
  .user-stat-card{background:#fff;border:1px solid #dbe7f4;border-radius:16px;padding:18px 20px;display:grid;grid-template-columns:48px 1fr;column-gap:14px;align-items:center;box-shadow:0 7px 22px rgba(13,56,96,.06);min-height:92px}
  .user-stat-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:900;grid-row:span 2;background:#edf5ff;color:#1769d3}
  .user-stat-icon.clock{background:#fff5df;color:#d98b00}.user-stat-icon.check{background:#e8f8f1;color:#0aa66a}.user-stat-icon.lock{background:#fff0f1;color:#e54855}
  .user-stat-card strong{font-size:28px;line-height:1;color:#123b6b}.user-stat-card>span{font-size:13px;color:#6d87a3;margin-top:5px}
  .module-notice{padding:12px 16px;border-radius:10px;margin:0 0 16px;font-size:14px;font-weight:700}.module-notice.success{background:#e9f8f1;color:#11754f;border:1px solid #bcebd5}.module-notice.error{background:#fff0f1;color:#b4232d;border:1px solid #ffd0d4}
  .user-form-card,.user-toolbar,.user-table-card{background:#fff;border:1px solid #dbe7f4;border-radius:16px;box-shadow:0 7px 22px rgba(13,56,96,.06);margin-bottom:18px}
  .user-form-card{padding:22px}.user-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.user-section-head h2,.user-toolbar h2{margin:0;color:#123b6b;font-size:23px}.user-section-head small{font-weight:500;color:#7187a0}.close-btn{width:34px;height:34px;border:1px solid #dbe7f4;background:#f8fbff;border-radius:9px;font-size:23px;color:#42627f;cursor:pointer}
  .user-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.user-form-grid label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:800;color:#355879}.user-form-grid input,.user-form-grid select,.user-filters input,.user-filters select{width:100%;box-sizing:border-box;border:1px solid #d5e2ef;border-radius:9px;background:#fbfdff;padding:11px 12px;color:#163e67;font:inherit;outline:none}.user-form-grid input:focus,.user-form-grid select:focus,.user-filters input:focus,.user-filters select:focus{border-color:#4b93ea;box-shadow:0 0 0 3px rgba(42,125,232,.1)}
  .user-form-buttons{grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;padding-top:4px}
  .user-toolbar{padding:20px 22px;display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.user-toolbar p{margin:5px 0 0;color:#7890aa;font-size:13px}.user-filters{display:grid;grid-template-columns:minmax(230px,1fr) 150px 170px;gap:9px;min-width:570px}
  .user-table-card{overflow:hidden}.user-table-meta{padding:14px 18px;border-bottom:1px solid #e5edf6;color:#7187a0;font-size:13px}.user-table-meta strong{color:#174675}.responsive-table{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:820px}th{background:#f5f9fd;color:#68809a;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:12px 16px}td{padding:14px 16px;border-top:1px solid #edf2f7;color:#244c72;font-size:13px;vertical-align:middle}.user-cell{display:flex;align-items:center;gap:11px}.user-avatar{width:38px;height:38px;border-radius:50%;background:#e8f2ff;color:#146bd3;display:flex;align-items:center;justify-content:center;font-weight:900}.user-cell strong,.user-cell span{display:block}.user-cell strong{color:#123b6b;font-size:14px}.user-cell span{color:#7a90a7;font-size:12px;margin-top:3px}.role-pill,.status-pill{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:800}.role-pill{background:#eef5fc;color:#3f6689}.status-pill.pending{background:#fff4dc;color:#b16b00}.status-pill.approved{background:#e6f8f0;color:#08794e}.status-pill.rejected{background:#fff0f1;color:#b52d37}.date-cell{white-space:nowrap;color:#6d849d}.table-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.action-btn{border:1px solid transparent;border-radius:7px;padding:7px 10px;background:#f2f7fc;color:#24547d;font-size:12px;font-weight:800;cursor:pointer}.action-btn.edit{background:#edf5ff;color:#1769d3}.action-btn.approve{background:#e9f8f1;color:#08794e}.action-btn.reject{background:#fff5e8;color:#a86700}.action-btn.delete{background:#fff0f1;color:#b52d37}.action-btn:disabled{opacity:.55;cursor:not-allowed}.protected-label{font-size:11px;font-weight:800;color:#7a90a7}.module-empty{padding:44px 20px;text-align:center;color:#748aa1}.module-empty strong,.module-empty span{display:block}.module-empty span{font-size:13px;margin-top:5px}
  @media(max-width:1050px){.user-stats-grid{grid-template-columns:repeat(2,1fr)}.user-toolbar{align-items:stretch;flex-direction:column}.user-filters{min-width:0;grid-template-columns:1fr 1fr 1fr}}
  @media(max-width:720px){.user-management-hero{min-height:250px;padding:24px;align-items:flex-start;flex-direction:column;justify-content:flex-end}.user-management-hero h1{font-size:30px}.user-management-actions{width:100%}.user-management-actions button{flex:1}.user-stats-grid{grid-template-columns:1fr}.user-form-grid{grid-template-columns:1fr}.user-filters{grid-template-columns:1fr}.user-toolbar{padding:18px}}
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

const ROLES = [["admin","Administrator"],["security","Security Guard"],["staff","Staff / Faculty"],["student","Student"]];
const STATUS = { pending:"Pending Approval", approved:"Approved", rejected:"Access Removed" };

function UserManagement() {
  const API_BASE = `${import.meta.env.VITE_API_URL}/auth`;
  const [users,setUsers]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [query,setQuery]=useState(""),[roleFilter,setRoleFilter]=useState("all"),[statusFilter,setStatusFilter]=useState("all");
  const [showForm,setShowForm]=useState(false),[editing,setEditing]=useState(null),[form,setForm]=useState({name:"",email:"",password:"",role:"student"});
  const auth=()=>({Authorization:`Bearer ${localStorage.getItem("token")}`});

  const fetchUsers=async()=>{setLoading(true);setError("");try{const r=await fetch(`${API_BASE}/users`,{headers:auth()});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Failed to fetch users");setUsers(Array.isArray(d.users)?d.users:[])}catch(e){setError(e.message||"Users load nahi ho pa rahe.")}finally{setLoading(false)}};
  useEffect(()=>{fetchUsers()},[]);

  const stats=useMemo(()=>({total:users.length,pending:users.filter(u=>u.status==="pending").length,approved:users.filter(u=>u.status==="approved").length,removed:users.filter(u=>u.status==="rejected").length}),[users]);
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return users.filter(u=>(!q||[u.name,u.email,u.role].some(v=>String(v||"").toLowerCase().includes(q)))&&(roleFilter==="all"||u.role===roleFilter)&&(statusFilter==="all"||u.status===statusFilter))},[users,query,roleFilter,statusFilter]);
  const roleLabel=r=>ROLES.find(x=>x[0]===r)?.[1]||r||"Unknown";
  const date=v=>v?new Date(v).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"-";

  const openCreate=()=>{setEditing(null);setForm({name:"",email:"",password:"",role:"student"});setShowForm(true);setError("");setMessage("")};
  const openEdit=u=>{setEditing(u);setForm({name:u.name||"",email:u.email||"",password:"",role:u.role||"student"});setShowForm(true);setError("");setMessage("")};
  const closeForm=()=>{setShowForm(false);setEditing(null)};

  const saveUser=async e=>{e.preventDefault();setBusy("save");setError("");setMessage("");try{const p={name:form.name.trim(),email:form.email.trim(),role:form.role};if(!editing||form.password)p.password=form.password;if(!p.name||!p.email||(!editing&&!form.password))throw new Error("Name, email and password are required.");if(!editing&&form.password.length<6)throw new Error("Password must contain at least 6 characters.");const r=await fetch(`${API_BASE}/users${editing?`/${editing._id}`:""}`,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json",...auth()},body:JSON.stringify(p)});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Unable to save user");setMessage(editing?"User updated successfully.":"User created successfully.");closeForm();await fetchUsers()}catch(e){setError(e.message||"Unable to save user.")}finally{setBusy("")}};

  const statusAction=async(u,action,confirmText,success)=>{if(!window.confirm(confirmText))return;setBusy(`${action}-${u._id}`);setError("");setMessage("");try{const r=await fetch(`${API_BASE}/users/${u._id}/${action}`,{method:"PUT",headers:auth()});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Action failed");setMessage(success);await fetchUsers()}catch(e){setError(e.message||"Action failed.")}finally{setBusy("")}};
  const remove=u=>statusAction(u,"reject","Remove this user's access? They will not be able to log in.","User access removed successfully.");
  const approve=u=>statusAction(u,"approve","Approve / restore this user's access?","User access approved successfully.");
  const removeUser=async u=>{if(!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`))return;setBusy(`delete-${u._id}`);setError("");setMessage("");try{const r=await fetch(`${API_BASE}/users/${u._id}`,{method:"DELETE",headers:auth()});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Delete failed");setMessage("User permanently deleted.");await fetchUsers()}catch(e){setError(e.message||"User delete nahi ho paya.")}finally{setBusy("")}};

  return <div className="user-management-page">
    <style>{CVRU_MODULE_STYLES}</style>
    <div className="user-management-hero"><div><span className="module-eyebrow">CAMPUS USER ADMINISTRATION</span><h1>User Management</h1><p>Manage campus accounts, approval requests, roles and access from one secure control panel.</p></div><div className="user-management-actions"><button className="module-secondary-btn" onClick={fetchUsers} disabled={loading}>↻ Refresh</button><button className="module-primary-btn" onClick={openCreate}>＋ Add User</button></div></div>
    <div className="user-stats-grid">{[["users",stats.total,"Total Users"],["clock",stats.pending,"Pending Approval"],["check",stats.approved,"Approved"],["lock",stats.removed,"Access Removed"]].map(([i,v,l])=><div className="user-stat-card" key={l}><div className={`user-stat-icon ${i}`}>{i==="users"?"♟":i==="clock"?"◷":i==="check"?"✓":"⌁"}</div><strong>{v}</strong><span>{l}</span></div>)}</div>
    {message&&<div className="module-notice success">✓ {message}</div>}{error&&<div className="module-notice error">! {error}</div>}
    {showForm&&<div className="user-form-card"><div className="user-section-head"><div><span className="module-eyebrow">ACCOUNT SETUP</span><h2>{editing?"Edit User":"Create User"}</h2></div><button className="close-btn" onClick={closeForm}>×</button></div><form onSubmit={saveUser} className="user-form-grid"><label>Full Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Email Address<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Password {editing&&<small>(leave blank to keep current)</small>}<input type="password" minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required={!editing}/></label><div className="user-form-buttons"><button type="button" className="module-secondary-btn" onClick={closeForm}>Cancel</button><button className="module-primary-btn" disabled={busy==="save"}>{busy==="save"?"Saving...":editing?"Save Changes":"Create User"}</button></div></form></div>}
    <div className="user-toolbar"><div><span className="module-eyebrow">USER DIRECTORY</span><h2>All Users</h2><p>Search and manage registered campus accounts.</p></div><div className="user-filters"><input placeholder="Search name, email or role..." value={query} onChange={e=>setQuery(e.target.value)}/><select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="all">All Roles</option>{ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Access Removed</option></select></div></div>
    <div className="user-table-card"><div className="user-table-meta">Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users</div>{loading?<div className="module-empty">Loading users...</div>:filtered.length===0?<div className="module-empty"><strong>No matching users</strong><span>Try changing the search or filters.</span></div>:<div className="responsive-table"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead><tbody>{filtered.map(u=><tr key={u._id}><td><div className="user-cell"><div className="user-avatar">{(u.name||"U").charAt(0).toUpperCase()}</div><div><strong>{u.name}</strong><span>{u.email}</span></div></div></td><td><span className="role-pill">{roleLabel(u.role)}</span></td><td><span className={`status-pill ${u.status}`}>{STATUS[u.status]||u.status}</span></td><td className="date-cell">{date(u.createdAt)}</td><td><div className="table-actions"><button className="action-btn edit" onClick={()=>openEdit(u)}>Edit</button>{u.status==="pending"&&<button className="action-btn approve" disabled={busy===`approve-${u._id}`} onClick={()=>approve(u)}>Approve</button>}{u.status==="rejected"&&<button className="action-btn approve" disabled={busy===`approve-${u._id}`} onClick={()=>approve(u)}>Restore</button>}{u.status==="approved"&&u.role!=="admin"&&<button className="action-btn reject" disabled={busy===`reject-${u._id}`} onClick={()=>remove(u)}>Remove</button>}{u.role!=="admin"&&<button className="action-btn delete" disabled={busy===`delete-${u._id}`} onClick={()=>removeUser(u)}>Delete</button>}{u.role==="admin"&&<span className="protected-label">Admin protected</span>}</div></td></tr>)}</tbody></table></div>}</div>
  </div>;
}
export default UserManagement;