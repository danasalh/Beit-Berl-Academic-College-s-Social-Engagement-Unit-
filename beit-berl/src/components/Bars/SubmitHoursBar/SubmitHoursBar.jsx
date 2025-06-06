import React, { useState } from "react";
import "./SubmitHoursBar.css";

const SubmitHoursBar = ({ onSubmit, loading = false }) => {
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

  const handleClick = async () => {
    if (value <= 0) {
      alert("נא לבחור כמות שעות גדולה מ-0");
      return;
    }

    if (loading) return; // Prevent double submission

    setIsCelebrating(true);
    
    try {
      await onSubmit?.(value);
      // Reset form after successful submission
      setValue(0);
      setShowLabel(false);
    } catch (error) {
      console.error('Error in handleClick:', error);
    } finally {
      setTimeout(() => setIsCelebrating(false), 1000);
    }
  };

  return (
    <div className="submit-hours-container">
      <div className="slider-wrapper">
        <span className="slider-label">0</span>
        <input
          type="range"
          min="0"
          max="8"
          step="0.5"
          value={value}
          onChange={handleChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="slider"
          disabled={loading}
        />
        <span className="slider-label">8</span>

        {showLabel && (
          <div className="hours-tooltip animate-tooltip">
            {value % 1 === 0 ? value : value.toFixed(1)} שעות
          </div>
        )}
      </div>

      <button
        className={`submit-button ${isCelebrating ? "celebrate-glow" : ""} ${loading ? "loading" : ""}`}
        onClick={handleClick}
        disabled={loading || value <= 0}
      >
        {loading ? "שומר..." : "אישור"}
      </button>
    </div>
  );
};

export default SubmitHoursBar;