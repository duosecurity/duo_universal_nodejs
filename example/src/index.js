require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { json, urlencoded } = require('body-parser');
const nunjucks = require('nunjucks');
const config = require('./config');
const { Client } = require('duo_universal');

const startApp = async () => {
  // Express
  const app = express();

  // Express middlewares - request parsers / session / static files / templates
  app.use(json());
  app.use(urlencoded({ extended: false }));
  app.use(session({ secret: 'super-secret-phrase', resave: false, saveUninitialized: true }));
  app.use(express.static('public', { index: false }));
  nunjucks.configure(`${__dirname}/views`, { autoescape: true, express: app });

  // Duo client
  const { clientId, clientSecret, apiHost, redirectUrl } = config;
  const duoClient = new Client({ clientId, clientSecret, apiHost, redirectUrl });

  // Routes
  app.get('/', (req, res) => {
    res.render('index.html', { message: 'This is a demo' });
  });

  app.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.render('index.html', { message: 'Missing username or password' });
      return;
    }

    try {
      await duoClient.healthCheck();

      const state = duoClient.generateState();
      req.session.duo = { state, username };
      const url = duoClient.createAuthUrl(username, state);

      res.redirect(302, url);
    } catch (err) {
      console.error(err);
      res.render('index.html', { message: err.message });
    }
  });

  app.get('/redirect', async (req, res) => {
    const { query, session } = req;
    const { duo_code, state } = query;

    if (!duo_code || typeof duo_code !== 'string') {
      res.render('index.html', { message: `Missing 'duo_code' query parameters` });
      return;
    }

    if (!state || typeof state !== 'string') {
      res.render('index.html', { message: `Missing 'state' query parameters` });
      return;
    }

    const savedState = session.duo?.state;
    const savedUsername = session.duo?.username;

    req.session.destroy();

    if (
      !savedState ||
      typeof savedState !== 'string' ||
      !savedUsername ||
      typeof savedUsername !== 'string'
    ) {
      res.render('index.html', { message: 'Missing user session information' });
      return;
    }

    if (state !== savedState) {
      res.render('index.html', { message: 'Duo state does not match saved state' });
      return;
    }

    try {
      const decodedToken = await duoClient.exchangeAuthorizationCodeFor2FAResult(
        duo_code,
        savedUsername
      );
      res.render('success.html', { message: JSON.stringify(decodedToken, null, '\t') });
    } catch (err) {
      console.error(err);

      res.render('index.html', {
        message: 'Error decoding Duo result. Confirm device clock is correct.',
      });
    }
  });

  // Start listening
  app.listen(config.port, config.url, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`App is listening on port ${config.port}!`);
  });
};

startApp().catch((err) => {
  console.error(err);
});
