import auth0 from 'auth0-js';

const REDIRECT_ON_LOGIN = 'redirect_on_login';

// Stored outside class since private

// Without silent auth we lost our session when open or close browser tab! session is lost when the open new browser tab
// To prevent that we defined renewToken() method at the bottom of this file and call it in the App.js to check user session on Auth0 server

//eslint-disable-next-line
let _idToken = null;
let _accessToken = null;
let _scopes = null;
let _expiresAt = null;

export default class Auth {
  constructor(history) {
    //We'll pass React Router's history in so Auth can perform redirects
    this.history = history;
    this.userProfile = null;
    this.requestedScopes = 'openid profile email read:courses';
    this.auth0 = new auth0.WebAuth({
      domain: process.env.REACT_APP_AUTH0_DOMAIN,
      clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
      redirectUri: process.env.REACT_APP_AUTH0_CALLBACK_URL,
      audience: process.env.REACT_APP_AUTH0_AUDIENCE, //our local API (also defined in Auth0 dashboard)
      responseType: 'token id_token',
      //This says(id_token) : Give us a JWT token to authenticate the user when they login
      //This says(token) : Give us an access token so the user can make API calls
      scope: this.requestedScopes
      //we want to use openid for authentication
      //(email)when the user signs up, they'll be presented with a consent screen so they can consent to us using this data
      //We'll get:
      /**
       * iss Issuer
       * sub Subject
       * aud Audience
       * exp Expiration Time
       * nbf Not Before
       * iat Issued At
       */
    });
  }

  login = () => {
    localStorage.setItem(
      REDIRECT_ON_LOGIN,
      JSON.stringify(this.history.location)
    );
    this.auth0.authorize(); //This will redirect the browser to the Auth0 login page.
  };

  handleAuthentication = () => {
    //get data and parse and write session
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
        const redirectLocation =
          localStorage.getItem(REDIRECT_ON_LOGIN) === 'undefined'
            ? '/'
            : JSON.parse(localStorage.getItem(REDIRECT_ON_LOGIN));
        this.history.push(redirectLocation); //redirect to redirectLocation
      } else if (err) {
        this.history.push('/');
        alert(`Error: ${err.error}. Check the console for further details`);
        console.log(err);
      }
      localStorage.removeItem(REDIRECT_ON_LOGIN);
    });
  };

  setSession = authResult => {
    //set the time that the access token will expire

    /**Steps to calculate
     * 1. authResult.expiresIn contains expiration in seconds
     * 2. Multiply by 1000 to convert into milliseconds
     * 3. Add current Unix epoch time
     * This gives us the Unix epoch time when the token will expire
     */
    _expiresAt = authResult.expiresIn * 1000 + new Date().getTime();

    // If there is a value on the `scope` param from the authResult,
    // use it to set scopes in the session for the user. Otherwise
    // use the scopes as requested. If no scopes were requested, set it to nothing
    _scopes = authResult.scope || this.requestedScopes || '';

    //This will change with in memory with silent auth
    // No longer need with in memory variables
    // localStorage.setItem('access_token', authResult.accessToken); //We can use jwt-decode package in npm to read the user's data out of the Id Token JWT
    // localStorage.setItem('id_token', authResult.idToken);
    // localStorage.setItem('expires_at', expiresAt);

    _accessToken = authResult.accessToken;
    _idToken = authResult.idToken;

    // We are stroring expires_at and scopes in localStorage just for convenience
    // (so we don't have to parse the JWT on the client to use this data for UI-related logic).
    // The server validates these claims
    // No longer need with in memory variable _scopes
    // localStorage.setItem('scopes', JSON.stringify(scopes));

    // Our API calls will receive the access_token and parse it to determine the user's authorization

    // This will keep user logged in while the tab is open until their Auth0 session actually expires.
    this.scheduleTokenRenewal();
  };

  isAuthenticated() {
    // No longer need with in memory variables
    // const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    // return new Date().getTime() < expiresAt;

    return new Date().getTime() < _expiresAt;
  }

  logout = () => {
    //This is a "soft" logout. This is useful for single-sign on scenarios, so your session stays valid for other apps using this Auth0 tenant.
    // No longer need with in memory variables
    // localStorage.removeItem('access_token');
    // localStorage.removeItem('id_token');
    // localStorage.removeItem('expires_at');
    // localStorage.removeItem('scopes');
    // this.userProfile = null;

    // this.history.push('/');
    //Auth0 checks the session cookie on your Auth0 domain to determine if your are logged in.

    // Logout from auth0 server
    this.auth0.logout({
      clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
      returnTo: 'http://localhost:3000'
    });
  };

  getAccessToken = () => {
    // No longer need with in memory variables
    // const accessToken = localStorage.getItem('access_token');

    if (!_accessToken) {
      throw new Error('No access token found.');
    }

    return _accessToken;
  };

  getProfile = cb => {
    if (this.userProfile) {
      return cb(this.userProfile); //cb is provided callback funtion
    }

    //This endpoint is part of the OAuth standart. It's common on every identity provider.
    //Alternatively, we could get the user's profile from ID token via jwt-decode (on npm)
    this.auth0.client.userInfo(this.getAccessToken(), (err, profile) => {
      if (profile) {
        this.userProfile = profile;
      }

      cb(profile, err);
    });
  };

  userHasScopes(scopes) {
    // No longer need with in memory variables
    // const grantedScopes = (
    //   JSON.parse(localStorage.getItem('scopes')) || ''
    // ).split(' ');

    const grantedScopes = (_scopes || '').split(' ');

    return scopes.every(scope => grantedScopes.includes(scope));
  }

  // We need to call this before the app is displayed so we know if the user is logged in
  // So now then the app loads, it will receive new tokens ia an iframe behind the scenes if the user session is still active on the Auth0 server.
  // set http://localhost:3000/ as Allowed Web Origins on auth0 application settings
  renewToken(cb) {
    this.auth0.checkSession({}, (err, result) => {
      if (err) {
        console.log(`Error : ${err.error} - ${err.error_description}.`);
      } else {
        this.setSession(result);
      }

      if (cb) {
        cb(err, result);
      }
    });
  }

  // This will call renewToken when our token expires, we should call this after the user is authenticated - setSession()
  scheduleTokenRenewal() {
    const delay = _expiresAt - Date.now();
    if (delay > 0) setTimeout(() => this.renewToken(), delay);
  }
}

// Perf tweak: We could write a value to localStorage when the user logs in and clear it when the log out to avoid needlessly making this call (renewToken and "Loading...")

// Caveats :
// 1. This approach relies on setting third-party cookies via an iframe, so if you disabled third-party cookies in your browser, this won't work.
// Safari blocks third-party cookies by default. To avoid third-party cookie issues, it's recommended to set up a custom domain with Auth0.

// 2. If we try to log in with google it fails. Silent auth doesn't work with idendtity providrs by default. You need to configure your own keys with each provider
// Configure it in auth0 management

//In Auth0 system select application settings and set the Allowed Logout URLs (http://localhost:3000)
