const nodemailer = require('nodemailer');
const config = require('./config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailAddress,
    pass: config.emailPassword
  }
});

function sendEmail(to, subject, htmlContent) {
  const mailOptions = {
    from: config.emailAddress,
    to,
    subject,
    html: htmlContent
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
