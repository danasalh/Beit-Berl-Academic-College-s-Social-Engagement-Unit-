import React, { useState } from "react";
import "./SubmitHoursBar.css";

const SubmitHoursBar = ({ onSubmit }) => {
  const [value, setValue] = useState(0);
  const [showLabel, setShowLabel] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const handleChange = (e) => {
    setValue(Number(e.target.value));
    setShowLabel(false);
  };

  const handleRelease = () => {
    setShowLabel(true);
  };

  const handleClick = () => {
    setIsCelebrating(true);
    onSubmit?.(value);
    setTimeout(() => setIsCelebrating(false), 1000);
  };

  return (
    <div className="submit-hours-container">
      <div className="slider-wrapper">
        <span className="slider-label">8</span>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={value}
          onChange={handleChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="slider"
        />
        <span className="slider-label">0</span>

        {showLabel && (
          <div className="hours-tooltip animate-tooltip">
            {value} שעות
          </div>
        )}
      </div>

      <button
        className={`submit-button ${isCelebrating ? "celebrate-glow" : ""}`}
        onClick={handleClick}
      >
        אישור
      </button>
    </div>
  );
};

export default SubmitHoursBar;
