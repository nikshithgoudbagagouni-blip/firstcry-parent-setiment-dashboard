const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const ChildSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  name: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, default: null },
  classGrade: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const MongoChild = mongoose.model('Child', ChildSchema);

// SQL helper to map row to object format expected by controllers
function mapRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    classGrade: row.class_grade,
    dateOfBirth: row.date_of_birth,
    createdAt: row.created_at,
    save: async function() {
      const res = await db.query(
        `UPDATE children SET parent_id=$1, name=$2, class_grade=$3, date_of_birth=$4 WHERE id=$5 RETURNING *`,
        [this.parentId, this.name, this.classGrade, this.dateOfBirth, this.id]
      );
      const updated = mapRow(res.rows[0]);
      Object.assign(this, updated);
      return this;
    }
  };
}

// Exported Wrapper object
const ChildWrapper = {
  findOne: async function(query) {
    if (db.getDbType() === 'postgres') {
      if (query.parentId && query.name) {
        const res = await db.query(
          `SELECT * FROM children WHERE parent_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
          [query.parentId, query.name]
        );
        return mapRow(res.rows[0]);
      } else if (query.parentId) {
        const res = await db.query(
          `SELECT * FROM children WHERE parent_id = $1 LIMIT 1`,
          [query.parentId]
        );
        return mapRow(res.rows[0]);
      }
    }
    return MongoChild.findOne(query);
  },

  find: async function(query) {
    if (db.getDbType() === 'postgres') {
      let res;
      if (query && query.parentId) {
        res = await db.query(`SELECT * FROM children WHERE parent_id = $1 ORDER BY created_at DESC`, [query.parentId]);
      } else {
        res = await db.query(`SELECT * FROM children ORDER BY created_at DESC`);
      }
      return res.rows.map(mapRow);
    }
    return MongoChild.find(query);
  },

  createInstance: function(data) {
    const child = {
      parentId: data.parentId,
      name: data.name,
      classGrade: data.classGrade,
      dateOfBirth: data.dateOfBirth || null,
      save: async function() {
        const res = await db.query(
          `INSERT INTO children (parent_id, name, class_grade, date_of_birth) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [this.parentId, this.name, this.classGrade, this.dateOfBirth]
        );
        const saved = mapRow(res.rows[0]);
        Object.assign(this, saved);
        return this;
      }
    };
    return child;
  }
};

function Child(data) {
  return ChildWrapper.createInstance(data);
}
Object.assign(Child, ChildWrapper);

module.exports = Child;
