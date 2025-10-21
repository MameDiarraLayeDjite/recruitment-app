// Interview.js
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
  }],
  location: { type: String },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  evaluation: {
    scores: { type: Map, of: Number, default: {} },
    notes: { type: String },
  },
}, { timestamps: true });

interviewSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Interview', interviewSchema);