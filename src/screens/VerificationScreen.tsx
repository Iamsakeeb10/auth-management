import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import React, {useRef, useState} from 'react';
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {verifyAndRegistration} from '../services/api/auth';
import {AuthStackParamList} from '../types/AuthStack.types';

type VerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'Verification'
>;

type VerificationScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Verification'
>;

type Props = {
  route: VerificationScreenRouteProp;
  navigation: VerificationScreenNavigationProp;
};

const VerificationScreen = ({route, navigation}: Props) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<TextInput[]>([]);

  const {form} = route?.params;

  const handleChange = (text: string, index: number) => {
    if (/^\d*$/.test(text)) {
      // only digits allowed
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // focus next input if available and current input is filled
      if (text.length === 1 && index < 5) {
        inputsRef.current[index + 1].focus();
      }

      // if backspace (empty text) and index > 0, focus previous
      if (text.length === 0 && index > 0) {
        inputsRef.current[index - 1].focus();
      }
    }
  };
  44;

  const handleSubmit = async () => {
    const enteredOtp = otp.join('');

    if (enteredOtp.length === 6) {
      try {
        const code = parseInt(enteredOtp);
        const responseMessage = await verifyAndRegistration({
          name: form.name,
          email: form.email,
          password: form.password,
          code,
        });

        Alert.alert(
          'Success',
          responseMessage ?? 'Registration successful!',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login'),
            },
          ],
          {cancelable: false},
        );

        setOtp(['', '', '', '', '', '']); // Clear fields
        inputsRef.current[0].focus(); // Focus first input again
      } catch (error: any) {
        Alert.alert('Error', error?.message ?? 'Something went wrong.');
      }
    } else {
      Alert.alert('Invalid Code', 'Please enter a 6-digit OTP');
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter 6-digit OTP</Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={text => handleChange(text, index)}
              value={digit}
              ref={(el: any) => (inputsRef.current[index] = el!)}
              autoFocus={index === 0}
              returnKeyType="done"
            />
          ))}
        </View>

        <Text style={styles.submitBtn} onPress={handleSubmit}>
          Verify OTP
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default VerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 30,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  input: {
    borderBottomWidth: 2,
    borderColor: '#333',
    width: 40,
    height: 50,
    fontSize: 22,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 40,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    color: '#fff',
    fontWeight: '700',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
