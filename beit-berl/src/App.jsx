import React, { useState } from "react";
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import SuccessfulRegistration from "./components/PopUps/SuccessfulRegistration/SuccessfulRegistration";
import Settings from "./components/PopUps/Settings/Settings";
import AreYouSure from "./components/PopUps/AreYouSure/AreYouSure";
import TermsDoc from "./components/PopUps/TermsDoc/TermsDoc";
import Read_Unread from "./components/PopUps/Read_Unread/Read_Unread";
import FinishVol from "./components/Buttons/FinishVol/FinishVol";
import ProgressBar from "./components/Volunteer/ProgressBar/ProgressBar";
import SubmitHoursBar from "./components/Volunteer/SubmitHoursBar/SubmitHoursBar";

const App = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAreYouSure, setShowAreYouSure] = useState(false);
  const [showTermsDoc, setShowTermsDoc] = useState(false);
  const [showReadUnread, setShowReadUnread] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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

  const handleShowReadUnread = (event) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY, // Position below the button
      left: rect.left + window.scrollX, // Align with the button
    });
    setShowReadUnread(true);
  };

  const handleCloseReadUnread = () => {
    setShowReadUnread(false);
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
        
        <button onClick={handleShowReadUnread}>Show Read/Unread</button>
        {showReadUnread && (
          <Read_Unread position={dropdownPosition} onClose={handleCloseReadUnread} />
        )}
        
        <FinishVol onClick={() => alert("סיימת התנדבות!")} />

        <div style={{ margin: "20px 0" }}>
          <ProgressBar progress={60} />
          <div style={{ textAlign: "center", marginTop: "8px", color: "#333", fontWeight: "bold" }}>
            15 שעות
          </div>
        </div>

        <SubmitHoursBar />

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
