import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import Home from './Home';
import Profile from './Profile';
import Nav from './Nav';
import Auth from './Auth/Auth';
import Callback from './Callback';
import Public from './Public';
import Private from './Private';
import Courses from './Courses';
import PrivateRoute from './PrivateRoute';
import AuthContext from './AuthContext';

class App extends Component {
  constructor(props) {
    super(props);
    //Alternatively, you could instantiate the auth object inside Auth.js and export the instance.
    //This would enforce its usage as a singleton. Then you could import it into the components that need it

    this.state = {
      //React-Router history - in index.js we add it
      auth: new Auth(this.props.history),
      tokenRenewalComplete: false
    };
  }

  componentDidMount() {
    this.state.auth.renewToken(() =>
      this.setState({ tokenRenewalComplete: true })
    );
  }

  // Note : We can put the auth object in state if we want. It's not necessary for our usage in this app, so we made it an instance variable.

  // this.auth passes down evey child component when the app is getting larger with many nested components it can be tedious,
  // this problem is called prop drilling
  // Two popular solutions:
  // 1. Redux
  // 2. Context (built-in react and safe to use React 16.3 (Context API))

  // With React's context, we can eliminate the need for passing the same prop down to every component.
  // Your app can have multiple contexts It's recommended to plave related data in the same context.

  // PrivateRoute component + context:
  // 1. Eliminated redundancy
  // 2. Increased readability (more declarative)
  // 3. Enforced consistency

  render() {
    const { auth } = this.state;

    // Show loading message until the token renwal check is completed. 
    // We cannot show the app whether the user is logged in or out
    if (!this.state.tokenRenewalComplete) return 'Loading...';

    return (
      // Now all AuthContext's child components can access the "auth" object by importing AuthContext.Consumer
      // and we no longer have to pass auth objects over the components (PrivateRoute because we declare Consuer in it) below (auth={auth})
      <AuthContext.Provider value={auth}>
        <Nav auth={auth} />
        <div className="body">
          <Route
            path="/"
            exact
            render={props => <Home auth={auth} {...props} />}
          />
          {/* We'll use context to eliminate the need to pass the auth objecy down to each route */}
          <Route
            path="/callback"
            render={props => <Callback auth={auth} {...props} />}
          />

          {/* The profile route should require the user to be authenticated. */}
          <PrivateRoute path="/profile" component={Profile} />
          <Route path="/public" component={Public} />
          <PrivateRoute path="/private" component={Private} />

          {/* // Theese checks (in Private Component) are merely for user experience, not security.
          // It's the server's job to validate the user is authorized when an API call is made, do not trust the use validate it in server too */}
          <PrivateRoute
            path="/courses"
            component={Courses}
            scopes={['read:courses']}
          />
        </div>
      </AuthContext.Provider>
    );
  }
}

export default App;

// in .env file REACT_APP_...
//create-react-app automatically exposes environment variables that start with REACT_APP to our app.

//REACT_APP_AUTH0_CALLBACK=http://localhost:3000/callback
//this url is going to get called by Auth0 after it finishes authenticating the user

// "scripts": {
//   // start server and client same time npm run all(npm package or concurrently)
//   "start" : "run-p start:client start:server",
//   "start:client": "react-scripts start",
//   "start:server" : "node server.js",
//   "build": "react-scripts build",
//   "test": "react-scripts test",
//   "eject": "react-scripts eject"
// },

// Use a separate Auth0 tenant for each environment, and set the API identifier to the API's URL in that environment.
// Example identifiers :
// QA : https://qa.myapi.com
// Prod: https://myapi.com

// Role is a custom claim. Custom claims are not added to access tokens by default.
// To do this we should add an empty role in the auth0 rules screen
// check id_token and access_token from the https://jwt.io/

// Authorization Options

// -- Session Cookie
// Simple, secure (when using http only cookies over https)
// - No authorization data included (handles authentication not authorization)
// - Performance (db calls for user rights on every call)

// -- JWT with Scopes (edit:user)
// Scopes were designed to specify what an application is allowed to do with a third party on a user's behalf
// You can assign different scopes to different users upon  login using Auth0's rules.
// No need to check DB for auth data
// - you can end up with a bloated JWT with dozens of scopes that you need to send for every request.
// do not use large complex authorization systems!

// -- JWT with Roles (role:admin)
// Roles group users by permissions. You grant different permissions to each role.
// Simple, scalable, fast (no need to call db for user rights)
// Avoids JWT bloat. A since single role encapsulates a long list of permissions.
// Single role encapsulates many scopes

// * Use scopes when interacting with third parties.
// * Use roles for handling your app's permissions.
