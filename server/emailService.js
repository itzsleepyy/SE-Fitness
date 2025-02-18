import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendGroupInvitation(email, groupName, invitationCode) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Invitation to join ${groupName} on CoreX`,
    html: `
      <h1>You've been invited to join ${groupName}!</h1>
      <p>You've been invited to join a fitness group on CoreX. Join the group to track goals and progress together!</p>
      <p>Your invitation code is: <strong>${invitationCode}</strong></p>
      <p>To join, simply enter this code in the "Join Group" section of the app.</p>
      <p>This invitation will expire in 7 days.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendGoalShared(email, goalTitle, groupName, sharingCode) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `New Goal Shared in ${groupName}`,
    html: `
      <h1>A new goal has been shared with you!</h1>
      <p>A member of ${groupName} has shared their goal "${goalTitle}" with the group.</p>
      <p>To add this goal to your profile, use the code: <strong>${sharingCode}</strong></p>
      <p>You can enter this code in the "Add Goal" section of your dashboard.</p>
      <p>This code will expire in 7 days.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendGoalAchievement(email, goalTitle, groupName) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Goal Achievement in ${groupName}!`,
    html: `
      <h1>Congratulations!</h1>
      <p>A member of ${groupName} has achieved their goal "${goalTitle}"!</p>
      <p>Keep up the great work and continue supporting each other!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendGoalProgress(email, goalTitle, groupName, progress, target, unit) {
  const percentage = Math.round((progress / target) * 100);
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Goal Progress Update in ${groupName}`,
    html: `
      <h1>Goal Progress Update</h1>
      <p>There's been progress on the goal "${goalTitle}" in ${groupName}!</p>
      <p>Current progress: ${progress} ${unit} (${percentage}% of target ${target} ${unit})</p>
      <p>Keep going! You're doing great!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}