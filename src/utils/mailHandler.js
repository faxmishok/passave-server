const fs = require('fs');
const path = require('path');
const ejs = require('ejs'); // Make sure to install ejs with: npm install ejs
const ErrorResponse = require('./errorResponse');

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

      const transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL,
          clientId: process.env.EMAILER_CLIENT_ID,
          clientSecret: process.env.EMAILER_CLIENT_SECRET,
          refreshToken: process.env.EMAILER_REFRESH_TOKEN,
        },
      });

      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error(err);
      throw new ErrorResponse('Error occurred while sending email', 500);
    }
  },
};
