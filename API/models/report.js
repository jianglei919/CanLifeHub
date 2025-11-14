const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        entityType: { type: String, enum: ['post', 'comment', 'user'], required: true },
        entityId: { type: Schema.Types.ObjectId, required: true, index: true },
        reason: { type: String, required: true },
        
        status: {
            type: String,
            enum: ['pending', 'resolved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);