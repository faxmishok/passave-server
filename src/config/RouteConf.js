const routerConf = (express, app) => {
  app.use('/auth', require('../routes/auth'));
  app.use('/profile', require('../routes/profile'));
  app.use('/save', require('../routes/save'));
  app.use('identification', require('../routes/identification'));
  app.use('/card', require('../routes/card'));
};

module.exports = routerConf;
