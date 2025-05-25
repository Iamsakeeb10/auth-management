import axios from 'axios';
import getUrls from '../../api/Urls';

export const getUserProfile = async (token: string) => {
  const urls = await getUrls();
  const profileUrl = urls.profile;

  const response = await axios.get(profileUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
