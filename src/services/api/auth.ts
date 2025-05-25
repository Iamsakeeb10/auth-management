import axios from 'axios';
import axiosInstance from '../../api/axiosConfig';
import getUrls from '../../api/Urls';
import {encodedString} from '../../utils/utils';

export const sendVerificationCode = async (entity: string): Promise<any> => {
  const urls = await getUrls();

  const response = await axiosInstance.post(urls.sendVerificationCode, {
    verification_entity: entity,
  });

  return response.data;
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
  const urls = await getUrls();
  const registrationUrl = urls.registration;

  const encodedPassword = encodedString(password);

  const response = await axiosInstance.post(registrationUrl, {
    name,
    email,
    password: encodedPassword,
    verification_code: code,
  });

  return response.data?.message;
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<any> => {
  const urls = await getUrls();
  const loginUrl = urls.login;

  const encodedPassword = encodedString(password);

  const response = await axiosInstance.post(loginUrl, {
    user_id: email,
    password: encodedPassword,
  });

  return response.data;
};

export const getUserProfile = async (): Promise<any> => {
  const urls = await getUrls();
  const response = await axiosInstance.get(urls.profile);
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string) => {
  const urls = await getUrls();
  const response = await axios.post(urls.refreshToken, {
    refresh_token: refreshToken,
  });
  return response.data;
};
