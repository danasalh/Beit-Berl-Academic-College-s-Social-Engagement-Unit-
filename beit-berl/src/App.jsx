import React, { useState } from "react";
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import SuccessfulRegistration from "./components/PopUps/SuccessfulRegistration/SuccessfulRegistration";
import Settings from "./components/PopUps/Settings/Settings";
import AreYouSure from "./components/PopUps/AreYouSure/AreYouSure";
import TermsDoc from "./components/PopUps/TermsDoc/TermsDoc";

const App = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAreYouSure, setShowAreYouSure] = useState(false);
  const [showTermsDoc, setShowTermsDoc] = useState(false);

  const handleShowPopup = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleShowAreYouSure = () => {
    setShowAreYouSure(true);
  };

  const handleConfirm = () => {
    setShowAreYouSure(false);
    alert("Confirmed!");
  };

  const handleCancel = () => {
    setShowAreYouSure(false);
  };

  const handleShowTermsDoc = () => {
    setShowTermsDoc(true);
  };

  const handleCloseTermsDoc = () => {
    setShowTermsDoc(false);
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Welcome to the App</h1>
      <div className="card">
        <button onClick={handleShowPopup}>Show Successful Registration</button>
        {showPopup && <SuccessfulRegistration onClose={handleClosePopup} />}
        
        <button onClick={handleShowSettings}>Show Settings</button>
        {showSettings && <Settings onClose={handleCloseSettings} />}
        
        <button onClick={handleShowAreYouSure}>Show Are You Sure</button>
        {showAreYouSure && (
          <AreYouSure onConfirm={handleConfirm} onCancel={handleCancel} />
        )}
        
        <button onClick={handleShowTermsDoc}>Show Terms Document</button>
        {showTermsDoc && <TermsDoc onClose={handleCloseTermsDoc} />}
        
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
};

export default App;
