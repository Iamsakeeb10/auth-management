// // api/axiosConfig.ts
// import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NetInfo from '@react-native-community/netinfo';
// import DeviceInfo from 'react-native-device-info';

// // API Configuration
// const API_CONFIG = {
//   BASE_URL: 'https://dev23.finder.com.bd/api/v1',
//   TIMEOUT: 60000,
//   ENDPOINTS: {
//     LOGIN: '/users/login',
//     SOCIAL_LOGIN: '/users/customers/login/platform',
//     SEND_VERIFICATION_CODE: '/users/verification-code',
//     REGISTRATION: '/users/customers/registration',
//     FORGET_PASSWORD: '/users/customers/forgot-password',
//     REFRESH_TOKEN: '/users/refresh-token',
//     LOGOUT: '/users/logout',
//     USER_PROFILE: '/users/customers/profile',
//   }
// };

// // Storage Keys
// const STORAGE_KEYS = {
//   ACCESS_TOKEN: 'access_token',
//   REFRESH_TOKEN: 'refresh_token',
//   USER_PROFILE: 'user_profile',
//   DEVICE_ID: 'device_id',
// };

// // Types
// interface AuthTokens {
//   accessToken: string;
//   refreshToken: string;
// }

// interface UserProfile {
//   id: string;
//   name: string;
//   email: string;
//   // Add other profile fields as needed
// }

// class ApiService {
//   private axiosInstance: AxiosInstance;
//   private isRefreshing = false;
//   private failedQueue: Array<{
//     resolve: (token: string | null) => void;
//     reject: (error: any) => void;
//   }> = [];

//   constructor() {
//     this.axiosInstance = axios.create({
//       baseURL: API_CONFIG.BASE_URL,
//       timeout: API_CONFIG.TIMEOUT,
//     });

//     this.setupInterceptors();
//   }

//   private setupInterceptors() {
//     // Request Interceptor
//     this.axiosInstance.interceptors.request.use(
//       async (config) => {
//         try {
//           // Check internet connectivity
//           const netInfo = await NetInfo.fetch();
//           if (!netInfo.isConnected) {
//             throw new Error('No internet connection');
//           }

//           // Add device ID header
//           const deviceId = await this.getDeviceId();
//           config.headers['Device-ID'] = deviceId;

//           // Add access token if available
//           const accessToken = await this.getAccessToken();
//           if (accessToken) {
//             config.headers.Authorization = `Bearer ${accessToken}`;
//           }

//           // Log request
//           this.logRequest(config);

//           return config;
//         } catch (error) {
//           this.logError('Request interceptor error:', error);
//           return Promise.reject(error);
//         }
//       },
//       (error) => {
//         this.logError('Request interceptor error:', error);
//         return Promise.reject(error);
//       }
//     );

//     // Response Interceptor
//     this.axiosInstance.interceptors.response.use(
//       (response) => {
//         this.logResponse(response);
//         return response;
//       },
//       async (error) => {
//         const originalRequest = error.config;

//         // Handle 401 Unauthorized (Token expired)
//         if (error.response?.status === 401 && !originalRequest._retry) {
//           if (this.isRefreshing) {
//             // If already refreshing, queue the request
//             return new Promise((resolve, reject) => {
//               this.failedQueue.push({ resolve, reject });
//             }).then((token) => {
//               if (token) {
//                 originalRequest.headers.Authorization = `Bearer ${token}`;
//                 return this.axiosInstance(originalRequest);
//               }
//               return Promise.reject(error);
//             });
//           }

//           originalRequest._retry = true;
//           this.isRefreshing = true;

//           try {
//             const newTokens = await this.refreshAuthToken();
//             if (newTokens) {
//               // Process queued requests
//               this.processQueue(null, newTokens.accessToken);

//               // Retry original request with new token
//               originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
//               return this.axiosInstance(originalRequest);
//             }
//           } catch (refreshError) {
//             this.processQueue(refreshError, null);
//             await this.handleAuthFailure();
//             return Promise.reject(refreshError);
//           } finally {
//             this.isRefreshing = false;
//           }
//         }

//         this.logError('Response interceptor error:', error);
//         return Promise.reject(error);
//       }
//     );
//   }

//   // Token Management
//   private async getAccessToken(): Promise<string | null> {
//     try {
//       return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
//     } catch (error) {
//       this.logError('Error getting access token:', error);
//       return null;
//     }
//   }

//   private async getRefreshToken(): Promise<string | null> {
//     try {
//       return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
//     } catch (error) {
//       this.logError('Error getting refresh token:', error);
//       return null;
//     }
//   }

//   private async saveTokens(tokens: AuthTokens): Promise<void> {
//     try {
//       await Promise.all([
//         AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
//         AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
//       ]);
//     } catch (error) {
//       this.logError('Error saving tokens:', error);
//     }
//   }

//   private async refreshAuthToken(): Promise<AuthTokens | null> {
//     try {
//       const refreshToken = await this.getRefreshToken();
//       if (!refreshToken) {
//         throw new Error('No refresh token available');
//       }

//       const response = await axios.post(
//         `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`,
//         { refreshToken }
//       );

//       const { accessToken, refreshToken: newRefreshToken } = response.data;
//       const tokens: AuthTokens = {
//         accessToken,
//         refreshToken: newRefreshToken || refreshToken,
//       };

//       await this.saveTokens(tokens);
//       return tokens;
//     } catch (error) {
//       this.logError('Token refresh failed:', error);
//       return null;
//     }
//   }

//   private processQueue(error: any, token: string | null) {
//     this.failedQueue.forEach(({ resolve, reject }) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(token);
//       }
//     });

//     this.failedQueue = [];
//   }

//   // Device Management
//   private async getDeviceId(): Promise<string> {
//     try {
//       let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
//       if (!deviceId) {
//         deviceId = await DeviceInfo.getUniqueId();
//         await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
//       }
//       return deviceId;
//     } catch (error) {
//       this.logError('Error getting device ID:', error);
//       return 'unknown-device';
//     }
//   }

//   // Authentication Methods
//   async login(email: string, password: string): Promise<any> {
//     try {
//       const response = await this.axiosInstance.post(API_CONFIG.ENDPOINTS.LOGIN, {
//         email,
//         password,
//       });

//       const { accessToken, refreshToken, user } = response.data;

//       // Save tokens and user profile
//       await this.saveTokens({ accessToken, refreshToken });
//       await this.saveUserProfile(user);

//       return response.data;
//     } catch (error) {
//       throw this.handleApiError(error);
//     }
//   }

//   async register(name: string, email: string, password: string): Promise<any> {
//     try {
//       const response = await this.axiosInstance.post(API_CONFIG.ENDPOINTS.REGISTRATION, {
//         name,
//         email,
//         password,
//       });

//       return response.data;
//     } catch (error) {
//       throw this.handleApiError(error);
//     }
//   }

//   async socialLogin(platform: string, token: string): Promise<any> {
//     try {
//       const response = await this.axiosInstance.post(API_CONFIG.ENDPOINTS.SOCIAL_LOGIN, {
//         platform,
//         token,
//       });

//       const { accessToken, refreshToken, user } = response.data;

//       // Save tokens and user profile
//       await this.saveTokens({ accessToken, refreshToken });
//       await this.saveUserProfile(user);

//       return response.data;
//     } catch (error) {
//       throw this.handleApiError(error);
//     }
//   }

//   async logout(): Promise<void> {
//     try {
//       // Call logout endpoint
//       await this.axiosInstance.post(API_CONFIG.ENDPOINTS.LOGOUT);
//     } catch (error) {
//       this.logError('Logout API call failed:', error);
//     } finally {
//       // Clear local storage regardless of API call result
//       await this.clearAuthData();
//     }
//   }

//   // Profile Management
//   async getUserProfile(): Promise<UserProfile | null> {
//     try {
//       const response = await this.axiosInstance.get(API_CONFIG.ENDPOINTS.USER_PROFILE);
//       const profile = response.data;

//       // Update cached profile
//       await this.saveUserProfile(profile);

//       return profile;
//     } catch (error) {
//       this.logError('Error fetching user profile:', error);

//       // Return cached profile if API call fails
//       return await this.getCachedUserProfile();
//     }
//   }

//   private async saveUserProfile(profile: UserProfile): Promise<void> {
//     try {
//       await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
//     } catch (error) {
//       this.logError('Error saving user profile:', error);
//     }
//   }

//   private async getCachedUserProfile(): Promise<UserProfile | null> {
//     try {
//       const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
//       return profile ? JSON.parse(profile) : null;
//     } catch (error) {
//       this.logError('Error getting cached user profile:', error);
//       return null;
//     }
//   }

//   // Utility Methods
//   async isAuthenticated(): Promise<boolean> {
//     const accessToken = await this.getAccessToken();
//     return !!accessToken;
//   }

//   private async handleAuthFailure(): Promise<void> {
//     await this.clearAuthData();
//     // You can emit an event or navigate to login screen here
//     // EventEmitter.emit('AUTH_FAILURE');
//   }

//   private async clearAuthData(): Promise<void> {
//     try {
//       await AsyncStorage.multiRemove([
//         STORAGE_KEYS.ACCESS_TOKEN,
//         STORAGE_KEYS.REFRESH_TOKEN,
//         STORAGE_KEYS.USER_PROFILE,
//       ]);
//     } catch (error) {
//       this.logError('Error clearing auth data:', error);
//     }
//   }

//   private handleApiError(error: any): Error {
//     if (error.response) {
//       // Server responded with error status
//       const message = error.response.data?.message || 'An error occurred';
//       return new Error(message);
//     } else if (error.request) {
//       // Request was made but no response received
//       return new Error('Network error. Please check your connection.');
//     } else {
//       // Something else happened
//       return new Error(error.message || 'An unexpected error occurred');
//     }
//   }

//   // Logging Methods
//   private logRequest(config: AxiosRequestConfig) {
//     if (__DEV__) {
//       console.log('🚀 API Request:', {
//         method: config.method?.toUpperCase(),
//         url: config.url,
//         headers: config.headers,
//         data: config.data,
//       });
//     }
//   }

//   private logResponse(response: AxiosResponse) {
//     if (__DEV__) {
//       console.log('✅ API Response:', {
//         status: response.status,
//         url: response.config.url,
//         data: response.data,
//       });
//     }
//   }

//   private logError(message: string, error: any) {
//     if (__DEV__) {
//       console.error('❌', message, error);
//     }
//   }

//   // Expose axios instance for custom requests
//   get api() {
//     return this.axiosInstance;
//   }
// }

// // Create singleton instance
// const apiService = new ApiService();

// export default apiService;
// export { API_CONFIG, STORAGE_KEYS };
// export type { AuthTokens, UserProfile };
