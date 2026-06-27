const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const MeetingSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dateTime: { type: Date, required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'], default: 'Scheduled' },
  reminderSent: { type: Boolean, default: false },
  meetingNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongoMeeting = mongoose.model('Meeting', MeetingSchema);

// SQL helper to map row to object format expected by controllers
function mapRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    description: row.description,
    dateTime: row.date_time,
    status: row.status,
    reminderSent: row.reminder_sent,
    meetingNotes: row.meeting_notes || '',
    createdAt: row.created_at,
    save: async function() {
      const res = await db.query(
        `UPDATE meetings SET parent_id=$1, title=$2, description=$3, date_time=$4, status=$5, 
         reminder_sent=$6, meeting_notes=$7 WHERE id=$8 RETURNING *`,
        [this.parentId, this.title, this.description, this.dateTime, this.status, this.reminderSent, this.meetingNotes, this.id]
      );
      const updated = mapRow(res.rows[0]);
      Object.assign(this, updated);
      return this;
    }
  };
}

// Thenable query chain to mimic Mongoose find().populate().sort().limit()
function createQueryChain(queryParams) {
  return {
    params: queryParams,
    populateList: [],
    sortObj: null,
    limitVal: null,
    populate: function(field) {
      this.populateList.push(field);
      return this;
    },
    sort: function(sortOpts) {
      this.sortObj = sortOpts;
      return this;
    },
    limit: function(val) {
      this.limitVal = val;
      return this;
    },
    then: async function(resolve, reject) {
      try {
        if (db.getDbType() !== 'postgres') {
          let mq = MongoMeeting.find(this.params);
          this.populateList.forEach(p => { mq = mq.populate(p); });
          if (this.sortObj) { mq = mq.sort(this.sortObj); }
          if (this.limitVal) { mq = mq.limit(this.limitVal); }
          const res = await mq;
          return resolve(res);
        }

        // Postgres SQL Join
        let sql = `
          SELECT m.*, 
                 p.name as p_name, p.email as p_email, p.phone as p_phone, 
                 p.student_name as p_student_name, p.student_id as p_student_id, 
                 p.class_grade as p_class_grade, p.admission_status as p_admission_status
          FROM meetings m
          LEFT JOIN parents p ON m.parent_id = p.id
        `;
        const values = [];
        if (this.params && this.params.parentId) {
          sql += ` WHERE m.parent_id = $1`;
          values.push(this.params.parentId);
        }
        
        sql += ` ORDER BY m.date_time DESC`;

        if (this.limitVal) {
          sql += ` LIMIT ${Number(this.limitVal)}`;
        }

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
const MeetingWrapper = {
  find: function(query) {
    return createQueryChain(query);
  },

  findById: async function(id) {
    if (db.getDbType() === 'postgres') {
      const res = await db.query(`SELECT * FROM meetings WHERE id = $1`, [id]);
      return mapRow(res.rows[0]);
    }
    return MongoMeeting.findById(id);
  },

  createInstance: function(data) {
    const meeting = {
      parentId: data.parentId,
      title: data.title,
      description: data.description || '',
      dateTime: data.dateTime,
      status: data.status || 'Scheduled',
      reminderSent: data.reminderSent || false,
      meetingNotes: data.meetingNotes || '',
      save: async function() {
        const res = await db.query(
          `INSERT INTO meetings (parent_id, title, description, date_time, status, reminder_sent, meeting_notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [this.parentId, this.title, this.description, this.dateTime, this.status, this.reminderSent, this.meetingNotes]
        );
        const saved = mapRow(res.rows[0]);
        Object.assign(this, saved);
        return this;
      }
    };
    return meeting;
  }
};

function Meeting(data) {
  return MeetingWrapper.createInstance(data);
}
Object.assign(Meeting, MeetingWrapper);

module.exports = Meeting;
