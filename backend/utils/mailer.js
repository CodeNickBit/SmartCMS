const nodemailer = require('nodemailer');

function createTransporter() {
    const emailUser = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();
    const emailPassword = process.env.EMAIL_PASSWORD
        ? process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, '')
        : '';

    if (!emailPassword) {
        throw new Error('Email configuration error: EMAIL_PASSWORD is required');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPassword }
    });
}

async function sendEscalationEmail({ employeeName, leaveType, startDate, endDate, reason, originalManagerName }) {
    const hrEmail = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();
    const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const managerNote = originalManagerName
        ? `<p><strong>Original Reporting Manager:</strong> ${originalManagerName} (currently on leave)</p>`
        : '';

    const mailOptions = {
        from: hrEmail,
        to: hrEmail,
        subject: `Leave Escalated to HR – ${employeeName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #1B264F, #3083DC); padding: 24px 28px;">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">⚠️ Leave Request Escalated to HR</h2>
                    <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">SmartCMS – Automated Notification</p>
                </div>
                <div style="padding: 24px 28px; background: #f9fafb; color: #1f2937;">
                    <p>A leave request has been automatically routed to the HR pool because the reporting manager is currently unavailable.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
                        <tr style="background: #fff; border: 1px solid #e5e7eb;">
                            <td style="padding: 10px 14px; font-weight: 600; width: 40%; color: #374151;">Employee</td>
                            <td style="padding: 10px 14px; color: #111827;">${employeeName}</td>
                        </tr>
                        <tr style="background: #f3f4f6; border: 1px solid #e5e7eb;">
                            <td style="padding: 10px 14px; font-weight: 600; color: #374151;">Leave Type</td>
                            <td style="padding: 10px 14px; color: #111827;">${leaveType}</td>
                        </tr>
                        <tr style="background: #fff; border: 1px solid #e5e7eb;">
                            <td style="padding: 10px 14px; font-weight: 600; color: #374151;">Duration</td>
                            <td style="padding: 10px 14px; color: #111827;">${fmt(startDate)} – ${fmt(endDate)}</td>
                        </tr>
                        <tr style="background: #f3f4f6; border: 1px solid #e5e7eb;">
                            <td style="padding: 10px 14px; font-weight: 600; color: #374151;">Reason</td>
                            <td style="padding: 10px 14px; color: #111827;">${reason}</td>
                        </tr>
                    </table>
                    ${managerNote ? `<div style="margin-top: 16px; padding: 12px 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 13px; color: #92400e;">${managerNote}</div>` : ''}
                    <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">Please review and action this request at your earliest convenience.</p>
                </div>
                <div style="padding: 14px 28px; background: #f3f4f6; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Smart Corporate Management System &nbsp;|&nbsp; Automated Alert</p>
                </div>
            </div>
        `
    };

    try {
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Escalation email sent for ${employeeName}`);
    } catch (err) {
        console.error('[Mailer] Failed to send escalation email:', err.message);
    }
}

module.exports = { sendEscalationEmail };
