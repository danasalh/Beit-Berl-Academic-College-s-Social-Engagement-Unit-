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
  setDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { useNotifications } from '../../../../Contexts/NotificationsContext';  
import TermsDoc from '../../../PopUps/TermsDoc/TermsDoc';
import SuccessfulRegistration from '../../../PopUps/SuccessfulRegistration/SuccessfulRegistration';
import './register.css';

const roleTranslations = {
  admin: 'מנהל מערכת',
  orgRep: 'נציג ארגון',
  vc: 'רכז מתנדבים',
  volunteer: 'מתנדב'
};

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
  const [showTerms, setShowTerms] = useState(false);
  const [termsApproved, setTermsApproved] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Get notifications context
  const { createNotification } = useNotifications();

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

  // Show TermsDoc when role is set to volunteer
  useEffect(() => {
    if (formData.role === 'volunteer') {
      setShowTerms(true);
      setTermsApproved(false);
    } else {
      setShowTerms(false);
      setTermsApproved(true);
    }
  }, [formData.role]);

  // Check password strength when it changes
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    }
  }, [formData.password]);

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = 'red';

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

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

  const validatePhoneNumber = (phoneNumber) => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const isValid = /^\d+$/.test(digitsOnly) && digitsOnly.length >= 10 && digitsOnly.length <= 10;

    if (!isValid) {
      setPhoneError('בבקשה להכניס מספר טלפון תקין (10 ספרות בלבד)');
      return false;
    } else {
      setPhoneError('');
      return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const formattedValue = value.replace(/[^\d\s\-+()]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));

      if (formattedValue) {
        validatePhoneNumber(formattedValue);
      } else {
        setPhoneError('');
      }
    } else if (name !== 'password' && name !== 'confirmPassword') {
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
    const normalizedEmail = formData.email.trim().toLowerCase();

    setFormData(prev => ({
      ...prev,
      email: normalizedEmail
    }));

    if (!formData.firstName.trim()) return 'יש להכניס שם פרטי';
    if (!formData.lastName.trim()) return 'יש להכניס שם משפחה';
    if (!normalizedEmail) return 'כתובת דוא"ל נדרשת';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) return 'יש להכניס כתובת דוא"ל תקינה';

    if (!location.state?.isGoogleAuth) {
      const trimmedPassword = formData.password;
      if (!trimmedPassword) return 'סיסמה נדרשת';
      if (trimmedPassword.length < 6) return 'הסיסמה חייבת להיות באורך של לפחות 6 תווים';
      if (passwordStrength.score < 3) return 'הסיסמה חלשה מדי. יש להשתמש בסיסמה חזקה יותר';
      if (passwordStrength.color !== 'green') return 'הסיסמה חלשה מדי. יש להשתמש בסיסמה חזקה יותר';
      if (trimmedPassword.length > 20) return 'הסיסמה חייבת להיות באורך של עד 20 תווים';
      if (trimmedPassword !== formData.confirmPassword) return 'הסיסמאות אינן תואמות';
    }

    if (!formData.phoneNumber.trim()) return 'מספר טלפון נדרש';
    if (!validatePhoneNumber(formData.phoneNumber)) return 'יש להכניס מספר טלפון תקין (ספרות בלבד)';
    if (!formData.role) return 'Role is required';

    if (formData.role === 'volunteer' && !termsApproved) {
      return 'יש לאשר את כל התנאים לפני ההרשמה';
    }

    return null;
  };

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

  // Function to get all admin users
  const getAdminUsers = async () => {
    try {
      const db = getFirestore();
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'admin'));
      const adminSnapshot = await getDocs(adminQuery);
      
      return adminSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  };

  // Function to create notifications for all admins
  const createAdminNotifications = async (newUser) => {
    try {
      const adminUsers = await getAdminUsers();
      console.log('Found admin users:', adminUsers.length);

      if (adminUsers.length === 0) {
        console.warn('No admin users found to notify');
        return;
      }

      // Create notifications for each admin
      const notificationPromises = adminUsers.map(async (admin) => {
        const notificationData = {
          type: 'approval-needed',
          title: 'בקשת אישור משתמש חדש',
          content: `משתמש חדש ${newUser.firstName} ${newUser.lastName} (${newUser.email}) נרשם למערכת בתפקיד ${roleTranslations[newUser.role]} וממתין לאישור.`,
          receiverId: String(admin.id),
          relatedUserId: String(newUser.id),
          date: new Date(),
          read: false
        };

        try {
          const notificationId = await createNotification(notificationData);
          console.log(`✅ Notification created for admin ${admin.id}:`, notificationId);
          return notificationId;
        } catch (error) {
          console.error(`❌ Error creating notification for admin ${admin.id}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(notificationPromises);
      console.log(`✅ Successfully created ${results.length} notifications for admins`);
      return results;
    } catch (error) {
      console.error('❌ Error creating admin notifications:', error);
      throw error;
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

      if (location.state?.isGoogleAuth) {
        userId = location.state.uid;
      } else {
        console.log("Creating user with email:", normalizedEmail);
        console.log("Password length:", formData.password.length);

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            formData.password
          );

          userId = userCredential.user.uid;
          console.log("User created successfully with ID:", userId);

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

      const cleanedPhoneNumber = formData.phoneNumber.replace(/\D/g, '');

      // User data to be saved
      const userData = {
        id: userId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: normalizedEmail,
        phoneNumber: cleanedPhoneNumber,
        role: formData.role,
        orgId: formData.orgId.trim() || null,
        status: 'waiting for approval',
        createdAt: new Date()
      };

      try {
        await setDoc(doc(db, 'users', userId), userData);
        console.log("User data saved to Firestore with ID:", userId);

        // Create notifications for all admins about the new user registration
        try {
          await createAdminNotifications(userData);
          console.log("✅ Admin notifications created successfully");
        } catch (notificationError) {
          console.error("❌ Error creating admin notifications:", notificationError);
          // Don't fail the registration if notification creation fails
        }

      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        setError(`Error saving user data: ${firestoreError.message}`);
        setLoading(false);
        return;
      }

      try {
        console.log("Signing out user after registration");
        await auth.signOut();
      } catch (signOutError) {
        console.error("Error signing out:", signOutError);
      }

      setShowSuccessPopup(true);

      setTimeout(() => {
        navigate('/login');
      }, 8000);

    } catch (error) {
      console.error("Overall registration error:", error);
      setError(error.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleTermsApproved = () => {
    setTermsApproved(true);
    setShowTerms(false);
  };

  const handleTermsClose = () => {
    setShowTerms(false);
  };

  const isRegistrationDisabled = loading || 
                               (formData.phoneNumber && phoneError) || 
                               (formData.role === 'volunteer' && !termsApproved);

  return (
    <div className="register-container">
      <div className="register-form-container register-form-spacing">
        <div>
          <h2 className="register-title">יצירת חשבון חדש</h2>
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
                {Object.entries(roleTranslations).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {formData.role === 'volunteer' && !termsApproved && (
                <div className="terms-status">
                  <a 
                    type="button"
                    className="view-terms-button"
                    onClick={() => setShowTerms(true)}
                  >
                    צפייה בתנאי השימוש 	&nbsp;
                  </a>
                  <span className="terms-note">יש לאשר את תנאי השימוש כדי להירשם</span>
                </div>
              )}
              
              {formData.role === 'volunteer' && termsApproved && (
                <div className="terms-approved">
                  ✓ תנאי השימוש אושרו
                </div>
              )}
              
              {showTerms && (
                <TermsDoc 
                  onClose={handleTermsClose} 
                  onApprove={handleTermsApproved}
                />
              )}
            </div>

            {formData.role === 'orgRep' && (
              <div>
                <label htmlFor="orgId" className="sr-only">מספר מזהה של הארגון שלי</label>
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
              className={`submit-button ${isRegistrationDisabled ? 'disabled' : ''}`}
              disabled={isRegistrationDisabled}
            >
              {loading ? 'מעדכן את הפרטים...' : 'הרשמה'}
            </button>
            
            {(formData.role === 'volunteer') && !termsApproved && (
              <div className="registration-note">
                {formData.role === 'volunteer' 
                  ? 'יש לאשר את תנאי השימוש כדי להשלים את ההרשמה' 
                  : 'יש למלא את שאלון ההתאמה כדי להשלים את ההרשמה'}
              </div>
            )}
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