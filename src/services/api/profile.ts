// import axios from 'axios';
// import getUrls from '../../api/Urls';
// import {logout, setTokens} from '../../redux/slices/authSlice';
// import {AppDispatch, RootState} from '../../redux/store/store';
// import {refreshAccessToken} from './auth';

// export const getUserProfileWithRefresh = async (
//   dispatch: AppDispatch,
//   getState: () => RootState,
// ) => {
//   const state = getState();
//   const {accessToken, refreshToken, expiresIn} = state.auth;

//   try {
//     const urls = await getUrls();

//     // Optional: Add logic here to check if token is *expired* (e.g., based on timestamp)
//     // For now, assume we always try with current access token first

//     const profileUrl = urls.profile;

//     try {
//       // Try using current access token
//       const response = await axios.get(profileUrl, {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       return response.data;
//     } catch (err: any) {
//       if (err.response?.status === 401 && refreshToken) {
//         // Token is expired, try refreshing
//         const refreshResponse = await refreshAccessToken(refreshToken);

//         // Update tokens in Redux
//         dispatch(
//           setTokens({
//             accessToken: refreshResponse.access_token,
//             refreshToken: refreshResponse.refresh_token,
//             expiresIn: refreshResponse.expires_in,
//           }),
//         );

//         // Retry the profile call with the new access token
//         const retryResponse = await axios.get(profileUrl, {
//           headers: {
//             Authorization: `Bearer ${refreshResponse.access_token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         return retryResponse.data;
//       } else {
//         throw err;
//       }
//     }
//   } catch (err) {
//     console.error('[getUserProfileWithRefresh] Error:', err);
//     dispatch(logout()); // Log user out if refresh fails or some other error
//     throw err;
//   }
// };
