const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    trim: true
  },
  classGrade: {
    type: String,
    required: true,
    trim: true
  },
  admissionStatus: {
    type: String,
    enum: ['Enquired', 'Registered', 'Admitted', 'Withdrawn', 'At-Risk'],
    default: 'Enquired'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Parent', ParentSchema);
