/* customized http proxy for local development only.
   see https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually
   We do this so that custom XHR headers are proxied correctly (like X-CSRFToken).
*/

/* eslint-disable @typescript-eslint/no-var-requires */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/**',
    createProxyMiddleware({
      target: 'https://sandbox.ui.dol.gov:4430',
      secure: false, // self-signed certs
      changeOrigin: true,
    })
  );
};
