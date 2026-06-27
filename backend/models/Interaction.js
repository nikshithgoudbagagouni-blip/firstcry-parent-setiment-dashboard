const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const InteractionSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', default: null },
  type: { type: String, enum: ['email', 'portal_log', 'survey', 'rsvp', 'meeting_notes'], required: true },
  rawText: { type: String, default: '' },
  normalizedText: { type: String, default: '' },
  sentimentScore: { type: Number, default: 0 },
  sentimentLabel: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
  rating: { type: Number, min: 1, max: 5, default: 3 },
  extractedKeywords: [{ type: String }],
  metadata: {
    portalLogins: { type: Number, default: 0 },
    surveyCompleted: { type: Boolean, default: false },
    eventAttended: { type: Boolean, default: false }
  },
  timestamp: { type: Date, default: Date.now }
});

const MongoInteraction = mongoose.model('Interaction', InteractionSchema);

// SQL helper to map row to object format expected by controllers
function mapRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    parentId: row.parent_id,
    childId: row.child_id,
    type: row.type,
    rawText: row.raw_text,
    normalizedText: row.normalized_text,
    sentimentScore: Number(row.sentiment_score),
    sentimentLabel: row.sentiment_label,
    rating: row.rating,
    extractedKeywords: (typeof row.extracted_keywords === 'string') 
      ? JSON.parse(row.extracted_keywords) 
      : (row.extracted_keywords || []),
    metadata: (typeof row.metadata === 'string') 
      ? JSON.parse(row.metadata) 
      : (row.metadata || {}),
    timestamp: row.timestamp,
    save: async function() {
      const res = await db.query(
        `UPDATE interactions SET parent_id=$1, child_id=$2, type=$3, raw_text=$4, normalized_text=$5, 
         sentiment_score=$6, sentiment_label=$7, rating=$8, extracted_keywords=$9, metadata=$10 
         WHERE id=$11 RETURNING *`,
        [
          this.parentId,
          this.childId,
          this.type,
          this.rawText,
          this.normalizedText,
          this.sentimentScore,
          this.sentimentLabel,
          this.rating,
          JSON.stringify(this.extractedKeywords),
          JSON.stringify(this.metadata),
          this.id
        ]
      );
      const updated = mapRow(res.rows[0]);
      Object.assign(this, updated);
      return this;
    }
  };
}

// Thenable query chain to mimic Mongoose find().populate().sort()
function createQueryChain(queryParams) {
  return {
    params: queryParams,
    populateList: [],
    sortObj: null,
    populate: function(field) {
      this.populateList.push(field);
      return this;
    },
    sort: function(sortOpts) {
      this.sortObj = sortOpts;
      return this;
    },
    then: async function(resolve, reject) {
      try {
        if (db.getDbType() !== 'postgres') {
          let mq = MongoInteraction.find(this.params);
          this.populateList.forEach(p => { mq = mq.populate(p); });
          if (this.sortObj) { mq = mq.sort(this.sortObj); }
          const res = await mq;
          return resolve(res);
        }

        // Postgres SQL Join
        let sql = `
          SELECT i.*, 
                 p.name as p_name, p.email as p_email, p.phone as p_phone, 
                 p.student_name as p_student_name, p.student_id as p_student_id, 
                 p.class_grade as p_class_grade, p.admission_status as p_admission_status,
                 c.name as c_name, c.class_grade as c_class_grade, c.date_of_birth as c_dob
          FROM interactions i
          LEFT JOIN parents p ON i.parent_id = p.id
          LEFT JOIN children c ON i.child_id = c.id
        `;
        const values = [];
        if (this.params && this.params.parentId) {
          sql += ` WHERE i.parent_id = $1`;
          values.push(this.params.parentId);
        }
        
        sql += ` ORDER BY i.timestamp DESC`;

        const res = await db.query(sql, values);
        const mapped = res.rows.map(row => {
          const item = mapRow(row);
          if (this.populateList.includes('parentId') && row.parent_id) {
            item.parentId = {
              _id: row.parent_id,
              id: row.parent_id,
              name: row.p_name,
              email: row.p_email,
              phone: row.p_phone,
              studentName: row.p_student_name,
              studentId: row.p_student_id,
              classGrade: row.p_class_grade,
              admissionStatus: row.p_admission_status
            };
          }
          if (this.populateList.includes('childId') && row.child_id) {
            item.childId = {
              _id: row.child_id,
              id: row.child_id,
              parentId: row.parent_id,
              name: row.c_name,
              classGrade: row.c_class_grade,
              dateOfBirth: row.c_dob
            };
          }
          return item;
        });
        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    }
  };
}

// Exported Wrapper object
const InteractionWrapper = {
  find: function(query) {
    return createQueryChain(query);
  },

  findById: function(id) {
    return {
      populateList: [],
      populate: function(field) {
        this.populateList.push(field);
        return this;
      },
      then: async function(resolve, reject) {
        try {
          if (db.getDbType() !== 'postgres') {
            let mq = MongoInteraction.findById(id);
            this.populateList.forEach(p => { mq = mq.populate(p); });
            const res = await mq;
            return resolve(res);
          }

          const sql = `
            SELECT i.*, 
                   p.name as p_name, p.email as p_email, p.phone as p_phone, 
                   p.student_name as p_student_name, p.student_id as p_student_id, 
                   p.class_grade as p_class_grade, p.admission_status as p_admission_status,
                   c.name as c_name, c.class_grade as c_class_grade, c.date_of_birth as c_dob
            FROM interactions i
            LEFT JOIN parents p ON i.parent_id = p.id
            LEFT JOIN children c ON i.child_id = c.id
            WHERE i.id = $1
          `;
          const res = await db.query(sql, [id]);
          if (res.rows.length === 0) return resolve(null);
          
          const row = res.rows[0];
          const item = mapRow(row);
          if (this.populateList.includes('parentId') && row.parent_id) {
            item.parentId = {
              _id: row.parent_id,
              id: row.parent_id,
              name: row.p_name,
              email: row.p_email,
              phone: row.p_phone,
              studentName: row.p_student_name,
              studentId: row.p_student_id,
              classGrade: row.p_class_grade,
              admissionStatus: row.p_admission_status
            };
          }
          if (this.populateList.includes('childId') && row.child_id) {
            item.childId = {
              _id: row.child_id,
              id: row.child_id,
              parentId: row.parent_id,
              name: row.c_name,
              classGrade: row.c_class_grade,
              dateOfBirth: row.c_dob
            };
          }
          resolve(item);
        } catch (err) {
          reject(err);
        }
      }
    };
  },

  createInstance: function(data) {
    const interaction = {
      parentId: data.parentId,
      childId: data.childId || null,
      type: data.type,
      rawText: data.rawText || '',
      normalizedText: data.normalizedText || '',
      sentimentScore: data.sentimentScore || 0,
      sentimentLabel: data.sentimentLabel || 'Neutral',
      rating: data.rating || 3,
      extractedKeywords: data.extractedKeywords || [],
      metadata: data.metadata || {},
      save: async function() {
        const res = await db.query(
          `INSERT INTO interactions (parent_id, child_id, type, raw_text, normalized_text, sentiment_score, 
           sentiment_label, rating, extracted_keywords, metadata) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING *`,
          [
            this.parentId,
            this.childId,
            this.type,
            this.rawText,
            this.normalizedText,
            this.sentimentScore,
            this.sentimentLabel,
            this.rating,
            JSON.stringify(this.extractedKeywords),
            JSON.stringify(this.metadata)
          ]
        );
        const saved = mapRow(res.rows[0]);
        Object.assign(this, saved);
        return this;
      }
    };
    return interaction;
  }
};

function Interaction(data) {
  return InteractionWrapper.createInstance(data);
}
Object.assign(Interaction, InteractionWrapper);

module.exports = Interaction;
