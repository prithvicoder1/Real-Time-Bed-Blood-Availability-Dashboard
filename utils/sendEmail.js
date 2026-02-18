const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // thorough check for env vars, use test account if not present
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });
    } else {
        // Fallback to Ethereal for testing if no real SMTP provided
        console.log('No SMTP config found. Using Ethereal (mock) email.');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'CareBridge'} <${process.env.FROM_EMAIL || 'noreply@carebridge.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #3b82f6; text-align: center;">CareBridge</h2>
                <h3 style="color: #333; text-align: center;">Password Reset Request</h3>
                <p>You requested a password reset. Please use the following OTP to reset your password:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h1 style="margin: 0; color: #3b82f6; letter-spacing: 5px;">${options.otp}</h1>
                </div>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this email, please ignore it.</p>
            </div>
        `
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
    console.log('OTP SENT (DEBUG):', options.otp); // Added for testing
    if (!process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
