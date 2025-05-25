// Define the form type (adjust fields and types as per your actual form)
type FormType = {
  name: string;
  email: string;
  password: string;
  // add other fields if any
};

// Update AuthStackParamList to accept form params in Verification
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Verification: {form: FormType}; // now Verification expects a form object
};
