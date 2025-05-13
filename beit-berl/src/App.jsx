import React, { useState } from "react";
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import SuccessfulRegistration from "./components/PopUps/SuccessfulRegistration/SuccessfulRegistration";
import Settings from "./components/PopUps/Settings/Settings";

const App = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
