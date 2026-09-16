const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
