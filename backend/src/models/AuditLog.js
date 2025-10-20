// AuditLog.js
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: Object, default: {} },
}, { timestamps: true });

auditLogSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('AuditLog', auditLogSchema);