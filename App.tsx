import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {Provider, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, RootState, store} from './src/redux/store/store';

import AppStack from './src/navigation/AppStack';
import AuthStack from './src/navigation/AuthStack';

const Navigation = () => {
  // Access accessToken from redux state
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  // If accessToken exists, user is logged in -> show AppStack else AuthStack
  return (
    <NavigationContainer>
      {accessToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Navigation />
      </PersistGate>
    </Provider>
  );
};

export default App;
