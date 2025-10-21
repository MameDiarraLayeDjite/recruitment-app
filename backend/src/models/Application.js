// src/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resume: { type: String, required: true },
  coverLetter: { type: String, default: '' },
  candidateInfo: { // Snapshot for external or quick access
    name: { type: String },
    email: { type: String },
    phone: { type: String },
  },
  status: { type: String, enum: ['pending', 'in_review', 'interview', 'offer', 'rejected', 'accepted'], default: 'pending' },
  notes: [{ 
    text: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],
  scores: { type: Map, of: Number, default: {} }, // e.g., { technical: 8, cultural: 7 }
}, { timestamps: true });

// Indexes
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicant: 1 });

module.exports = mongoose.model('Application', applicationSchema);