import axios from 'axios';
import {logout, setTokens} from '../redux/slices/authSlice';
import {store} from '../redux/store/store';
import {refreshAccessToken} from '../services/api/auth';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      console.log('[processQueue] Rejecting promise due to error:', error);
      prom.reject(error);
    } else {
      console.log('[processQueue] Resolving promise with token:', token);
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: '', // Optional if using full URLs from getUrls
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async config => {
    const state = store.getState();
    const token = state.auth.accessToken;

    console.log('🔁 Interceptor tokens:', store.getState().auth);

    console.log(
      '[Request Interceptor] Current access token:',
      token ? 'Present' : 'Not present',
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    console.log('[Request Interceptor] Error:', error);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  response => {
    console.log(
      '[Response Interceptor] Success:',
      response.status,
      response.config.url,
    );
    return response;
  },
  async error => {
    const originalRequest = error.config;

    console.log('🔁Error Interceptor tokens:', store.getState().auth);

    console.log(
      '[Response Interceptor] Error response status:',
      error.response?.status,
    );
    console.log('[Response Interceptor] URL:', originalRequest?.url);
    console.log('[Response Interceptor] Retry flag:', originalRequest?._retry);

    // Get current auth state for debugging
    const authState = store.getState().auth;
    console.log('[Response Interceptor] Auth state:', {
      hasAccessToken: !!authState.accessToken,
      hasRefreshToken: !!authState.refreshToken,
      refreshToken: authState.refreshToken ? 'Present' : 'Not present',
    });

    // Ensure retry flag is initialized
    if (typeof originalRequest._retry === 'undefined') {
      originalRequest._retry = false;
    }

    // Check each condition separately for better debugging
    const is401 = error.response?.status === 401;
    const notRetried = !originalRequest._retry;
    const hasRefreshToken = !!store.getState().auth.refreshToken;

    console.log('[Response Interceptor] Condition check:', {
      is401,
      notRetried,
      hasRefreshToken,
      shouldRefresh: is401 && notRetried && hasRefreshToken,
    });

    if (is401 && notRetried && hasRefreshToken) {
      originalRequest._retry = true;
      console.log(
        '[Response Interceptor] Token expired, attempting refresh...',
      );

      if (isRefreshing) {
        console.log(
          '[Response Interceptor] Token is refreshing, queueing request...',
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            console.log(
              '[Queue] Retrying request with new token:',
              token ? 'Present' : 'Not present',
            );
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            console.log('[Queue] Failed to retry request:', err);
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const {refreshToken} = store.getState().auth;
        console.log(
          '[Response Interceptor] Calling refreshAccessToken with refreshToken:',
          refreshToken ? 'Present' : 'Not present',
        );

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const newTokens = await refreshAccessToken(refreshToken);

        console.log('[Response Interceptor] Token refresh successful:', {
          hasAccessToken: !!newTokens.access_token,
          hasRefreshToken: !!newTokens.refresh_token,
          expiresIn: newTokens.expires_in,
        });

        console.log('New Token =>>', newTokens);

        // Update tokens in store
        store.dispatch(
          setTokens({
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token || refreshToken,
            expiresIn: newTokens.expires_in,
          }),
        );

        // Update default headers for future requests
        axiosInstance.defaults.headers.Authorization = `Bearer ${newTokens.access_token}`;

        // Update the original request headers
        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;

        // Process any queued requests
        processQueue(null, newTokens.access_token);

        console.log(
          '[Response Interceptor] Retrying original request with new token...',
        );

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log(
          '[Response Interceptor] Token refresh failed:',
          refreshError,
        );

        // Process queue with error
        processQueue(refreshError, null);

        // Clear tokens and logout user
        console.log('Logged out =>>');
        store.dispatch(logout());

        // Return the refresh error instead of the original 401
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // If we reach here, either:
    // 1. It's not a 401 error
    // 2. We already retried
    // 3. No refresh token available
    console.log(
      '[Response Interceptor] Rejecting error without token refresh.',
      {
        status: error.response?.status,
        alreadyRetried: originalRequest._retry,
        hasRefreshToken: !!store.getState().auth.refreshToken,
      },
    );

    return Promise.reject(error);
  },
);

export default axiosInstance;
