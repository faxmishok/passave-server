const sendTokenInCookie = (token, statusCode, res, optional) => {
  const options = {
    expires: new Date(Date.now() + 3600000),
    httpOnly: true,
  };

  const response = {
    success: true,
    message: 'Logged in!',
    optional,
  };

  return res.status(statusCode).cookie('token', token, options).json(response);
};

module.exports = sendTokenInCookie;
