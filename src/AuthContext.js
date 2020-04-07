import React from 'react';

const AuthContext = new React.createContext();

export default AuthContext;

/** Steps to configure context:
 * 1. Declare context
 * 2. Declare provider (provides data / funcs) - provides info
 * 3. Declare consumer (consumes data / funcs) - consumes info
 */

// Typically the provider is declared near the app's entry point so all child components
// can consume the data and functions it provides
// our app needs auth object in entire app