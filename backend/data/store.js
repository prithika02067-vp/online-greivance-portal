const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const state = {
  initialized: false,
  categories: [],
  departments: [],
  users: [],
  grievances: [],
  comments: [],
  feedbacks: []
};

function makeId(prefix = 'id') {
  return `${prefix}-${randomUUID()}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return {
    ...rest,
    department: rest.department && typeof rest.department === 'object' ? rest.department : rest.department ? state.departments.find((item) => item._id === rest.department) || null : null
  };
}

function resolvePopulated(item) {
  if (!item) return null;
  const safe = { ...item };
  safe.category = safe.category ? state.categories.find((entry) => entry._id === safe.category) || safe.category : null;
  safe.department = safe.department ? state.departments.find((entry) => entry._id === safe.department) || safe.department : null;
  if (safe.submittedBy) {
    const submitted = state.users.find((user) => user._id === safe.submittedBy);
    safe.submittedBy = submitted ? sanitizeUser(submitted) : safe.submittedBy;
  }
  if (safe.assignedTo) {
    const assigned = state.users.find((user) => user._id === safe.assignedTo);
    safe.assignedTo = assigned ? sanitizeUser(assigned) : safe.assignedTo;
  }
  return safe;
}

function ensureSeeded() {
  if (state.initialized) return;

  state.departments = [
    { _id: 'dept-works', name: 'Public Works' },
    { _id: 'dept-health', name: 'Health Services' },
    { _id: 'dept-education', name: 'Education' },
    { _id: 'dept-transport', name: 'Transport' }
  ];

  state.categories = [
    { _id: 'cat-roads', name: 'Roads & Streets' },
    { _id: 'cat-water', name: 'Water Supply' },
    { _id: 'cat-safety', name: 'Public Safety' },
    { _id: 'cat-waste', name: 'Waste Management' }
  ];

  const adminPassword = bcrypt.hashSync('admin123', 10);
  const officerPassword = bcrypt.hashSync('officer123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  state.users = [
    { _id: 'user-admin', name: 'System Admin', email: 'admin@civicdesk.com', password: adminPassword, role: 'admin', department: null },
    { _id: 'user-officer', name: 'Transport Officer', email: 'officer@civicdesk.com', password: officerPassword, role: 'officer', department: 'dept-transport' },
    { _id: 'user-citizen', name: 'Citizen User', email: 'user@civicdesk.com', password: userPassword, role: 'user', department: null }
  ];

  state.grievances = [
    {
      _id: 'grievance-1',
      title: 'Streetlight outage near Main Avenue',
      description: 'Several streetlights are not working near the civic center and bus stand, creating safety concerns after sunset.',
      category: 'cat-safety',
      department: 'dept-works',
      priority: 'High',
      status: 'In Progress',
      submittedBy: 'user-citizen',
      assignedTo: 'user-officer',
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      statusHistory: [
        { status: 'Pending', changedAt: new Date(Date.now() - 3 * 86400000).toISOString(), changedBy: 'user-citizen', remark: 'Submitted by citizen' },
        { status: 'In Progress', changedAt: new Date(Date.now() - 2 * 86400000).toISOString(), changedBy: 'user-officer', remark: 'Assigned to Public Works' }
      ]
    }
  ];

  state.comments = [
    {
      _id: 'comment-1',
      grievanceId: 'grievance-1',
      userId: 'user-officer',
      message: 'We have dispatched a maintenance crew for inspection.',
      createdAt: new Date().toISOString()
    }
  ];

  state.feedbacks = [];
  state.initialized = true;
}

function getDepartmentById(id) {
  return state.departments.find((entry) => entry._id === id) || null;
}

function getCategoryById(id) {
  return state.categories.find((entry) => entry._id === id) || null;
}

function getUserById(id) {
  return state.users.find((entry) => entry._id === id) || null;
}

function getUsersPublic() {
  return state.users.map((user) => sanitizeUser(user));
}

function listDepartments() {
  return [...state.departments].sort((a, b) => a.name.localeCompare(b.name));
}

function listCategories() {
  return [...state.categories].sort((a, b) => a.name.localeCompare(b.name));
}

function listUsers() {
  return state.users.map((user) => sanitizeUser(user));
}

function findUserByEmail(email) {
  return state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserById(id) {
  return getUserById(id) ? sanitizeUser(getUserById(id)) : null;
}

function createUser({ name, email, password, role = 'user', department = null }) {
  const existing = findUserByEmail(email);
  if (existing) return null;
  const user = {
    _id: makeId('user'),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role,
    department
  };
  state.users.push(user);
  return sanitizeUser(user);
}

function createDepartment(name) {
  const department = { _id: makeId('dept'), name };
  state.departments.push(department);
  return department;
}

function createCategory(name) {
  const category = { _id: makeId('cat'), name };
  state.categories.push(category);
  return category;
}

function listGrievancesByUser(userId) {
  return state.grievances.filter((item) => item.submittedBy === userId).map((item) => resolvePopulated(item));
}

function listGrievancesForRole(user) {
  const items = state.grievances.filter((item) => {
    if (user.role === 'admin') return true;
    if (user.role === 'officer') return item.department === user.department;
    return false;
  });
  return items.map((item) => resolvePopulated(item));
}

function listAllGrievances() {
  return state.grievances.map((item) => resolvePopulated(item));
}

function findGrievanceById(id) {
  const item = state.grievances.find((entry) => entry._id === id);
  return item ? resolvePopulated(item) : null;
}

function createGrievance({ title, description, category, department, priority = 'Medium', submittedBy, attachments = [] }) {
  const newItem = {
    _id: makeId('grievance'),
    title,
    description,
    category,
    department,
    priority,
    status: 'Pending',
    submittedBy,
    assignedTo: null,
    attachments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    statusHistory: [{ status: 'Pending', changedAt: new Date().toISOString(), changedBy: submittedBy, remark: 'Submitted by citizen' }]
  };
  state.grievances.unshift(newItem);
  return resolvePopulated(newItem);
}

function updateGrievance(id, patch) {
  const existing = state.grievances.find((item) => item._id === id);
  if (!existing) return null;
  Object.assign(existing, patch, { updatedAt: new Date().toISOString() });
  return resolvePopulated(existing);
}

function removeGrievance(id) {
  const index = state.grievances.findIndex((item) => item._id === id);
  if (index === -1) return false;
  state.grievances.splice(index, 1);
  state.comments = state.comments.filter((comment) => comment.grievanceId !== id);
  state.feedbacks = state.feedbacks.filter((feedback) => feedback.grievanceId !== id);
  return true;
}

function createComment({ grievanceId, userId, message }) {
  const comment = {
    _id: makeId('comment'),
    grievanceId,
    userId,
    message,
    createdAt: new Date().toISOString()
  };
  state.comments.push(comment);
  return comment;
}

function listCommentsByGrievance(grievanceId) {
  return state.comments.filter((comment) => comment.grievanceId === grievanceId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function createFeedback({ grievanceId, rating, comment }) {
  const feedback = {
    _id: makeId('feedback'),
    grievanceId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };
  state.feedbacks.push(feedback);
  return feedback;
}

function getAnalytics() {
  const byCategory = listCategories().map((category) => ({ name: category.name, count: state.grievances.filter((item) => item.category === category._id).length }));
  const byStatus = ['Pending', 'In Progress', 'Resolved', 'Rejected', 'Escalated'].map((status) => ({ name: status, count: state.grievances.filter((item) => item.status === status).length }));
  const timeline = Object.entries(state.grievances.reduce((acc, item) => {
    const key = new Date(item.createdAt).toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  const resolved = state.grievances.filter((item) => item.resolvedAt);
  const averageResolutionDays = resolved.length
    ? resolved.reduce((sum, item) => sum + ((new Date(item.resolvedAt) - new Date(item.createdAt)) / 86400000), 0) / resolved.length
    : 0;

  return {
    byCategory: byCategory.filter((item) => item.count > 0),
    byStatus: byStatus.filter((item) => item.count > 0),
    timeline,
    averageResolutionDays: Number(averageResolutionDays.toFixed(1))
  };
}

function exportCsv() {
  const header = 'Title,Category,Department,Priority,Status,Submitted By,Assigned To,Created At\n';
  const rows = listAllGrievances().map((item) => {
    const category = item.category?.name || '';
    const department = item.department?.name || '';
    const submittedBy = item.submittedBy?.email || '';
    const assignedTo = item.assignedTo?.email || '';
    return [item.title, category, department, item.priority, item.status, submittedBy, assignedTo, new Date(item.createdAt).toISOString()].map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',');
  }).join('\n');
  return header + rows;
}

ensureSeeded();

module.exports = {
  ensureSeeded,
  listDepartments,
  listCategories,
  findUserByEmail,
  findUserById,
  createUser,
  createDepartment,
  createCategory,
  listUsers,
  listGrievancesByUser,
  listGrievancesForRole,
  findGrievanceById,
  createGrievance,
  updateGrievance,
  removeGrievance,
  createComment,
  listCommentsByGrievance,
  createFeedback,
  getAnalytics,
  exportCsv,
  getDepartmentById,
  getCategoryById,
  getUserById,
  sanitizeUser,
  resolvePopulated,
  state
};
