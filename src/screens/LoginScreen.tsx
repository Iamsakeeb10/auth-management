import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {login} from '../redux/slices/authSlice';
import {AppDispatch, RootState} from '../redux/store/store'; // Make sure RootState is correctly typed
import {AuthStackParamList} from '../types/AuthStack.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [form, setForm] = useState({
    email: 'test2@gmail.com',
    password: '12345678',
  });

  const dispatch = useDispatch<AppDispatch>();

  // Select loading and error from auth slice
  const {loading, error} = useSelector((state: RootState) => state.auth);

  // Optional: Show alert if error changes
  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
    }
  }, [error]);

  const handleChange = (field: string, value: string) => {
    setForm({...form, [field]: value});
  };

  const handleLogin = () => {
    const {email, password} = form;

    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    dispatch(login({email, password}));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={form.email}
        onChangeText={text => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        value={form.password}
        onChangeText={text => handleChange('password', text)}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{margin: 20}} />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}

      {/* Show error below the button (optional) */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, justifyContent: 'center'},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
  error: {color: 'red', marginTop: 10, textAlign: 'center'},
  link: {marginTop: 20, color: 'blue', textAlign: 'center'},
});
