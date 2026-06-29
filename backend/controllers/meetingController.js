const Meeting = require('../models/Meeting');
const Parent = require('../models/Parent');
const { getIsConnected } = require('../config/db');
const mockStore = require('../data/mockStore');
const { canAccessParent, filterParentsForRequest, forbidden } = require('../services/accessControl');

// Create Meeting
exports.createMeeting = async (req, res) => {
  try {
    const { parentId, title, description, dateTime } = req.body;

    if (!parentId || !title || !dateTime) {
      return res.status(400).json({ error: 'Parent ID, Title, and Date/Time are required.' });
    }

    let finalMeeting = null;

    if (getIsConnected()) {
      // Find parent to verify
      const parent = await Parent.findById(parentId);
      if (!parent) return res.status(404).json({ error: 'Parent not found.' });
      if (req.user?.role === 'parent') return res.status(403).json({ error: 'Parents cannot schedule meetings directly.' });
      if (!canAccessParent(req, parent)) return forbidden(res);

      const meeting = new Meeting({
        parentId,
        title,
        description,
        dateTime: new Date(dateTime),
        status: 'Scheduled',
        reminderSent: false
      });
      await meeting.save();
      finalMeeting = meeting;
    } else {
      const db = mockStore.loadData();
      const parent = db.parents.find(p => p.id === parentId);
      if (!parent) return res.status(404).json({ error: 'Parent not found.' });
      if (req.user?.role === 'parent') return res.status(403).json({ error: 'Parents cannot schedule meetings directly.' });
      if (!canAccessParent(req, parent)) return forbidden(res);

      finalMeeting = {
        id: `m_${Date.now()}`,
        parentId,
        title,
        description,
        dateTime: new Date(dateTime).toISOString(),
        status: 'Scheduled',
        reminderSent: false,
        meetingNotes: '',
        createdAt: new Date().toISOString()
      };
      db.meetings.push(finalMeeting);
      mockStore.saveData(db);
    }

    return res.status(201).json({
      message: 'Meeting scheduled successfully',
      meeting: finalMeeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// List Meetings
exports.listMeetings = async (req, res) => {
  try {
    if (getIsConnected()) {
      const list = await Meeting.find().populate('parentId').sort({ dateTime: 1 });
      const formatted = list.map(m => ({
        id: m._id,
        parentId: m.parentId ? m.parentId._id : '',
        parentName: m.parentId ? m.parentId.name : 'Unknown Parent',
        studentName: m.parentId ? m.parentId.studentName : 'Unknown Child',
        phone: m.parentId ? m.parentId.phone : '',
        email: m.parentId ? m.parentId.email : '',
        classGrade: m.parentId ? m.parentId.classGrade : '',
        title: m.title,
        description: m.description,
        dateTime: m.dateTime,
        status: m.status,
        reminderSent: m.reminderSent,
        meetingNotes: m.meetingNotes
      })).filter(item => canAccessParent(req, { _id: item.parentId, email: item.email, classGrade: item.classGrade }));
      return res.status(200).json(formatted);
    } else {
      const db = mockStore.loadData();
      const allowedParentIds = new Set(filterParentsForRequest(req, db.parents).map(parent => parent.id));
      const formatted = db.meetings.map(m => {
        const parent = db.parents.find(p => p.id === m.parentId);
        return {
          id: m.id,
          parentId: m.parentId,
          parentName: parent ? parent.name : 'Unknown Parent',
          studentName: parent ? parent.studentName : 'Unknown Child',
          phone: parent ? parent.phone : '',
          title: m.title,
          description: m.description,
          dateTime: m.dateTime,
          status: m.status,
          reminderSent: m.reminderSent,
          meetingNotes: m.meetingNotes
        };
      }).filter(item => allowedParentIds.has(item.parentId)).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      return res.status(200).json(formatted);
    }
  } catch (error) {
    console.error('Error listing meetings:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Meeting Status / Notes
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meetingNotes, reminderSent } = req.body;

    if (getIsConnected()) {
      const meeting = await Meeting.findById(id);
      if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
      if (req.user?.role === 'parent') return res.status(403).json({ error: 'Parents cannot update meeting records.' });
      const parent = await Parent.findById(meeting.parentId);
      if (!canAccessParent(req, parent)) return forbidden(res);

      if (status) meeting.status = status;
      if (meetingNotes !== undefined) meeting.meetingNotes = meetingNotes;
      if (reminderSent !== undefined) meeting.reminderSent = reminderSent;

      await meeting.save();
      return res.status(200).json({ message: 'Meeting updated successfully', meeting });
    } else {
      const db = mockStore.loadData();
      const meeting = db.meetings.find(m => m.id === id);
      if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
      if (req.user?.role === 'parent') return res.status(403).json({ error: 'Parents cannot update meeting records.' });
      const parent = db.parents.find(p => p.id === meeting.parentId);
      if (!canAccessParent(req, parent)) return forbidden(res);

      if (status) meeting.status = status;
      if (meetingNotes !== undefined) meeting.meetingNotes = meetingNotes;
      if (reminderSent !== undefined) meeting.reminderSent = reminderSent;

      mockStore.saveData(db);
      return res.status(200).json({ message: 'Meeting updated successfully', meeting });
    }
  } catch (error) {
    console.error('Error updating meeting:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
