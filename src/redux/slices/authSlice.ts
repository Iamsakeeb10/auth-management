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

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (payload: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const response = await loginUser(payload);
      console.log('[Thunk] login success:', response); // log success
      // response should include tokens and expiry data
      return response;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
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
        state.loading = false;
        state.error = null;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.expiresIn = action.payload.expires_in;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {logout, setTokens} = authSlice.actions;

export default authSlice.reducer;
