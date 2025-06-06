import React from "react";
import { HiCheck, HiLibrary, HiChartBar } from "react-icons/hi";
import "./ThreeButtonDush.css";

// דוגמה בסיסית
const ThreeButtonDush = ({ onMarkHoursClick }) => {
  return (
    <div className="three-button-dush">
      <button className="dush-button" onClick={onMarkHoursClick}>
        <HiCheck className="dush-icon" />
        <span>!סימון שעות התנדבות</span>
      </button>
      <button className="dush-button">
        <HiLibrary className="dush-icon" />
        <span>חיפוש ארגון התנדבות</span>
      </button>
      <button className="dush-button">
        <HiChartBar className="dush-icon" />
        <span>מקומות בהן התנדבתי</span>
      </button>
    </div>
  );
};

export default ThreeButtonDush;
