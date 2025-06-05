// src/components/pages/volunteer/dashboard/VcDachboard.jsx

import React from 'react';
import ProgressBar from '../../../Bars/ProgressBar/ProgressBar';
import ThreeButtonDush from '../../../Buttons/ThreeButtonDush/ThreeButtonDush';
import './VolunteerDashboard.css';

export default function VcDashboard() {
  return (
    <div className="volunteer-dashboard-root">
      <div className="welcome-title">ברוך הבא</div>
      <div className="dashboard-bar-wrapper">
        <ProgressBar />
      </div>
      <div className="dashboard-buttons-wrapper">
        <ThreeButtonDush />
      </div>
    </div>
  );
}
