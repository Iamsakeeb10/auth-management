// redux/store/store.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';
import authReducer from '../slices/authSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['accessToken', 'refreshToken', 'expiresIn'], // only these keys will be persisted
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    // other reducers
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // ignore non-serializable stuff from Redux Persist
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
