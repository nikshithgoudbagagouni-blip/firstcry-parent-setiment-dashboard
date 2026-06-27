const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher'], default: 'admin' },
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
    createdAt: row.created_at,
    save: async function() {
      const res = await db.query(
        `UPDATE users SET name=$1, email=$2, password=$3, role=$4 WHERE id=$5 RETURNING *`,
        [this.name, this.email.toLowerCase(), this.password, this.role, this.id]
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
      const res = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [query.email]);
      return mapRow(res.rows[0]);
    }
    return MongoUser.findOne(query);
  },

  createInstance: function(data) {
    const user = {
      name: data.name,
      email: data.email ? data.email.toLowerCase() : '',
      password: data.password,
      role: data.role || 'admin',
      save: async function() {
        const res = await db.query(
          `INSERT INTO users (name, email, password, role) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (email) 
           DO UPDATE SET name=EXCLUDED.name, password=EXCLUDED.password, role=EXCLUDED.role
           RETURNING *`,
          [this.name, this.email, this.password, this.role]
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
