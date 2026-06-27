const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const ParentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  studentName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  classGrade: { type: String, required: true, trim: true },
  admissionStatus: { type: String, enum: ['Enquired', 'Registered', 'Admitted', 'Withdrawn', 'At-Risk'], default: 'Enquired' },
  createdAt: { type: Date, default: Date.now }
});

const MongoParent = mongoose.model('Parent', ParentSchema);

// SQL helper to map row to object format expected by controllers
function mapRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    studentName: row.student_name,
    studentId: row.student_id,
    classGrade: row.class_grade,
    admissionStatus: row.admission_status,
    createdAt: row.created_at,
    save: async function() {
      const res = await db.query(
        `UPDATE parents SET name=$1, email=$2, phone=$3, student_name=$4, student_id=$5, class_grade=$6, admission_status=$7 WHERE id=$8 RETURNING *`,
        [this.name, this.email.toLowerCase(), this.phone, this.studentName, this.studentId, this.classGrade, this.admissionStatus, this.id]
      );
      const updated = mapRow(res.rows[0]);
      Object.assign(this, updated);
      return this;
    }
  };
}

// Exported Wrapper object
const ParentWrapper = {
  findOne: async function(query) {
    if (db.getDbType() === 'postgres') {
      let email = query.email;
      if (typeof email === 'object' && email.$regex) {
        const cleanPattern = email.$regex.replace(/^\^|\$$/g, '');
        const res = await db.query(`SELECT * FROM parents WHERE email ILIKE $1 LIMIT 1`, [cleanPattern]);
        return mapRow(res.rows[0]);
      }
      const res = await db.query(`SELECT * FROM parents WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
      return mapRow(res.rows[0]);
    }
    return MongoParent.findOne(query);
  },

  findById: async function(id) {
    if (db.getDbType() === 'postgres') {
      const res = await db.query(`SELECT * FROM parents WHERE id = $1`, [id]);
      return mapRow(res.rows[0]);
    }
    return MongoParent.findById(id);
  },

  find: async function(query) {
    if (db.getDbType() === 'postgres') {
      const res = await db.query(`SELECT * FROM parents ORDER BY created_at DESC`);
      return res.rows.map(mapRow);
    }
    return MongoParent.find(query);
  },

  createInstance: function(data) {
    const parent = {
      name: data.name,
      email: data.email ? data.email.toLowerCase() : '',
      phone: data.phone,
      studentName: data.studentName,
      studentId: data.studentId,
      classGrade: data.classGrade,
      admissionStatus: data.admissionStatus || 'Enquired',
      save: async function() {
        const res = await db.query(
          `INSERT INTO parents (name, email, phone, student_name, student_id, class_grade, admission_status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (email) 
           DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, student_name=EXCLUDED.student_name, student_id=EXCLUDED.student_id, class_grade=EXCLUDED.class_grade, admission_status=EXCLUDED.admission_status
           RETURNING *`,
          [this.name, this.email, this.phone, this.studentName, this.studentId, this.classGrade, this.admissionStatus]
        );
        const saved = mapRow(res.rows[0]);
        Object.assign(this, saved);
        return this;
      }
    };
    return parent;
  }
};

function Parent(data) {
  return ParentWrapper.createInstance(data);
}
Object.assign(Parent, ParentWrapper);

module.exports = Parent;
