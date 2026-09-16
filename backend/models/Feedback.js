const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
