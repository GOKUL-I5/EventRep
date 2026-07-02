const nodemailer = require('nodemailer');

const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Please provide name, email, and message" });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to SendGrid, AWS SES, etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, // Send confirmation to user
      subject: `Confirmation: We received your message regarding "${subject || 'General Inquiry'}"`,
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for reaching out to the Event Platform team.</p>
        <p>We have received your message and will get back to you shortly.</p>
        <hr/>
        <p><strong>Your Message:</strong></p>
        <p>${message}</p>
      `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log("Mock Email Sent (Configure EMAIL_USER and EMAIL_PASS in .env to send real emails): ", mailOptions);
    }

    res.status(200).json({ success: true, message: "Contact form submitted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContactForm };
