const { readStore } = require('./userService');

function currentAccount(req) {
  if (!req.user?.sub) return null;
  return readStore().users.find(user => user.id === req.user.sub && user.status === 'active') || null;
}

function normalizeId(value) {
  if (!value) return '';
  return String(value._id || value.id || value);
}

function parentIdOf(parent) {
  return normalizeId(parent);
}

function canAccessParent(req, parent) {
  const account = currentAccount(req);
  if (!account || !parent) return false;
  if (account.role === 'admin') return true;

  const parentId = parentIdOf(parent);
  const parentEmail = String(parent.email || '').toLowerCase();
  const parentStudentId = String(parent.studentId || '');
  const parentClass = String(parent.classGrade || '');

  if (account.role === 'parent') {
    return Boolean(
      (account.parentId && account.parentId === parentId) ||
      (account.email && account.email.toLowerCase() === parentEmail)
    );
  }

  if (account.role === 'teacher') {
    const assignedStudents = account.assignedStudentIds || [];
    return Boolean(
      (account.assignedClass && account.assignedClass === parentClass) ||
      assignedStudents.includes(parentStudentId)
    );
  }

  return false;
}

function filterParentsForRequest(req, parents) {
  return parents.filter(parent => canAccessParent(req, parent));
}

function canAccessParentId(req, parentId, parents) {
  const parent = parents.find(item => parentIdOf(item) === String(parentId));
  return canAccessParent(req, parent);
}

function forbidden(res) {
  return res.status(403).json({ error: 'You do not have permission to access this record.' });
}

module.exports = {
  currentAccount,
  canAccessParent,
  filterParentsForRequest,
  canAccessParentId,
  forbidden
};
