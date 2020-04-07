import React, { Component } from 'react';

export default class Profile extends Component {
  state = {
    profile: null,
    error: ''
  };

  componentDidMount() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    //In auth.js we define getProfile method with callback function parameter (cb)
    this.props.auth.getProfile((profile, error) => {
      this.setState({ profile, error }); //profile : profile, error : error
    });
  }

  render() {
    const { profile } = this.state;
    if (!profile) return null;

    return (
      <>
        <h1>Profile</h1>
        <p>{profile.nickname}</p>
        <img
          style={{ maxWidth: 50, maxHeight: 50 }}
          src={profile.picture}
          alt="profile pic"
        />
        {/* Display the profile object as a string of JSON, indented by 2 spaces */}
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </>
    );
  }
}
