const https = require('https');

const domains = ['meet.ffmuc.net', 'jitsi.riot.im', 'meet.infomaniak.com', 'jitsi.linux.it', '8x8.vc', 'alpha.jitsi.net'];

domains.forEach(domain => {
  https.get(`https://${domain}/`, res => {
    const csp = res.headers['content-security-policy'];
    const fa = csp && csp.includes('frame-ancestors') ? csp.match(/frame-ancestors[^;]*/)[0] : 'NO frame-ancestors';
    console.log(`${domain} CSP: ${fa}`);
  }).on('error', err => {
    console.log(`${domain} failed: ${err.message}`);
  });
});
