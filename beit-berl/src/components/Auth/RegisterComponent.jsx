// src/components/auth/RegisterComponent.jsx
import React, { useState } from 'react';
import { registerWithEmailAndPassword } from '../../firebase/auth';

const RegisterComponent = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    try {
      await registerWithEmailAndPassword(email, password);
      // Registration successful, user will be automatically logged in
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register New Account</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleRegister}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      
      <p>
        Already have an account? 
        <button 
          className="switch-auth-mode" 
          onClick={onBackToLogin}
        >
          Back to Login
        </button>
      </p>
    </div>
  );
};

export default RegisterComponent;