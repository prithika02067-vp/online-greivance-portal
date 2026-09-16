import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Paperclip } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })

export default function NewGrievanceForm() {
  const [form, setForm] = useState({ title: '', description: '', category: '', department: '', priority: 'Medium' })
  const [file, setFile] = useState(null); const [categories, setCategories] = useState([]); const [departments, setDepartments] = useState([]); const [error, setError] = useState(''); const navigate = useNavigate()
  useEffect(() => { api.get('/meta').then(({ data }) => { setCategories(data.categories); setDepartments(data.departments) }).catch(() => setError('Could not load departments and categories')) }, [])
  const update = (key, value) => setForm({ ...form, [key]: value })
  const submit = async (event) => { event.preventDefault(); setError(''); const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, value)); if (file) body.append('attachments', file); try { await api.post('/grievances', body); navigate('/app') } catch (err) { setError(err.response?.data?.message || 'Unable to submit') } }
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">NEW REPORT</div><h1>Make the issue visible</h1></div></div><form className="form-card" onSubmit={submit}><p className="muted">Give the right team enough context to act without another round of questions.</p><label>Title<input required maxLength="140" value={form.title} onChange={e => update('title', e.target.value)} placeholder="What needs attention?" /></label><label>Description<textarea required rows="6" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us what happened, where, and when." /></label><div className="form-grid"><label>Category<select required value={form.category} onChange={e => update('category', e.target.value)}><option value="">Select a category</option>{categories.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label>Department<select required value={form.department} onChange={e => update('department', e.target.value)}><option value="">Select a department</option>{departments.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label></div><label>Priority<select value={form.priority} onChange={e => update('priority', e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="file-field"><span><Paperclip size={15} /> Attachment <small>(optional, up to 5MB)</small></span><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></label>{error && <div className="error">{error}</div>}<button className="button button-accent">Submit grievance <ArrowRight size={16} /></button></form></div>
}
