const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  streamTransport: true,
  newline: 'unix',
  buffer: true
});

async function notifyStatusChange(grievance, status) {
  const recipient = grievance.submittedBy?.email || 'citizen@example.com';
  const mail = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'noreply@grievance.local',
    to: recipient,
    subject: `Grievance update: ${grievance.title}`,
    text: `Your grievance is now ${status}.`
  });
  console.log(`[mail:dev] ${recipient} <- ${mail.message.toString()}`);
}

module.exports = { notifyStatusChange };
