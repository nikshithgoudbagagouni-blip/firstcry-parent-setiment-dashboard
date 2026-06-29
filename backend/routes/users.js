const express = require('express');
const crypto = require('crypto');
const { authenticate, requireRole } = require('../middleware/auth');
const { readStore, writeStore, publicUser, normalizeUser, generateId, hashPassword, isStrongPassword } = require('../services/userService');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

const clean = value => String(value || '').trim();
const audit = (user, action, actor = 'Administrator') => {
  user.activityLogs = [{ timestamp: new Date().toISOString(), action, actor }, ...(user.activityLogs || [])].slice(0, 50);
};

router.get('/stats', (_req, res) => {
  const users = readStore().users.filter(user => user.role !== 'admin');
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  res.json({
    totalParents: users.filter(user => user.role === 'parent').length,
    totalTeachers: users.filter(user => user.role === 'teacher').length,
    activeUsers: users.filter(user => user.status === 'active').length,
    disabledUsers: users.filter(user => user.status === 'disabled').length,
    newRegistrations: users.filter(user => new Date(user.createdAt).getTime() >= monthAgo).length
  });
});

router.get('/', (req, res) => {
  const data = readStore();
  const search = clean(req.query.search).toLowerCase();
  const role = clean(req.query.role);
  const status = clean(req.query.status);
  const assignedClass = clean(req.query.assignedClass);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 8));
  let users = data.users.filter(user => user.role !== 'admin');
  if (search) users = users.filter(user => [user.name, user.email, user.phone, user.assignedClass].some(field => String(field || '').toLowerCase().includes(search)));
  if (role && role !== 'all') users = users.filter(user => user.role === role);
  if (status && status !== 'all') users = users.filter(user => user.status === status);
  if (assignedClass && assignedClass !== 'all') users = users.filter(user => user.assignedClass === assignedClass);
  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = users.length;
  const start = (page - 1) * limit;
  res.json({ users: users.slice(start, start + limit).map(user => publicUser(user)), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

router.get('/:id', (req, res) => {
  const user = readStore().users.find(item => item.id === req.params.id && item.role !== 'admin');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: publicUser(user, true) });
});

router.post('/', async (req, res) => {
  const data = readStore();
  const role = clean(req.body.role).toLowerCase();
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const phone = clean(req.body.phone);
  const password = String(req.body.password || '');
  if (!['teacher', 'parent'].includes(role)) return res.status(400).json({ error: 'Only Teacher and Parent accounts can be created.' });
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !isStrongPassword(password)) return res.status(400).json({ error: 'Name, a valid email, and a strong password are required. Use 8+ characters with upper, lower, number, and symbol.' });
  if (data.users.some(user => user.email.toLowerCase() === email)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = normalizeUser({ id: generateId(), name, email, phone, password: await hashPassword(password), role, assignedClass: clean(req.body.assignedClass) || 'Unassigned', assignedStudentIds: Array.isArray(req.body.assignedStudentIds) ? req.body.assignedStudentIds : [], status: req.body.status === 'disabled' ? 'disabled' : 'active', createdAt: new Date().toISOString() });
  audit(user, 'Account created', req.user.name);
  data.users.push(user);
  writeStore(data);
  return res.status(201).json({ user: publicUser(user, true) });
});

router.put('/:id', (req, res) => {
  const data = readStore();
  const user = data.users.find(item => item.id === req.params.id && item.role !== 'admin');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const email = clean(req.body.email).toLowerCase();
  if (email && (!/^\S+@\S+\.\S+$/.test(email) || data.users.some(item => item.id !== user.id && item.email.toLowerCase() === email))) return res.status(409).json({ error: 'Use a unique, valid email address.' });
  ['name', 'phone', 'assignedClass', 'avatar'].forEach(field => { if (req.body[field] !== undefined) user[field] = clean(req.body[field]); });
  if (email) user.email = email;
  if (Array.isArray(req.body.assignedStudentIds)) user.assignedStudentIds = req.body.assignedStudentIds.map(clean).filter(Boolean);
  audit(user, 'Profile updated', req.user.name);
  writeStore(data);
  return res.json({ user: publicUser(user, true) });
});

router.post('/:id/reset-password', async (req, res) => {
  const data = readStore();
  const user = data.users.find(item => item.id === req.params.id && item.role !== 'admin');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const generated = `FC!${crypto.randomBytes(6).toString('base64url')}9a`;
  const password = String(req.body.password || generated);
  if (!isStrongPassword(password)) return res.status(400).json({ error: 'Password must use 8+ characters with upper, lower, number, and symbol.' });
  user.password = await hashPassword(password);
  audit(user, 'Password reset by administrator', req.user.name);
  writeStore(data);
  return res.json({ message: 'Password reset successfully.', temporaryPassword: req.body.password ? undefined : generated });
});

router.patch('/:id/status', (req, res) => {
  const data = readStore();
  const user = data.users.find(item => item.id === req.params.id && item.role !== 'admin');
  const status = clean(req.body.status).toLowerCase();
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (!['active', 'disabled'].includes(status)) return res.status(400).json({ error: 'Status must be active or disabled.' });
  user.status = status;
  audit(user, status === 'active' ? 'Account activated' : 'Account suspended', req.user.name);
  writeStore(data);
  return res.json({ user: publicUser(user, true) });
});

router.post('/bulk/action', (req, res) => {
  const data = readStore();
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const action = clean(req.body.action).toLowerCase();
  if (!ids.length || !['activate', 'disable', 'delete'].includes(action)) return res.status(400).json({ error: 'Select users and a valid bulk action.' });
  if (action === 'delete') data.users = data.users.filter(user => user.role === 'admin' || !ids.includes(user.id));
  else data.users.forEach(user => { if (user.role !== 'admin' && ids.includes(user.id)) { user.status = action === 'activate' ? 'active' : 'disabled'; audit(user, `Bulk ${action}`, req.user.name); } });
  writeStore(data);
  return res.json({ message: `${ids.length} account(s) updated.` });
});

router.delete('/:id', (req, res) => {
  const data = readStore();
  const index = data.users.findIndex(item => item.id === req.params.id && item.role !== 'admin');
  if (index < 0) return res.status(404).json({ error: 'User not found.' });
  data.users.splice(index, 1);
  writeStore(data);
  return res.status(204).end();
});

module.exports = router;
