import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {logout, setTokens} from '../redux/slices/authSlice';
import {store} from '../redux/store/store';
import {refreshAccessToken} from '../services/api/auth';

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Queue to handle multiple requests while token is being refreshed
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// Process all queued requests after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      console.log('[processQueue] Rejecting promise due to error:', error);
      prom.reject(error);
    } else {
      console.log(
        '[processQueue] Resolving promise with token:',
        token ? 'Present' : 'Not present',
      );
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Check if the error indicates token invalidity
const tokenInvalidResponse = (error: AxiosError): boolean => {
  return error.response?.status === 401;
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: '', // Set your base URL or use full URLs
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - Set authorization header
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    console.log('🔄 [Request Interceptor] Auth state:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!state.auth.refreshToken,
      url: config.url,
    });

    // Set authorization header if token exists
    if (accessToken) {
      setAuthorizationHeader(config, accessToken);
    }

    // Add device ID or other headers if needed
    await setDeviceIdToHeader(config);

    return config;
  },
  error => {
    console.log('[Request Interceptor] Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(
      '[Response Interceptor] Success:',
      response.status,
      response.config.url,
    );
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    console.log('🔄 [Response Interceptor] Error occurred:', {
      status: error.response?.status,
      url: originalRequest.url,
      retry: originalRequest._retry,
    });

    // Check if this is a token invalid response and we haven't retried yet
    if (tokenInvalidResponse(error) && !originalRequest._retry) {
      const authState = store.getState().auth;

      console.log(
        '[Response Interceptor] Token invalid, checking refresh capability:',
        {
          hasAccessToken: !!authState.accessToken,
          hasRefreshToken: !!authState.refreshToken,
        },
      );

      if (authState.accessToken && authState.refreshToken) {
        return await refreshAndRedoRequest(error, originalRequest);
      } else {
        console.log(
          '[Response Interceptor] No valid tokens available, logging out',
        );
        store.dispatch(logout());
        return Promise.reject(error);
      }
    }

    // Log rejection reason
    console.log(
      '[Response Interceptor] Rejecting error without token refresh:',
      {
        status: error.response?.status,
        alreadyRetried: originalRequest._retry,
        hasRefreshToken: !!store.getState().auth.refreshToken,
      },
    );

    return Promise.reject(error);
  },
);

// Set authorization header helper
const setAuthorizationHeader = (config: AxiosRequestConfig, token: string) => {
  if (!config.headers) {
    config.headers = {};
  }
  config.headers.Authorization = `Bearer ${token}`;
};

// Set device ID header (similar to Flutter implementation)
const setDeviceIdToHeader = async (config: AxiosRequestConfig) => {
  try {
    // You can implement device ID logic here if needed
    // For web, you might use a UUID stored in localStorage
    const deviceId = getDeviceId();
    if (deviceId && config.headers) {
      config.headers['device-id'] = deviceId;
    }
  } catch (error) {
    console.log('[setDeviceIdToHeader] Error:', error);
  }
};

// Get device ID (implement as needed for your platform)
const getDeviceId = (): string | null => {
  // For web implementation, you might generate and store a UUID
  // This is just a placeholder - implement according to your needs
  try {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  } catch {
    return null;
  }
};

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Refresh token and redo the original request
const refreshAndRedoRequest = async (
  error: AxiosError,
  originalRequest: CustomAxiosRequestConfig,
): Promise<AxiosResponse> => {
  originalRequest._retry = true;

  console.log('[refreshAndRedoRequest] Token expired, attempting refresh...');

  // If already refreshing, queue the request
  if (isRefreshing) {
    console.log(
      '[refreshAndRedoRequest] Already refreshing, queueing request...',
    );
    return new Promise((resolve, reject) => {
      failedQueue.push({resolve, reject});
    })
      .then(token => {
        console.log('[Queue] Retrying request with new token');
        setAuthorizationHeader(originalRequest, token as string);
        return axiosInstance(originalRequest);
      })
      .catch(err => {
        console.log('[Queue] Failed to retry request:', err);
        return Promise.reject(err);
      });
  }

  isRefreshing = true;

  try {
    // Update token data
    await updateTokenData();

    const newAccessToken = store.getState().auth.accessToken;

    if (!newAccessToken) {
      throw new Error('Failed to get new access token');
    }

    // Set new token to the original request
    setAuthorizationHeader(originalRequest, newAccessToken);

    // Process queued requests
    processQueue(null, newAccessToken);

    console.log(
      '[refreshAndRedoRequest] Retrying original request with new token',
    );

    // Handle FormData if needed (similar to Flutter implementation)
    if (originalRequest.data instanceof FormData) {
      console.log('[refreshAndRedoRequest] Handling FormData request');
      // FormData handling is already preserved in axios
    }

    // Retry the original request
    return await axiosInstance(originalRequest);
  } catch (refreshError) {
    console.log('[refreshAndRedoRequest] Token refresh failed:', refreshError);

    // Process queue with error
    processQueue(refreshError, null);

    // Logout user on refresh failure
    console.log(
      '[refreshAndRedoRequest] Logging out user due to refresh failure',
    );
    store.dispatch(logout());

    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

// Update token data (similar to Flutter's updateTokenData)
const updateTokenData = async (): Promise<void> => {
  const authState = store.getState().auth;
  const currentRefreshToken = authState.refreshToken;

  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  console.log('[updateTokenData] Refreshing access token...');

  try {
    // Create new axios instance to avoid interceptor conflicts
    const refreshAxios = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await refreshAccessToken(currentRefreshToken);

    // Validate response
    if (!response.access_token) {
      throw new Error('Invalid token refresh response');
    }

    console.log('[updateTokenData] Token refresh successful:', {
      hasAccessToken: !!response.access_token,
      hasRefreshToken: !!response.refresh_token,
      expiresIn: response.expires_in,
    });

    // Calculate expiry date
    const tokenExpiryDate = new Date();
    tokenExpiryDate.setSeconds(
      tokenExpiryDate.getSeconds() + (response.expires_in || 900),
    );

    // Update tokens in store
    store.dispatch(
      setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token || currentRefreshToken,
        expiresIn: response.expires_in || 900,
      }),
    );

    // Update default headers for future requests
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${response.access_token}`;

    console.log('[updateTokenData] Tokens updated successfully');
  } catch (error) {
    console.log('[updateTokenData] Token refresh failed:', error);

    // On refresh failure, logout user (similar to Flutter implementation)
    store.dispatch(logout());
    throw error;
  }
};

// Utility function to check if status code is valid
const validStatusCode = (response: AxiosResponse): boolean => {
  return response.status >= 200 && response.status < 300;
};

export default axiosInstance;
