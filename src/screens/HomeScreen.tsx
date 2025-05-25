import {NativeStackScreenProps} from '@react-navigation/native-stack';
import axios from 'axios';
import React, {useEffect} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import getUrls from '../api/Urls';
import {logout} from '../redux/slices/authSlice';
import {AppDispatch, RootState} from '../redux/store/store';
import {AppStackParamList} from '../types/AppStack.type';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();

  const {refreshToken} = useSelector((state: RootState) => state.auth);

  // Add this in your component after successful login for testing
  // This is just for debugging - remove after finding the root cause

  useEffect(() => {
    refreshAccessToken();
  }, []);

  const refreshAccessToken = async () => {
    const urls = await getUrls();
    try {
      const response = await axios.post(urls.refreshToken, {
        refresh_token: refreshToken,
      });
      if (response.data) {
        console.log('Refresh Token =>>', response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Call this after login to test if refresh logic works
  // testTokenRefresh();

  return (
    <View style={styles.container}>
      <Text>HomeScreen</Text>

      <View style={styles.spacing} />
      <Button
        title="Log Out"
        onPress={() => {
          dispatch(logout());
        }}
      />

      <View style={styles.spacing} />
      <Button
        title="Go to Profile"
        onPress={() => {
          navigation.navigate('Profile');
        }}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  spacing: {height: 10},
});
