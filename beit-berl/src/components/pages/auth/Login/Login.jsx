import { useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc
} from 'firebase/firestore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();

  // Registration success message from registration page
  const registrationSuccess = location.state?.registrationSuccess || false;
  const registrationMessage = location.state?.message || '';

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check user approval status
  const checkUserApprovalStatus = async (uid) => {
    try {
      // Get user document from Firestore
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check if status is approved
        if (userData.status === 'approved') {
          return true;
        } else {
          // User exists but not approved
          alert('הבקשה שלך לא אושרה עדיין. יש לפנות למנהל.')
          setError(`Your account is currently ${userData.status || 'waiting for approval'}. Please wait for administrator approval.`);
          return false;
        }
      } else {
        // User document doesn't exist in Firestore
        setError('User profile not found. Please contact support.');
        return false;
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setError('Error verifying your account status: ' + error.message);
      return false;
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user is approved
      const isApproved = await checkUserApprovalStatus(user.uid);

      if (isApproved) {
        // User is approved, allow navigation
        // Auth state will be handled by App component
      } else {
        // User is not approved, sign out
        await auth.signOut();
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else {
        setError('Error logging in: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      // Check if the user is new (ie. not registered in our db)
      if (result._tokenResponse?.isNewUser) {
        // Redirect to registration to complete profile
        navigate('/register', {
          state: {
            isGoogleAuth: true,
            email: user.email,
            displayName: user.displayName,
            uid: user.uid
          }
        });
        return;
      }

      // Check if existing user is approved
      const isApproved = await checkUserApprovalStatus(user.uid);

      if (!isApproved) {
        // User is not approved, sign out
        await auth.signOut();
      }
      // If user is approved, App component will handle redirect

    } catch (error) {
      console.error('Google Sign In error:', error);
      setError('Error signing in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {registrationSuccess && (
        <div className="success-alert" role="alert">
          <span>{registrationMessage}</span>
        </div>
      )}

      <div className="login-form-container">
        <img src="/logo.svg" alt="Logo" className="app-logo" />
        <div className="login-header">
          <h1 className="login-title">התחברות לחשבון</h1>
        </div>
        {error && (
          <div className="error-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">כתובת דוא"ל</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">שכחתי סיסמה?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>

        <div className="divider">
          <span>או</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="google-button"
        >
          <svg viewBox="0 0 48 48" className="google-icon">
            <g>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </g>
          </svg>
          להמשיך עם Google
        </button>

        <div className="signup-link">
          <p>
            אין לך חשבון?{' '}
            <Link to="/register">יצירת חשבון חדש</Link>
          </p>
        </div>
      </div>

      <div className="login-footer">
        <p>© 2025 Vtime. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;