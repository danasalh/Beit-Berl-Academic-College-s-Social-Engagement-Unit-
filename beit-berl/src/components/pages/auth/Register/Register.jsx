// components/pages/auth/Register.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import TermsDoc from '../../../PopUps/TermsDoc/TermsDoc'; // Import TermsDoc component


const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: '',
    orgId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: 'gray'
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [showTerms, setShowTerms] = useState(true);

  // Check if user came from Google auth
  useEffect(() => {
    if (location.state?.isGoogleAuth) {
      const { email, displayName } = location.state;
      let firstName = '', lastName = '';

      if (displayName) {
        const nameParts = displayName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      setFormData(prev => ({
        ...prev,
        email,
        firstName,
        lastName
      }));
    }
  }, []);

  // Check password strength when it changes
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    }
  }, [formData.password]);

  const checkPasswordStrength = (password) => {
    // Simple password strength calculator
    let score = 0;
    let message = '';
    let color = 'red';

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1;  // Has uppercase
    if (/[a-z]/.test(password)) score += 1;  // Has lowercase
    if (/[0-9]/.test(password)) score += 1;  // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1;  // Has special char

    // Set message based on score
    if (score < 3) {
      message = 'Weak password';
      color = 'red';
    } else if (score < 5) {
      message = 'Moderate password';
      color = 'orange';
    } else {
      message = 'Strong password';
      color = 'green';
    }

    setPasswordStrength({ score, message, color });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Trim whitespace for all fields except password fields
    if (name !== 'password' && name !== 'confirmPassword') {
      setFormData(prev => ({
        ...prev,
        [name]: value.trim()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    // Normalize email to lowercase first
    const normalizedEmail = formData.email.trim().toLowerCase();

    // Update the formData with normalized email
    setFormData(prev => ({
      ...prev,
      email: normalizedEmail
    }));

    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!normalizedEmail) return 'Email is required';

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) return 'Please enter a valid email address';

    if (!location.state?.isGoogleAuth) {
      const trimmedPassword = formData.password;
      if (!trimmedPassword) return 'Password is required';
      if (trimmedPassword.length < 6) return 'Password must be at least 6 characters';

      // Enhanced password validation
      if (passwordStrength.score < 3) return 'Please use a stronger password with uppercase, lowercase, numbers, or special characters';

      if (trimmedPassword !== formData.confirmPassword) return 'Passwords do not match';
    }
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    if (!formData.role) return 'Role is required';

    return null;
  };

  // Check if email already exists
  const checkEmailExists = async (email) => {
    try {
      const auth = getAuth();
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if email already exists
      const normalizedEmail = formData.email.trim().toLowerCase();
      const emailExists = await checkEmailExists(normalizedEmail);
      if (emailExists && !location.state?.isGoogleAuth) {
        setError('An account with this email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }

      const auth = getAuth();
      const db = getFirestore();
      let userId;

      // If coming from Google auth, use the existing UID
      if (location.state?.isGoogleAuth) {
        userId = location.state.uid;
      } else {
        console.log("Creating user with email:", normalizedEmail);
        console.log("Password length:", formData.password.length);

        // Regular email/password registration with error handling
        try {
          // Create user with email and password
          // NOTE: No trimming on password to ensure it matches exactly what user typed
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            formData.password // Using the password exactly as entered
          );

          userId = userCredential.user.uid;
          console.log("User created successfully with ID:", userId);

          // Update profile display name
          await updateProfile(auth.currentUser, {
            displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
          });
        } catch (authError) {
          console.error("Firebase auth error:", authError.code, authError.message);

          if (authError.code === 'auth/email-already-in-use') {
            setError('This email is already in use. Please use a different email or sign in.');
          } else if (authError.code === 'auth/weak-password') {
            setError('The password is too weak. Please use a stronger password.');
          } else if (authError.code === 'auth/invalid-email') {
            setError('The email address is not valid.');
          } else {
            setError(`Registration error: ${authError.message}`);
          }

          setLoading(false);
          return;
        }
      }

      // Generate unique ID using UUID
      const uniqueId = uuidv4();

      // Store user data in Firestore
      try {
        await setDoc(doc(db, 'users', userId), {
          id: uniqueId, // Use UUID instead of sequential ID
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: normalizedEmail, // Ensure email is lowercase in Firestore
          phoneNumber: formData.phoneNumber.trim(),
          role: formData.role,
          orgId: formData.orgId.trim() || null,
          status: 'waiting for approval',
          createdAt: new Date()
        });

        console.log("User data saved to Firestore");
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        setError(`Error saving user data: ${firestoreError.message}`);
        setLoading(false);
        return;
      }

      // Sign out user after successful registration since they need approval
      try {
        console.log("Signing out user after registration");
        await auth.signOut();
      } catch (signOutError) {
        console.error("Error signing out:", signOutError);
        // We can continue even if sign out fails
      }

      // Redirect to login with success message
      navigate('/login', {
        state: {
          registrationSuccess: true,
          message: 'Registration successful! Please wait for admin approval before logging in.'
        }
      });

    } catch (error) {
      console.error("Overall registration error:", error);
      setError(error.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Register a new account</h2>
          {location.state?.isGoogleAuth && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Complete your registration with Google
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="sr-only">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={location.state?.isGoogleAuth}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>

            {/* Only show password fields for non-Google auth */}
            {!location.state?.isGoogleAuth && (
              <>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  {formData.password && (
                    <div className="mt-1">
                      <div className="text-xs" style={{ color: passwordStrength.color }}>
                        {passwordStrength.message}
                      </div>
                      <div className="h-1 mt-1 w-full bg-gray-200 rounded-full">
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${Math.min(100, passwordStrength.score * 20)}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                  />
                  {formData.password && formData.confirmPassword && (
                    <div className="mt-1">
                      <div className={`text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
              />
            </div>

            <div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="orgRep">Organization Representative</option>
                <option value="vc">VC</option>
                <option value="volunteer">Volunteer</option>
              </select>

              {formData.role === 'volunteer' && showTerms && (
                <TermsDoc onClose={() => setShowTerms(false)} />
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;