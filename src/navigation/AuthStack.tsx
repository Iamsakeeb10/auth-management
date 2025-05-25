import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegistrationScreen';
import VerificationScreen from '../screens/VerificationScreen';
import {AuthStackParamList} from '../types/AuthStack.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Verification" component={VerificationScreen} />
  </Stack.Navigator>
);

export default AuthStack;
