const express = require('express');
require('dotenv').config();

const jwt = require('express-jwt'); // Validate JWT and set req.user
const jwksRsa = require('jwks-rsa'); // Retrieve RSA keys from a JSON Web Key set (JWKS) endpoint (Auth0 exposes under our domain)
const checkScope = require('express-jwt-authz'); // Validate JWT scopes

var jwtCheck = jwt({
  // Dynamically provide a signing key based on the kid in the header
  // and the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true, // cache the signing key
    rateLimit: true,
    jwksRequestsPerMinute: 5, // prevent attackers from requesting more than 5 per minute
    jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,

  // This must match the algorithm selected in the Auth0 dashboard under your app's advanced settings under the OAuth tab
  algorithms: ['RS256']
});

const app = express();

app.get('/public', function(req, res) {
  res.json({
    message: 'Hello from a public API!'
  });
});

//jwtCheck validate the request (jwtCheck before receive a response)
app.get('/private', jwtCheck, function(req, res) {
  res.json({
    message: 'Hello from a private API!'
  });
});

//Middleware function - returns a function
function checkRole(role) {
  return function(req, res, next) {
    const assignedRoles = req.user['http://localhost:3000/roles'];
    if (Array.isArray(assignedRoles) && assignedRoles.includes(role)) {
      return next();
    } else {
      return res.status(401).send('Insufficient role');
    }
  };
}

// In the real world, it would read the sub (the subscriber ID) from the access token and use it to query the database for the author's courses.
// This will return array of courses as long as the user has the ['read:courses'] scope
app.get('/course', jwtCheck, checkScope(['read:courses']), function(req, res) {
  res.json({
    courses: [
      { id: 1, title: 'Building Apps with React and Redux' },
      { id: 2, title: 'Creating Reusable React Components' }
    ]
  });
});

app.get('/admin', jwtCheck, checkRole('admin'), function(req, res) {
  res.json({
    message: 'Hello from an admin API!'
  });
});

app.listen(3001);

console.log('API server listening on ' + process.env.REACT_APP_AUTH0_AUDIENCE);
