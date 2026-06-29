const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { loadData, saveData } = require('../data/mockStore');

const SAFE_USER_FIELDS = ['id', 'name', 'email', 'phone', 'role', 'assignedClass', 'assignedStudentIds', 'status', 'lastLogin', 'createdAt', 'avatar', 'loginHistory', 'activityLogs', 'parentId'];

function normalizeUser(user) {
  return {
    ...user,
    phone: user.phone || '',
    assignedClass: user.assignedClass || (user.role === 'teacher' ? 'Nursery B' : '-'),
    assignedStudentIds: user.assignedStudentIds || [],
    status: user.status || 'active',
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt || new Date().toISOString(),
    avatar: user.avatar || '',
    loginHistory: user.loginHistory || [],
    activityLogs: user.activityLogs || []
  };
}

function publicUser(user, detailed = false) {
  const normalized = normalizeUser(user);
  const keys = detailed ? SAFE_USER_FIELDS : SAFE_USER_FIELDS.filter(field => !['loginHistory', 'activityLogs'].includes(field));
  return Object.fromEntries(keys.map(key => [key, normalized[key]]));
}

function ensureAccounts(data) {
  data.users = (data.users || []).map(normalizeUser);
  const adminIndexes = data.users.map((user, index) => user.role === 'admin' ? index : -1).filter(index => index >= 0);
  adminIndexes.slice(1).forEach(index => {
    data.users[index].role = 'teacher';
    data.users[index].status = 'disabled';
    data.users[index].activityLogs = [{ timestamp: new Date().toISOString(), action: 'Extra admin account disabled by singleton guard', actor: 'System' }, ...(data.users[index].activityLogs || [])].slice(0, 50);
  });
  const templates = [
    { id: 'u1', name: 'Center Head Administrator', email: 'admin@firstcry.com', password: 'admin', role: 'admin', phone: '+91 98765 00001', assignedClass: 'All centers' },
    { id: 'u2', name: 'Class Teacher Priya', email: 'priya@firstcry.com', password: 'teacher', role: 'teacher', phone: '+91 98765 00002', assignedClass: 'Nursery B' },
    { id: 'u3', name: 'Class Teacher Meera', email: 'meera.teacher@firstcry.com', password: 'teacher', role: 'teacher', phone: '+91 98765 00003', assignedClass: 'Playgroup A' }
  ];
  templates.forEach(template => {
    if (!data.users.some(user => user.email.toLowerCase() === template.email.toLowerCase())) data.users.push(normalizeUser(template));
  });
  (data.parents || []).forEach((parent, index) => {
    if (!data.users.some(user => user.parentId === parent.id || user.email.toLowerCase() === parent.email.toLowerCase())) {
      data.users.push(normalizeUser({
        id: `up${index + 1}`,
        name: parent.name,
        email: parent.email,
        password: index === 0 ? 'parent' : 'Welcome@123',
        phone: parent.phone,
        role: 'parent',
        parentId: parent.id,
        assignedClass: parent.classGrade,
        assignedStudentIds: [parent.studentId],
        status: index === 4 ? 'disabled' : 'active',
        createdAt: parent.createdAt
      }));
    }
  });
  return data;
}

function readStore() { return ensureAccounts(loadData()); }
function writeStore(data) { saveData(data); }
function generateId() { return `u${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`; }

async function verifyPassword(user, candidate) {
  if (!user.password) return false;
  if (user.password.startsWith('$2')) return bcrypt.compare(candidate, user.password);
  const stored = Buffer.from(String(user.password));
  const supplied = Buffer.from(String(candidate));
  return stored.length === supplied.length && crypto.timingSafeEqual(stored, supplied);
}

function isStrongPassword(password) {
  return typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

async function hashPassword(password) { return bcrypt.hash(password, 12); }

module.exports = { readStore, writeStore, publicUser, normalizeUser, generateId, verifyPassword, hashPassword, isStrongPassword };
