import api from './api';

// Google OAuth Handler
export const handleGoogleLogin = async (token) => {
  try {
    // Decode the JWT token to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const response = await api.post('/auth/google', {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      profilePicture: payload.picture,
      token: token,
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Google login failed');
  }
};

// Facebook OAuth Handler
export const handleFacebookLogin = async (response) => {
  try {
    if (response.accessToken) {
      const facebookResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${response.accessToken}`
      );
      const userData = await facebookResponse.json();
      
      const apiResponse = await api.post('/auth/facebook', {
        facebookId: userData.id,
        email: userData.email,
        name: userData.name,
        profilePicture: userData.picture?.data?.url,
        token: response.accessToken,
      });
      
      return apiResponse.data;
    }
  } catch (error) {
    throw new Error(error.message || 'Facebook login failed');
  }
};

// Manual Google Sign-In (fallback if library unavailable)
export const openGoogleSignIn = () => {
  window.location.assign(`${import.meta.env.VITE_API_BASE || '/api'}/auth/google`);
};

// Manual Facebook Sign-In (fallback if library unavailable)
export const openFacebookSignIn = () => {
  window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${import.meta.env.VITE_FACEBOOK_APP_ID}&redirect_uri=${window.location.origin}/auth/facebook/callback&scope=public_profile,email`;
};
