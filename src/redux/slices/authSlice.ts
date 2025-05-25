import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {loginUser} from '../../services/api/auth';

// Define the auth state type
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  loading: false,
  error: null,
};

// Add this to your login thunk in authSlice.ts
export const login = createAsyncThunk(
  'auth/login',
  async (payload: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const response = await loginUser(payload);
      console.log(
        '[Thunk] Complete login response:',
        JSON.stringify(response, null, 2),
      );
      console.log('[Thunk] Access token:', response.access_token);
      console.log('[Thunk] Refresh token:', response.refresh_token);
      console.log('[Thunk] Expires in:', response.expires_in);

      // Verify all required fields are present
      if (!response.access_token) {
        throw new Error('No access token in response');
      }
      if (!response.refresh_token) {
        throw new Error('No refresh token in response');
      }

      return response;
    } catch (error: any) {
      console.log('[Thunk] Login error:', error);
      return rejectWithValue(error);
    }
  },
);

// Add this to your authSlice.ts reducers
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      console.log('[Auth Slice] Logging out, clearing tokens');
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresIn = null;
      state.error = null;
    },
    setTokens(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>,
    ) {
      console.log('[Auth Slice] Setting tokens:', {
        accessToken: action.payload.accessToken ? 'Present' : 'Missing',
        refreshToken: action.payload.refreshToken ? 'Present' : 'Missing',
        expiresIn: action.payload.expiresIn,
      });
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresIn = action.payload.expiresIn;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('[Auth Slice] Login fulfilled with payload:', {
          access_token: action.payload.access_token ? 'Present' : 'Missing',
          refresh_token: action.payload.refresh_token ? 'Present' : 'Missing',
          expires_in: action.payload.expires_in,
        });

        state.loading = false;
        state.error = null;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.expiresIn = action.payload.expires_in;

        // Log final state
        console.log('[Auth Slice] Final state after login:', {
          accessToken: state.accessToken ? 'Present' : 'Missing',
          refreshToken: state.refreshToken ? 'Present' : 'Missing',
          expiresIn: state.expiresIn,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {logout, setTokens} = authSlice.actions;

export default authSlice.reducer;
