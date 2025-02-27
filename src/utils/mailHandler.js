require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const ErrorResponse = require('./errorResponse');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const getTransporter = async () => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const { token } = await oAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: token,
    },
  });
};

const setOptions = (mailTo, mailType, options) => {
  let templatePath;
  let subject;

  switch (mailType) {
    case 'REGISTRATION':
      subject = `Welcome ${options.username}!`;
      templatePath = path.join(__dirname, '../templates/registration.html');
      break;

    case 'USER_PASSWORD_RESET':
      subject = 'Reset Password';
      templatePath = path.join(__dirname, '../templates/reset.html'); // create similar template for reset if needed
      break;

    default:
      throw new ErrorResponse('Invalid mail type', 400);
  }

  // Read the HTML template from file
  let templateHtml = fs.readFileSync(templatePath, 'utf8');

  // Render the HTML template using EJS, injecting options like username and token
  const renderedHtml = ejs.render(templateHtml, options);

  return {
    from: `Passave <${process.env.EMAIL}>`,
    to: mailTo,
    subject,
    html: renderedHtml,
  };
};

module.exports = {
  sendMail: async ({ mailTo, mailType, options }) => {
    try {
      const mailOptions = setOptions(mailTo, mailType, options);

      const transporter = await getTransporter();

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${mailTo}`);
    } catch (err) {
      console.error(err);
      throw new ErrorResponse('Error occurred while sending email', 500);
    }
  },
};
