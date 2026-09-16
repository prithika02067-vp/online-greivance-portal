import { useEffect, useState } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })

export default function AdminManagement() {
  const [departments, setDepartments] = useState([]); const [categories, setCategories] = useState([]); const [users, setUsers] = useState([]); const [name, setName] = useState('')
  const load = () => Promise.all([api.get('/admin/departments'), api.get('/admin/categories'), api.get('/admin/users')]).then(([d, c, u]) => { setDepartments(d.data.items); setCategories(c.data.items); setUsers(u.data.users) })
  useEffect(load, [])
  const add = async (path) => { if (!name.trim()) return; await api.post(`/admin/${path}`, { name: name.trim() }); setName(''); load() }
  const updateUser = async (id, event) => { await api.patch(`/admin/users/${id}`, { role: event.target.value }); load() }
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">ADMINISTRATION</div><h1>Manage the service desk</h1></div></div><div className="management-grid"><section className="section-block manage-card"><h2>Departments</h2><div className="manage-add"><input value={name} onChange={e => setName(e.target.value)} placeholder="New department" /><button className="button button-dark" onClick={() => add('departments')}>Add</button></div>{departments.map(item => <div className="manage-row" key={item._id}>{item.name}</div>)}</section><section className="section-block manage-card"><h2>Categories</h2><div className="manage-add"><input value={name} onChange={e => setName(e.target.value)} placeholder="New category" /><button className="button button-dark" onClick={() => add('categories')}>Add</button></div>{categories.map(item => <div className="manage-row" key={item._id}>{item.name}</div>)}</section><section className="section-block manage-card users-card"><h2>Users and roles</h2>{users.map(user => <div className="manage-row user-row" key={user._id}><span><b>{user.name}</b><small>{user.email}</small></span><select value={user.role} onChange={e => updateUser(user._id, e)}><option value="user">Citizen</option><option value="officer">Officer</option><option value="admin">Admin</option></select></div>)}</section></div></div>
}
