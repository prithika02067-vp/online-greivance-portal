const cron = require('node-cron');
const Grievance = require('../models/Grievance');

function startEscalationJob() {
  cron.schedule('0 0 * * *', async () => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale = await Grievance.find({ status: { $in: ['Pending', 'In Progress'] }, createdAt: { $lt: cutoff } });
    for (const grievance of stale) {
      grievance.status = 'Escalated';
      grievance.statusHistory.push({ status: 'Escalated', changedAt: new Date(), remark: 'Auto-escalated after 7 days' });
      await grievance.save();
      console.log(`[escalation] ${grievance._id} flagged for admin review`);
    }
  });
}

module.exports = { startEscalationJob };
