const mongoose = require('mongoose');
const { Schema } = mongoose;

const advertisementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    objective: { type: String, default: '' },
    description: { type: String, default: '' },
    placement: {
      type: String,
      enum: ['sidebar', 'feed', 'interstitial'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_review',
        'changes_requested',
        'approved',
        'scheduled',
        'running',
        'paused',
        'rejected',
        'completed',
      ],
      default: 'pending_review',
      index: true,
    },
    priorityWeight: { type: Number, default: 1, min: 0 },
    advertiser: {
      company: { type: String, default: '' },
      contactName: { type: String, required: true },
      contactEmail: { type: String, required: true },
      contactPhone: { type: String, default: '' },
      billingAddress: { type: String, default: '' },
    },
    creative: {
      headline: { type: String, required: true },
      subHeadline: { type: String, default: '' },
      body: { type: String, default: '' },
      mediaUrl: { type: String, required: true },
      mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
      ctaLabel: { type: String, default: '了解详情' },
      ctaLink: { type: String, required: true },
      fallbackText: { type: String, default: '' },
    },
    targeting: {
      regions: [{ type: String }],
      interests: [{ type: String }],
      keywords: [{ type: String }],
    },
    schedule: {
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true },
      preferredHours: [{ type: Number, min: 0, max: 23 }],
      timezone: { type: String, default: 'Asia/Shanghai' },
      dailyBudget: { type: Number, default: 0 },
    },
    billing: {
      plan: { type: String, enum: ['daily', 'flat', 'impression'], default: 'daily' },
      currency: { type: String, default: 'CNY' },
      reviewFee: { type: Number, default: 0 },
      baseCost: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalDue: { type: Number, default: 0 },
      estimatedImpressions: { type: Number, default: 0 },
      paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      invoiceNumber: { type: String, default: '' },
      paidAt: { type: Date },
    },
    audit: {
      reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String, default: '' },
      decidedAt: { type: Date },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      lastImpressionAt: { type: Date },
      lastClickAt: { type: Date },
    },
  },
  { timestamps: true }
);

advertisementSchema.index({ status: 1, 'schedule.startAt': 1, 'schedule.endAt': 1 });
advertisementSchema.index({ placement: 1, priorityWeight: -1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
