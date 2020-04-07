import React, { Component } from 'react';

export default class Public extends Component {
  state = {
    message: ''
  };

  componentDidMount() {
    //Fetch is built into modern browsers. Add apolyfill if you need to support older browsers
    fetch('/public')
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Network response was not ok.');
        }
      })
      .then(jsonResponse => {
        this.setState({ message: jsonResponse.message });
      })
      .catch(error => {
        this.setState({ message: error.message });
      });
  }

  render() {
    return <p>{this.state.message}</p>;
  }
}

//in package.json we should add "proxy": "http://localhost:3001", for cross origin issues in local dev
//To secure an API call with auth0 we should tell auth0 about it (in auth0 dashboard)

//Use a separate Auth0 tenant for each environment, and set the API identifier to the API's URL in that environment.
//Example identifiers :
//QA : https://qa.myapi.com
//Prod: https://myapi.com
