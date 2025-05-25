import axios from 'axios';
import getUrls from '../../api/Urls';
import {encodedString} from '../../utils/utils';

export const sendVerificationCode = async (entity: string): Promise<any> => {
  const urls = await getUrls();

  try {
    const response = await axios.post(
      urls.sendVerificationCode,
      {verification_entity: entity},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Verification failed');
    } else {
      throw new Error('Unknown error occurred');
    }
  }
};

export const verifyAndRegistration = async ({
  name,
  email,
  password,
  code,
}: {
  name: string;
  email: string;
  password: string;
  code: number;
}): Promise<string | undefined> => {
  try {
    const urls = await getUrls();
    const registrationUrl = urls.registration;

    const encodedPassword = encodedString(password);

    const response = await axios.post(registrationUrl, {
      name,
      email,
      password: encodedPassword,
      verification_code: code,
    });

    if (response && response.data) {
      return response.data.message;
    }

    throw new Error('Something went wrong.');
  } catch (error: any) {
    console.log('❌ Registration error:', error);
    console.log('📦 Error response:', error?.response);
    console.log(
      '💬 Error message:',
      error?.response?.data?.message || error?.message,
    );

    throw (
      error?.response?.data?.message || error?.message || 'Something went wrong'
    );
  }
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<any> => {
  try {
    const urls = await getUrls();
    const loginUrl = urls.login;

    const encodedPassword = encodedString(password);

    const response = await axios.post(
      loginUrl,
      {
        user_id: email,
        password: encodedPassword,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response && response.data) {
      return response.data;
    }

    throw new Error('Login failed.');
  } catch (error: any) {
    console.log('❌ Login error:', error);
    console.log('📦 Error response:', error?.response);
    console.log(
      '💬 Error message:',
      error?.response?.data?.message || error?.message,
    );

    throw error?.response?.data?.message || error?.message || 'Login failed';
  }
};
