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
import SuccessfulRegistration from '../../../PopUps/SuccessfulRegistration/SuccessfulRegistration'; // Import SuccessfulRegistration component
import './register.css'; // Import the CSS file

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
  const [phoneError, setPhoneError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showTerms, setShowTerms] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);


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
      message = 'סיסמה חלשה';
      color = 'red';
    } else if (score < 5) {
      message = 'סיסמה בינונית';
      color = 'orange';
    } else {
      message = 'סיסמה חזקה';
      color = 'green';
    }

    setPasswordStrength({ score, message, color });
  };

  // Validate phone number format
  const validatePhoneNumber = (phoneNumber) => {
    // Remove any non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Basic check: must contain only digits and have a reasonable length (7-15 digits)
    const isValid = /^\d+$/.test(digitsOnly) && digitsOnly.length >= 7 && digitsOnly.length <= 15;

    if (!isValid) {
      setPhoneError('בבקשה להכניס מספר טלפון תקין (ספרות בלבד)');
      return false;
    } else {
      setPhoneError('');
      return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For phone number, validate as user types
    if (name === 'phoneNumber') {
      // Allow only digits and some formatting characters as they type
      const formattedValue = value.replace(/[^\d\s\-+()]/g, '');

      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));

      // Validate phone only if there's a value
      if (formattedValue) {
        validatePhoneNumber(formattedValue);
      } else {
        setPhoneError('');
      }
    }
    // Trim whitespace for all fields except password fields
    else if (name !== 'password' && name !== 'confirmPassword') {
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

    if (!formData.firstName.trim()) return 'יש להכניס שם פרטי';
    if (!formData.lastName.trim()) return 'יש להכניס שם משפחה';
    if (!normalizedEmail) return 'כתובת דוא"ל נדרשת';

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) return 'יש להכניס כתובת דוא"ל תקינה';

    if (!location.state?.isGoogleAuth) {
      const trimmedPassword = formData.password;
      // Enhanced password validation
      if (!trimmedPassword) return 'סיסמה נדרשת';
      if (trimmedPassword.length < 6) return 'הסיסמה חייבת להיות באורך של לפחות 6 תווים';
      if (passwordStrength.score < 3) return 'הסיסמה חלשה מדי. יש להשתמש בסיסמה חזקה יותר';
      if (passwordStrength.score < 5) return 'הסיסמה בינונית. יש להשתמש בסיסמה חזקה יותר';
      if (passwordStrength.color !== 'green') return 'הסיסמה חלשה מדי. יש להשתמש בסיסמה חזקה יותר';
      if (trimmedPassword.length > 20) return 'הסיסמה חייבת להיות באורך של עד 20 תווים';
      if (trimmedPassword !== formData.confirmPassword) return 'הסיסמאות אינן תואמות';
    }

    if (!formData.phoneNumber.trim()) return 'מספר טלפון נדרש';

    // Validate phone number before submission
    if (!validatePhoneNumber(formData.phoneNumber)) return 'יש להכניס מספר טלפון תקין (ספרות בלבד)';

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

      // Clean phone number to store only digits
      const cleanedPhoneNumber = formData.phoneNumber.replace(/\D/g, '');

      // Store user data in Firestore
      try {
        await setDoc(doc(db, 'users', userId), {
          id: uniqueId, // Use UUID instead of sequential ID
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: normalizedEmail, // Ensure email is lowercase in Firestore
          phoneNumber: cleanedPhoneNumber, // Store clean phone number
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
      setShowSuccessPopup(true);  // Show your popup

      // Wait 3 seconds then navigate to login
      setTimeout(() => {
        navigate('/login');
      }, 8000);


    } catch (error) {
      console.error("Overall registration error:", error);
      setError(error.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-container register-form-spacing">
        <div>
          <h2 className="register-title">יצירת פרופיל חדש</h2>
          {location.state?.isGoogleAuth && (
            <p className="register-subtitle">
              להמשיך עם גוגל
            </p>
          )}
        </div>

        {error && (
          <div className="error-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form className="register-form-spacing" onSubmit={handleSubmit}>
          <div>
            <div className="form-grid">
              <div>
                <label htmlFor="firstName" className="sr-only">שם פרטי</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field rounded-top"
                  placeholder="שם פרטי"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">שם משפחה</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field rounded-top"
                  placeholder="שם משפחה"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">כתובת דוא"ל</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={location.state?.isGoogleAuth}
                className="input-field"
                placeholder="כתובת דוא&quot;ל"
              />
            </div>

            {/* Only show password fields for non-Google auth */}
            {!location.state?.isGoogleAuth && (
              <>
                <div>
                  <label htmlFor="password" className="sr-only">סיסמה</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="סיסמה"
                  />
                  {formData.password && (
                    <div className="password-strength">
                      <div style={{ color: passwordStrength.color }}>
                        {passwordStrength.message}
                      </div>
                      <div className="strength-meter">
                        <div
                          className="strength-meter-fill"
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
                  <label htmlFor="confirmPassword" className="sr-only">אימות סיסמה</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="אימות סיסמה"
                  />
                  {formData.password && formData.confirmPassword && (
                    <div className="password-strength">
                      <div style={{ color: formData.password === formData.confirmPassword ? 'green' : 'red' }}>
                        {formData.password === formData.confirmPassword ? 'סיסמאות תואמות' : 'הסיסמאות אינן תואמות'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="phoneNumber" className="sr-only">מספר טלפון</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`input-field ${phoneError ? 'input-error' : ''}`}
                placeholder="מספר טלפון (ספרות בלבד)"
              />
              {phoneError && (
                <div className="error-message">
                  {phoneError}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="role" className="sr-only">התפקיד שלי הוא </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">אפשרויות בחירה</option>
                <option value="admin">admin</option>
                <option value="orgRep">orgRep</option>
                <option value="vc">VC</option>
                <option value="volunteer">Volunteer</option>
              </select>

              {formData.role === 'volunteer' && showTerms && (
                <TermsDoc onClose={() => setShowTerms(false)} />
              )}
            </div>

            {/* Optional Organization ID field when role is orgRep */}
            {formData.role === 'orgRep' && (
              <div>
                <label htmlFor="orgId" className="sr-only"> (אופציונאלי)מספר מזהה של הארגון שלי</label>
                <input
                  id="orgId"
                  name="orgId"
                  type="text"
                  value={formData.orgId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="מספר מזהה של הארגון שלי (אופציונאלי)"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"

              className="submit-button"
              disabled={loading || (formData.phoneNumber && phoneError)}>
              {loading ? 'מעדכן את הפרטים...' : 'הרשמה'}
            </button>
          </div>
          {showSuccessPopup && <SuccessfulRegistration />}

          <div className="sign-in-link">
            <Link to="/login" className="link">
              יש לך כבר חשבון? התחברות
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;