require('dotenv').config();

module.exports = {
  emailAddress: process.env.EMAIL_ADDRESS,
  emailPassword: process.env.EMAIL_PASSWORD,
  proxy: process.env.VINTED_API_HTTPS_PROXY || null
};