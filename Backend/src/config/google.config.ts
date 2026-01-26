export default () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    issuer: process.env.GOOGLE_ISSUER,
    sessionExpiresIn: 10*60*60,
  },
});