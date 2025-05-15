// components/pages/auth/ForgotPassword/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitted, setSubmitted] = useState(false);

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
        text: 'Password reset email sent! Please check your inbox (and spam folder) for instructions.', 
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>
        
        {message.text && (
          <div
            className={`${
              message.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'
            } px-4 py-3 rounded relative border`}
            role="alert"
          >
            <span className="block sm:inline">{message.text}</span>
          </div>
        )}
        
        {!submitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 text-center">
            <Link to="/login" className="inline-block mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Return to Login
            </Link>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ForgotPassword;