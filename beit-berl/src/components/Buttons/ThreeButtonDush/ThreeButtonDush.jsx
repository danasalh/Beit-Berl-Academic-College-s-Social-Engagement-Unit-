import React from "react";
import { HiCheck, HiLibrary, HiChartBar } from "react-icons/hi";
import "./ThreeButtonDush.css";

const ThreeButtonDush = () => {
  return (
    <div className="three-button-dush">
      <button className="dush-button">
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
