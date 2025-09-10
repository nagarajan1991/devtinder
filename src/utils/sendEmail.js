const { createGmailTransporter } = require("./gmailClient.js");

const run = async (subject, htmlBody, toEmailId, fromAddress = process.env.GMAIL_USER, textBody = "") => {
  const to = toEmailId || process.env.GMAIL_USER;
  const from = fromAddress || process.env.GMAIL_USER;
  
  // Use Gmail instead of AWS SES
  const transporter = createGmailTransporter();
  
  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: htmlBody,
    text: textBody
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { run };