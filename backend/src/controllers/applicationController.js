// src/controllers/applicationController.js
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary'); 
const fs = require('fs');
const { sendEmail } = require('../utils/mailer'); 
const { z } = require('zod');

const createApplicationSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().optional(),
  // Resume handled via file
});

exports.createApplication = async (req, res) => {
  try {
    const parsed = createApplicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

    const { jobId, coverLetter } = parsed.data;
    if (!req.file) return res.status(400).json({ message: 'Resume required' });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, { folder: 'recruitment_app_resumes' });
    fs.unlinkSync(req.file.path);

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const application = await Application.create({
      applicant: req.user._id,
      job: jobId,
      resume: result.secure_url,
      coverLetter,
      candidateInfo: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
    });

    // Notify applicant
    await sendEmail({
      to: req.user.email,
      subject: 'Application Received',
      text: `Your application for ${job.title} has been received.`,
    });

    // Notify HR/creator
    const recruiter = await User.findById(job.createdBy);
    await sendEmail({
      to: recruiter.email,
      subject: 'New Application',
      text: `${req.user.firstName} ${req.user.lastName} applied for ${job.title}. Resume: ${application.resume}`,
    });

    // Create notification
    await Notification.create({ user: job.createdBy, type: 'new_application', payload: { applicationId: application._id } });

    await AuditLog.create({ actor: req.user._id, action: 'create_application', targetType: 'Application', targetId: application._id });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllApplications = async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const applications = await Application.find({})
      .populate('applicant', 'firstName lastName email')
      .populate('job', 'title department');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getApplicationsByJob = async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'firstName lastName email')
      .populate('job', 'title department');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;
  const { status } = req.body;
  try {
    const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Notify applicant
    const applicant = await User.findById(application.applicant);
    await sendEmail({
      to: applicant.email,
      subject: 'Application Status Update',
      text: `Your application status for ${application.job.title} is now ${status}.`,
    });

    await Notification.create({ user: application.applicant, type: 'status_update', payload: { status } });
    await AuditLog.create({ actor: req.user._id, action: 'update_status', targetType: 'Application', targetId: id, details: { status } });

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addNoteToApplication = async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;
  const { text } = req.body;
  try {
    const application = await Application.findById(id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.notes.push({ text, addedBy: req.user._id });
    await application.save();

    await AuditLog.create({ actor: req.user._id, action: 'add_note', targetType: 'Application', targetId: id, details: { text } });
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};