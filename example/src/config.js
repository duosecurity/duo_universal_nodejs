module.exports = {
  port: 3000,
  url: 'localhost',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  apiHost: process.env.API_HOST || '',
  redirectUrl: process.env.REDIRECT_URL || 'http://localhost:3000/redirect',
};
