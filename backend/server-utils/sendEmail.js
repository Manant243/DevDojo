const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  const msg = {
    to: options.to,
    from: process.env.SENDER_EMAIL,
    subject: options.subject,
    html: options.html,
  };
  
  try {
    await sgMail.send(msg);
  } 
  catch (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }
};

module.exports = sendEmail;
