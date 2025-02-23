const sendTokenInCookie = (token, statusCode, res, responseOverrides = {}) => {
  const options = {
    expires: new Date(Date.now() + 3600000),
    httpOnly: true,
  };

  // Set default response values.
  const defaultResponse = {
    success: true,
    message: 'Logged in!',
    token: token,
  };

  // Merge defaults with any overrides provided.
  const response = { ...defaultResponse, ...responseOverrides };

  return res.status(statusCode).cookie('token', token, options).json(response);
};

module.exports = sendTokenInCookie;
