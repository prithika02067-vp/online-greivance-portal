import { useEffect, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, BarChart3, CheckCircle2, FileText, LogOut, MessageSquare, Plus, Search, ShieldCheck, UserRound } from 'lucide-react'
import NewGrievanceForm from './NewGrievanceForm'
import AdminManagement from './AdminManagement'
import './index.css'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
const statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected', 'Escalated']
const statusClass = (status) => `status status-${status.toLowerCase().replaceAll(' ', '-')}`

function normalizeUser(user) {
  if (!user) return null
  return { ...user, role: user.role === 'citizen' ? 'user' : user.role }
}

function useAuth() {
  const [auth, setAuth] = useState(() => {
    try {
      return normalizeUser(JSON.parse(localStorage.getItem('user') || 'null'))
    } catch {
      return null
    }
  })
  const login = (payload) => {
    const user = normalizeUser(payload.user)
    localStorage.setItem('token', payload.token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuth(user)
  }
  const logout = () => { localStorage.clear(); setAuth(null) }
  return { auth, login, logout }
}

function App() {
  const auth = useAuth()
  return <BrowserRouter><Routes>
    <Route path="/" element={<Landing auth={auth} />} />
    <Route path="/login" element={<AuthPage mode="login" onAuth={auth.login} />} />
    <Route path="/register" element={<AuthPage mode="register" onAuth={auth.login} />} />
    <Route path="/app/*" element={<Protected auth={auth} />} />
  </Routes></BrowserRouter>
}

function Landing({ auth }) {
  return <div className="landing"><header className="topbar"><Link to="/" className="brand"><ShieldCheck size={23} /> CivicDesk</Link><nav>{auth.auth ? <Link className="button button-dark" to="/app">Open dashboard <ArrowRight size={16} /></Link> : <><Link to="/login">Sign in</Link><Link className="button button-dark" to="/register">Create account <ArrowRight size={16} /></Link></>}</nav></header><main className="hero"><div className="eyebrow"><span className="eyebrow-dot" /> PUBLIC SERVICE, MADE VISIBLE</div><h1>Turn a concern<br /><em>into progress.</em></h1><p className="hero-copy">A clear channel for reporting civic issues, tracking every handoff, and holding services accountable.</p><div className="hero-actions"><Link className="button button-accent" to={auth.auth ? '/app' : '/register'}>Report an issue <ArrowRight size={17} /></Link><span className="hero-note"><CheckCircle2 size={16} /> Every update, in one place</span></div><div className="hero-board"><div className="board-top"><span>LIVE SERVICE BOARD</span><span className="pulse">● accepting reports</span></div><div className="board-grid"><div><strong>01</strong><span>Submit</span></div><div><strong>02</strong><span>Assigned</span></div><div><strong>03</strong><span>Resolved</span></div><div className="board-stat"><b>7 days</b><span>average response window</span></div></div></div></main></div>
}

function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate(); const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { const { data } = await api.post(`/auth/${mode === 'login' ? 'login' : 'register'}`, form); onAuth(data); navigate('/app') } catch (err) { setError(err.response?.data?.message || (err.request ? 'Cannot reach the server. Start the backend, then try again.' : 'Unable to continue')) } finally { setLoading(false) } }
  return <div className="auth-page"><Link to="/" className="brand"><ShieldCheck size={23} /> CivicDesk</Link><form className="auth-card" onSubmit={submit}><div className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE DESK'}</div><h1>{mode === 'login' ? 'Sign in to your desk' : 'Create your citizen account'}</h1><p className="muted">{mode === 'login' ? 'Track your reports and stay in the loop.' : 'A few details, then your first report can begin.'}</p>{mode === 'register' && <label>Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>}<label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required minLength="6" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>{error && <div className="error">{error}</div>}<button className="button button-accent full" disabled={loading}>{loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button><p className="switch">{mode === 'login' ? <>New here? <Link to="/register">Create an account</Link></> : <>Already registered? <Link to="/login">Sign in</Link></>}</p></form></div>
}

function Protected({ auth }) {
  if (!auth.auth) return <Navigate to="/login" replace />
  return <Shell auth={auth}><Routes><Route index element={auth.auth.role === 'admin' ? <AdminDashboard /> : auth.auth.role === 'officer' ? <OfficerDashboard /> : <UserDashboard />} /><Route path="new" element={<NewGrievanceForm />} /><Route path="manage" element={<AdminManagement />} /><Route path="grievances/:id" element={<GrievanceDetail />} /></Routes></Shell>
}

function Shell({ auth, children }) {
  const role = auth.auth.role; return <div className="app-shell"><aside><Link to="/" className="brand"><ShieldCheck size={23} /> CivicDesk</Link><div className="side-label">WORKSPACE</div><Link to="/app" className="side-link active"><BarChart3 size={17} /> Overview</Link>{role === 'user' && <Link to="/app/new" className="side-link"><Plus size={17} /> New grievance</Link>}<div className="side-label">ACCOUNT</div><div className="profile"><div className="avatar">{auth.auth.name?.[0]}</div><div><b>{auth.auth.name}</b><small>{role}</small></div></div><button className="side-link logout" onClick={auth.logout}><LogOut size={17} /> Sign out</button></aside><main className="app-main"><header className="mobile-header"><Link to="/" className="brand"><ShieldCheck size={21} /> CivicDesk</Link><button onClick={auth.logout}><LogOut size={17} /></button></header>{children}</main></div>
}

function UserDashboard() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/grievances/my')
        setItems(response.data.grievances)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])
  return <PageHeader eyebrow="MY CIVIC DESK" title="Your grievances" action={<Link className="button button-accent" to="/app/new"><Plus size={17} /> New grievance</Link>}><div className="summary-row"><Metric label="Total reports" value={items.length} icon={<FileText />} /><Metric label="In progress" value={items.filter(i => i.status === 'In Progress').length} icon={<MessageSquare />} /><Metric label="Resolved" value={items.filter(i => i.status === 'Resolved').length} icon={<CheckCircle2 />} /></div><section className="section-block"><div className="section-heading"><div><h2>Recent submissions</h2><p className="muted">A complete trail of everything you have raised.</p></div></div>{loading ? <Loading /> : items.length ? <div className="grievance-list">{items.map(item => <GrievanceRow key={item._id} item={item} />)}</div> : <Empty title="Nothing reported yet" text="When you spot something that needs attention, start here." action={<Link className="button button-dark" to="/app/new">Submit first grievance</Link>} />}</section></PageHeader>
}

function OfficerDashboard() { return <StaffDashboard officer /> }
function AdminDashboard() { return <StaffDashboard admin /> }
function StaffDashboard({ officer = false, admin = false }) {
  const [data, setData] = useState({ grievances: [] }); const [analytics, setAnalytics] = useState(null); const [query, setQuery] = useState('')
  const load = () => api.get(`/grievances?search=${encodeURIComponent(query)}`).then(r => setData(r.data))
  useEffect(() => { load(); if (admin) api.get('/admin/analytics').then(r => setAnalytics(r.data)) }, [admin])
  const changeStatus = async (id, status) => { await api.patch(`/grievances/${id}/status`, { status }); load() }
  return <PageHeader eyebrow={admin ? 'ADMIN CONTROL ROOM' : 'OFFICER QUEUE'} title={admin ? 'Service overview' : 'Your department queue'}><div className="summary-row"><Metric label="Open queue" value={data.grievances.filter(i => !['Resolved', 'Rejected'].includes(i.status)).length} icon={<FileText />} /><Metric label="Escalated" value={data.grievances.filter(i => i.status === 'Escalated').length} icon={<ShieldCheck />} /><Metric label="Resolved" value={data.grievances.filter(i => i.status === 'Resolved').length} icon={<CheckCircle2 />} /></div>{admin && analytics && <div className="charts"><Chart title="Reports by category"><ResponsiveContainer><BarChart data={analytics.byCategory}><CartesianGrid vertical={false} stroke="#e9e4db" /><XAxis dataKey="name" hide /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#e06b42" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="Status distribution"><ResponsiveContainer><PieChart><Pie data={analytics.byStatus} dataKey="count" nameKey="name" innerRadius={48} outerRadius={72}>{analytics.byStatus.map((item, index) => <Cell key={item.name} fill={['#e5b64c', '#4e83c6', '#58a57a', '#c65c5c', '#e47b37'][index % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Chart><Chart title="Submissions over time"><ResponsiveContainer><LineChart data={analytics.timeline}><CartesianGrid vertical={false} stroke="#e9e4db" /><XAxis dataKey="date" hide /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#255b55" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></Chart></div>}{admin && <div className="admin-tools"><span>Manage departments, categories, users</span><a href={`${api.defaults.baseURL}/admin/export`} target="_blank" rel="noreferrer" className="button button-light">Export CSV</a></div>}<section className="section-block"><div className="section-heading"><div><h2>All grievances</h2><p className="muted">Search, inspect, and move each case forward.</p></div><div className="search"><Search size={16} /><input placeholder="Search reports..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} /></div></div><div className="table-wrap"><table><thead><tr><th>Grievance</th><th>Department</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.grievances.map(item => <tr key={item._id}><td><Link to={`/app/grievances/${item._id}`} className="table-title">{item.title}</Link><small>{new Date(item.createdAt).toLocaleDateString()}</small></td><td>{item.department?.name || '—'}</td><td><b className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</b></td><td><span className={statusClass(item.status)}>{item.status}</span></td><td>{officer || admin ? <select value={item.status} onChange={e => changeStatus(item._id, e.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select> : '—'}</td></tr>)}</tbody></table></div></section></PageHeader>
}

function NewGrievance() { const [form, setForm] = useState({ title: '', description: '', category: '', department: '', priority: 'Medium' }); const [categories, setCategories] = useState([]); const [departments, setDepartments] = useState([]); const [message, setMessage] = useState(''); const navigate = useNavigate(); useEffect(() => { api.get('/meta').then(({ data }) => { setCategories(data.categories); setDepartments(data.departments) }) }, []); const submit = async e => { e.preventDefault(); try { await api.post('/grievances', form); navigate('/app') } catch (err) { setMessage(err.response?.data?.message || 'Unable to submit') } }; return <PageHeader eyebrow="NEW REPORT" title="Make the issue visible"><form className="form-card" onSubmit={submit}><p className="muted">Give the right team enough context to act without another round of questions.</p><label>Title<input required maxLength="140" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs attention?" /></label><label>Description<textarea required rows="6" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Tell us what happened, where, and when." /></label><div className="form-grid"><label>Category<select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select a category</option>{categories.map(x => <option key={x._id} value={x._id}>{x.name}</option>)}</select></label><label>Department<select required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}><option value="">Select a department</option>{departments.map(x => <option key={x._id} value={x._id}>{x.name}</option>)}</select></label></div><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>{message && <div className="error">{message}</div>}<button className="button button-accent">Submit grievance <ArrowRight size={16} /></button></form></PageHeader> }

function GrievanceDetail() { const { id } = useParams(); const [item, setItem] = useState(null); const [comments, setComments] = useState([]); const [message, setMessage] = useState('');
  const load = async () => {
    const [grievanceResponse, commentsResponse] = await Promise.all([
      api.get(`/grievances/${id}`),
      api.get(`/grievances/${id}/comments`)
    ])
    setItem(grievanceResponse.data.grievance)
    setComments(commentsResponse.data.comments)
  }
  useEffect(() => { void load() }, [id])
  const comment = async e => { e.preventDefault(); if (!message.trim()) return; await api.post(`/grievances/${id}/comments`, { message }); setMessage(''); await load() }; if (!item) return <Loading />; return <PageHeader eyebrow="GRIEVANCE DETAIL" title={item.title}><div className="detail-grid"><article className="detail-card"><div className="detail-meta"><span className={statusClass(item.status)}>{item.status}</span><span>{item.priority} priority</span><span>{new Date(item.createdAt).toLocaleDateString()}</span></div><p className="detail-description">{item.description}</p><h3>Status history</h3><div className="timeline">{item.statusHistory?.map((event, index) => <div className="timeline-item" key={`${event.status}-${index}`}><span className="timeline-dot" /><div><b>{event.status}</b><small>{new Date(event.changedAt).toLocaleString()} {event.remark && `· ${event.remark}`}</small></div></div>)}</div></article><aside className="detail-card"><h3>Conversation</h3><div className="comments">{comments.map(comment => <div className="comment" key={comment._id}><div className="avatar small">{comment.userId?.name?.[0]}</div><div><b>{comment.userId?.name}</b><p>{comment.message}</p></div></div>)}</div><form onSubmit={comment} className="comment-form"><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a note..." /><button className="button button-dark">Send</button></form></aside></div></PageHeader> }

function PageHeader({ eyebrow, title, action, children }) { return <div className="page"><div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>{action}</div>{children}</div> }
function Metric({ label, value, icon }) { return <div className="metric"><div className="metric-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div> }
function GrievanceRow({ item }) { return <Link className="grievance-row" to={`/app/grievances/${item._id}`}><div className="row-icon"><FileText size={19} /></div><div className="row-main"><strong>{item.title}</strong><span>{item.category?.name || 'General'} · {new Date(item.createdAt).toLocaleDateString()}</span></div><span className={statusClass(item.status)}>{item.status}</span><ArrowRight size={17} /></Link> }
function Chart({ title, children }) { return <div className="chart-card"><h3>{title}</h3><div className="chart-box">{children}</div></div> }
function Loading() { return <div className="loading">Loading your desk...</div> }
function Empty({ title, text, action }) { return <div className="empty"><FileText size={27} /><h3>{title}</h3><p>{text}</p>{action}</div> }
export default App
