const router = require('express').Router();
const { protect, allow } = require('../middleware/auth');
const {
  listDepartments,
  listCategories,
  listUsers,
  createDepartment,
  createCategory,
  getAnalytics,
  exportCsv,
  state,
  findUserById,
  sanitizeUser
} = require('../data/store');

router.use(protect, allow('admin'));

const handleCrud = (path, itemsFn, createFn) => {
  router.get(`/${path}`, async (req, res) => res.json({ items: itemsFn() }));
  router.post(`/${path}`, async (req, res) => {
    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ message: 'Name is required' });
    res.status(201).json({ item: createFn(name) });
  });
};

handleCrud('departments', listDepartments, createDepartment);
handleCrud('categories', listCategories, createCategory);

router.get('/users', async (req, res) => res.json({ users: listUsers() }));
router.patch('/users/:id', async (req, res) => {
  const user = state.users.find((entry) => entry._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = req.body.role || user.role;
  user.department = req.body.department || user.department || null;
  res.json({ user: sanitizeUser(user) });
});

router.get('/analytics', async (req, res) => {
  res.json(getAnalytics());
});

router.get('/export', async (req, res) => {
  res.header('Content-Type', 'text/csv');
  res.attachment('grievances.csv');
  res.send(exportCsv());
});

module.exports = router;
