const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'parent'], default: 'admin' },
  phone: { type: String, default: '' },
  assignedClass: { type: String, default: '' },
  assignedStudentIds: [{ type: String }],
  status: { type: String, default: 'active' },
  lastLogin: { type: Date, default: null },
  avatar: { type: String, default: '' },
  loginHistory: [{ type: mongoose.Schema.Types.Mixed }],
  activityLogs: [{ type: mongoose.Schema.Types.Mixed }],
  parentId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', UserSchema);

// SQL helper to map row to object format expected by controllers
function mapRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    phone: row.phone,
    assignedClass: row.assigned_class,
    assignedStudentIds: (typeof row.assigned_student_ids === 'string') 
      ? JSON.parse(row.assigned_student_ids) 
      : (row.assigned_student_ids || []),
    status: row.status,
    lastLogin: row.last_login,
    avatar: row.avatar,
    loginHistory: (typeof row.login_history === 'string') 
      ? JSON.parse(row.login_history) 
      : (row.login_history || []),
    activityLogs: (typeof row.activity_logs === 'string') 
      ? JSON.parse(row.activity_logs) 
      : (row.activity_logs || []),
    parentId: row.parent_id,
    createdAt: row.created_at,
    save: async function() {
      const res = await db.query(
        `UPDATE users SET name=$1, email=$2, password=$3, role=$4, phone=$5, assigned_class=$6, 
         assigned_student_ids=$7, status=$8, last_login=$9, avatar=$10, login_history=$11, 
         activity_logs=$12, parent_id=$13 WHERE id=$14 RETURNING *`,
        [
          this.name,
          this.email.toLowerCase(),
          this.password,
          this.role,
          this.phone,
          this.assignedClass,
          JSON.stringify(this.assignedStudentIds),
          this.status,
          this.lastLogin ? new Date(this.lastLogin) : null,
          this.avatar,
          JSON.stringify(this.loginHistory),
          JSON.stringify(this.activityLogs),
          this.parentId,
          this.id
        ]
      );
      const updated = mapRow(res.rows[0]);
      Object.assign(this, updated);
      return this;
    }
  };
}

// Exported Wrapper object
const UserWrapper = {
  findOne: async function(query) {
    if (db.getDbType() === 'postgres') {
      let res;
      if (query.id) {
        res = await db.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [query.id]);
      } else {
        res = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [query.email]);
      }
      return mapRow(res.rows[0]);
    }
    return MongoUser.findOne(query);
  },

  findById: async function(id) {
    if (db.getDbType() === 'postgres') {
      const res = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);
      return mapRow(res.rows[0]);
    }
    return MongoUser.findById(id);
  },

  find: async function(query) {
    if (db.getDbType() === 'postgres') {
      let sql = `SELECT * FROM users`;
      const values = [];
      if (query) {
        const filters = [];
        if (query.role) {
          if (query.role.$ne) {
            filters.push(`role <> $${values.length + 1}`);
            values.push(query.role.$ne);
          } else {
            filters.push(`role = $${values.length + 1}`);
            values.push(query.role);
          }
        }
        if (filters.length > 0) {
          sql += ` WHERE ` + filters.join(' AND ');
        }
      }
      sql += ` ORDER BY created_at DESC`;
      const res = await db.query(sql, values);
      return res.rows.map(mapRow);
    }
    return MongoUser.find(query);
  },

  deleteOne: async function(query) {
    if (db.getDbType() === 'postgres') {
      if (query.id) {
        await db.query(`DELETE FROM users WHERE id = $1`, [query.id]);
      } else if (query.email) {
        await db.query(`DELETE FROM users WHERE LOWER(email) = LOWER($1)`, [query.email]);
      }
      return { deletedCount: 1 };
    }
    return MongoUser.deleteOne(query);
  },

  deleteMany: async function(query) {
    if (db.getDbType() === 'postgres') {
      await db.query(`DELETE FROM users WHERE role <> 'admin'`);
      return { deletedCount: 999 };
    }
    return MongoUser.deleteMany(query);
  },

  insertMany: async function(list) {
    if (db.getDbType() === 'postgres') {
      const inserted = [];
      for (const item of list) {
        const instance = this.createInstance(item);
        await instance.save();
        inserted.push(instance);
      }
      return inserted;
    }
    return MongoUser.insertMany(list);
  },

  createInstance: function(data) {
    const user = {
      id: data.id || `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email ? data.email.toLowerCase() : '',
      password: data.password,
      role: data.role || 'admin',
      phone: data.phone || '',
      assignedClass: data.assignedClass || '',
      assignedStudentIds: data.assignedStudentIds || [],
      status: data.status || 'active',
      lastLogin: data.lastLogin || null,
      avatar: data.avatar || '',
      loginHistory: data.loginHistory || [],
      activityLogs: data.activityLogs || [],
      parentId: data.parentId || '',
      save: async function() {
        const res = await db.query(
          `INSERT INTO users (id, name, email, password, role, phone, assigned_class, 
           assigned_student_ids, status, last_login, avatar, login_history, activity_logs, parent_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
           ON CONFLICT (email) 
           DO UPDATE SET name=EXCLUDED.name, password=EXCLUDED.password, role=EXCLUDED.role, 
                         phone=EXCLUDED.phone, assigned_class=EXCLUDED.assigned_class, 
                         assigned_student_ids=EXCLUDED.assigned_student_ids, status=EXCLUDED.status, 
                         last_login=EXCLUDED.last_login, avatar=EXCLUDED.avatar, 
                         login_history=EXCLUDED.login_history, activity_logs=EXCLUDED.activity_logs, 
                         parent_id=EXCLUDED.parent_id
           RETURNING *`,
          [
            this.id,
            this.name,
            this.email,
            this.password,
            this.role,
            this.phone,
            this.assignedClass,
            JSON.stringify(this.assignedStudentIds),
            this.status,
            this.lastLogin ? new Date(this.lastLogin) : null,
            this.avatar,
            JSON.stringify(this.loginHistory),
            JSON.stringify(this.activityLogs),
            this.parentId
          ]
        );
        const saved = mapRow(res.rows[0]);
        Object.assign(this, saved);
        return this;
      }
    };
    return user;
  }
};

function User(data) {
  return UserWrapper.createInstance(data);
}
Object.assign(User, UserWrapper);

module.exports = User;

