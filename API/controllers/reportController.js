const mongoose = require('mongoose');
const Report = require('../models/report');

/** POST /reports - 创建举报 */
exports.create = async (req, res) => {
    try {
        const user = req.user;
        const { entityType, entityId, reason } = req.body;

        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });
        if (!['post', 'comment', 'user'].includes(entityType)) return res.status(400).json({ error: 'Invalid entityType' });
        if (!mongoose.isValidObjectId(entityId)) return res.status(400).json({ error: 'Invalid entityId' });
        if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason is required' });

        const doc = await Report.create({
            reporterId: user.id,
            entityType,
            entityId,
            reason: reason.trim(),
            status: 'pending',
        });

        res.status(201).json(doc);
    } catch (e) {
        console.error('[reports#create]', e);
        res.status(500).json({ error: e.message || 'Failed to create report' });
    }
};