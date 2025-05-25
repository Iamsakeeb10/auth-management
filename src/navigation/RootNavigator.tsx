import {NavigationContainer} from '@react-navigation/native';

import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store/store';
import AppStack from './AppStack';
import AuthStack from './AuthStack';

const RootNavigator = () => {
  const {accessToken} = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      {accessToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;
