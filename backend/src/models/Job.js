// Job.js
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Job title is required'], trim: true },
  description: { type: String, required: [true, 'Job description is required'] },
  department: { type: String, required: [true, 'Department is required'] },
  location: { type: String, default: 'Remote' },
  salaryRange: { type: String },
  type: { type: String, enum: ['CDI', 'CDD', 'Stage', 'Intern'], default: 'CDI' },
  requirements: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  visibility: { type: String, enum: ['internal', 'public'], default: 'public' },
}, { timestamps: true });

jobSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

jobSchema.pre('save', function(next) {
  this.tagsString = this.tags.join(' ');
  next();
});
jobSchema.index({ title: 'text', description: 'text', tagsString: 'text' });

jobSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);