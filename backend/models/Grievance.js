const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected', 'Escalated'], default: 'Pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [String],
  statusHistory: [{ status: String, changedAt: { type: Date, default: Date.now }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, remark: String }],
  resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Grievance', grievanceSchema);
