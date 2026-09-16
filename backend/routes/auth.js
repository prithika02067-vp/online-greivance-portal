const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById, sanitizeUser } = require('../data/store');
const { protect } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, valid email, and 6+ character password are required' });
    if (findUserByEmail(email)) return res.status(409).json({ message: 'Email already registered' });
    const user = createUser({ name, email, password, role: 'user' });
    if (!user) return res.status(409).json({ message: 'Email already registered' });
    res.status(201).json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email, role: 'user' } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: sign(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role === 'citizen' ? 'user' : user.role, department: user.department } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/me', protect, async (req, res) => res.json({ user: req.user }));
module.exports = router;
