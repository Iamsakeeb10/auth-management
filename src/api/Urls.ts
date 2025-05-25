const getApiHost = async () => {
  return 'https://dev23.finder.com.bd/api/v1';
};

// Function to generate URLs dynamically
const getUrls = async () => {
  const apiHost = await getApiHost();

  return {
    sendVerificationCode: `${apiHost}/users/verification-code`,
    registration: `${apiHost}/users/customers/registration`,
    login: `${apiHost}/users/login`,
  };
};

export default getUrls;
