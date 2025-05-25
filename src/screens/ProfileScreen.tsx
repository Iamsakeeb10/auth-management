import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store/store';
import {getUserProfile} from '../services/api/profile';

const ProfileScreen = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {accessToken} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        if (!accessToken) return;

        const data = await getUserProfile(accessToken);
        console.log('Profile Data =>>', data);
        setProfile(data);
      } catch (err: any) {
        console.log('❌ Profile fetch error:', err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>No profile data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>ProfileScreen</Text>
      <Text>Email: {profile.email}</Text>
      <Text>Name: {profile.name}</Text>
      {/* Render other fields */}
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  heading: {fontSize: 20, fontWeight: 'bold', marginBottom: 10},
  errorText: {color: 'red', fontSize: 16},
});
