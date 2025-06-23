// components/pages/auth/ForgotPassword/ForgotPassword.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitted, setSubmitted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowWidth <= 768;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      
      // Show success message and mark as submitted
      setSubmitted(true);
      setMessage({ 
        text: 'המייל נשלח בהצלחה! בדוק את הדוא"ל שלך לקבלת הוראות איפוס הסיסמה.', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        // For security reasons, don't reveal if user exists or not
        setSubmitted(true);
        setMessage({ 
          text: 'If an account with this email exists, we\'ve sent password reset instructions.', 
          type: 'success' 
        });
      } else {
        setMessage({ 
          text: 'There was a problem sending the reset email. Please try again later.', 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container" dir="rtl">
      <div className="forgot-password-form-container">
        <div className="forgot-password-header">
          <h2 className="forgot-password-title">איפוס סיסמה</h2>
          <p className="forgot-password-subtitle">
            יש להכניס את כתובת הדוא"ל שלך  <br/> ואנחנו נשלח לך קישור לאיפוס הסיסמה
          </p>
        </div>
        
        {message.text && (
          <div
            className={`alert-message ${message.type === 'error' ? 'error' : 'success'}`}
            role="alert"
          >
            <span>{message.text}</span>
          </div>
        )}
        
        {!submitted ? (
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="form-input-container">
              <label htmlFor="email" className="sr-only">כתובת דוא"ל</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? 'שולח...' : 'שלח קישור לאיפוס סיסמה'}
              </button>
            </div>
          </form>
        ) : (
          <div className="back-to-login-container">
            <Link to="/login" className="back-to-login-button">
              בחזרה להתחברות
            </Link>
          </div>
        )}
        
        {!isMobile && (
          <div className="desktop-footer">
            <p className="copyright-text">
              © {new Date().getFullYear()} Vtime. כל הזכויות שמורות.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;