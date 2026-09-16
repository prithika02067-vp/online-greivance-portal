const router = require('express').Router();
const multer = require('multer');
const { protect, allow } = require('../middleware/auth');
const { notifyStatusChange } = require('../utils/notify');
const {
  findGrievanceById,
  listGrievancesByUser,
  listGrievancesForRole,
  createGrievance,
  createComment,
  listCommentsByGrievance,
  createFeedback,
  findUserById,
  getUserById,
  resolvePopulated,
  getAnalytics,
  state
} = require('../data/store');

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

const canView = (req, grievance) => {
  if (!grievance) return false;
  return req.user.role === 'admin' || grievance.submittedBy?._id === req.user._id || (req.user.role === 'officer' && grievance.department?._id === req.user.department);
};

router.post('/', protect, allow('user'), upload.array('attachments', 3), async (req, res) => {
  try {
    const { title, description, category, department, priority = 'Medium' } = req.body;
    if (!title || !description || !category || !department) return res.status(400).json({ message: 'Title, description, category, and department are required' });
    const grievance = createGrievance({
      title,
      description,
      category,
      department,
      priority,
      submittedBy: req.user._id,
      attachments: (req.files || []).map((file) => file.path)
    });
    res.status(201).json({ grievance });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/my', protect, allow('user'), async (req, res) => {
  res.json({ grievances: listGrievancesByUser(req.user._id) });
});

router.get('/', protect, allow('admin', 'officer'), async (req, res) => {
  const { search, status, category, from, to, page = 1, limit = 10 } = req.query;
  let items = listGrievancesForRole(req.user);

  if (status) items = items.filter((item) => item.status === status);
  if (category) items = items.filter((item) => item.category?._id === category || item.category === category);
  if (search) {
    const term = String(search).toLowerCase();
    items = items.filter((item) => item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term));
  }
  if (from || to) {
    items = items.filter((item) => {
      const date = new Date(item.createdAt);
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(`${to}T23:59:59`) : null;
      return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
    });
  }

  const pageNumber = Number(page) || 1;
  const pageLimit = Number(limit) || 10;
  const start = (pageNumber - 1) * pageLimit;
  const grievances = items.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(start, start + pageLimit);

  res.json({ grievances, total: items.length, page: pageNumber, pages: Math.max(1, Math.ceil(items.length / pageLimit)) });
});

router.get('/:id', protect, async (req, res) => {
  const grievance = findGrievanceById(req.params.id);
  if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
  if (!canView(req, grievance)) return res.status(403).json({ message: 'Access denied' });
  res.json({ grievance });
});

router.patch('/:id/status', protect, allow('officer', 'admin'), async (req, res) => {
  try {
    const { status, remark = '' } = req.body;
    if (!['Pending', 'In Progress', 'Resolved', 'Rejected', 'Escalated'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const grievance = findGrievanceById(req.params.id);
    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
    if (req.user.role === 'officer' && String(grievance.department?._id || grievance.department) !== String(req.user.department)) return res.status(403).json({ message: 'Department access denied' });

    const item = state.grievances.find((entry) => entry._id === req.params.id);
    item.status = status;
    item.resolvedAt = status === 'Resolved' ? new Date().toISOString() : item.resolvedAt;
    item.statusHistory.push({ status, changedAt: new Date().toISOString(), changedBy: req.user._id, remark });
    await notifyStatusChange({ ...item, submittedBy: getUserById(item.submittedBy) }, status);
    res.json({ grievance: findGrievanceById(item._id) });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.patch('/:id/assign', protect, allow('admin'), async (req, res) => {
  const { officerId } = req.body;
  const officer = getUserById(officerId);
  if (!officer || officer.role !== 'officer') return res.status(400).json({ message: 'Officer not found' });
  const grievance = state.grievances.find((entry) => entry._id === req.params.id);
  if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
  grievance.assignedTo = officer._id;
  grievance.department = officer.department;
  res.json({ grievance: findGrievanceById(grievance._id) });
});

router.post('/:id/comments', protect, async (req, res) => {
  const grievance = findGrievanceById(req.params.id);
  if (!grievance || !canView(req, grievance)) return res.status(403).json({ message: 'Access denied' });
  if (!req.body.message?.trim()) return res.status(400).json({ message: 'Comment is required' });
  const comment = createComment({ grievanceId: grievance._id, userId: req.user._id, message: req.body.message.trim() });
  res.status(201).json({ comment });
});

router.get('/:id/comments', protect, async (req, res) => {
  const grievance = findGrievanceById(req.params.id);
  if (!grievance || !canView(req, grievance)) return res.status(403).json({ message: 'Access denied' });
  res.json({ comments: listCommentsByGrievance(grievance._id).map((comment) => ({ ...comment, userId: findUserById(comment.userId) })) });
});

router.post('/:id/feedback', protect, allow('user'), async (req, res) => {
  const grievance = state.grievances.find((entry) => entry._id === req.params.id && entry.submittedBy === req.user._id && entry.status === 'Resolved');
  if (!grievance) return res.status(400).json({ message: 'Feedback is only available for your resolved grievances' });
  const feedback = createFeedback({ grievanceId: grievance._id, rating: req.body.rating, comment: req.body.comment });
  res.status(201).json({ feedback });
});

module.exports = router;
