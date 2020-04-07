import React, { Component } from 'react';

export default class Courses extends Component {
  state = {
    courses: []
  };

  componentDidMount() {
    fetch('/course', {
      headers: {
        Authorization: `Bearer ${this.props.auth.getAccessToken()}`
      }
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Network response was not ok.');
        }
      })
      .then(jsonResponse => {
        this.setState({ courses: jsonResponse.courses });
      })
      .catch(error => {
        this.setState({ message: error.message });
      });

    fetch('/admin', {
      headers: {
        Authorization: `Bearer ${this.props.auth.getAccessToken()}`
      }
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Network response was not ok.');
        }
      })
      .then(jsonResponse => {
        console.log(jsonResponse);
      })
      .catch(error => {
        this.setState({ message: error.message });
      });
  }

  render() {
    return (
      <ul>
        {this.state.courses.map(course => {
          return <li key={course.id}>{course.title}</li>;
        })}
      </ul>
    );
  }
}

// in package.json we should add "proxy": "http://localhost:3001", for cross origin issues in local dev
// To secure an API call with auth0 we should tell auth0 about it (in auth0 dashboard)
