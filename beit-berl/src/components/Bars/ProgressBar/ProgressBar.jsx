import React, { useState } from "react";
import "./ProgressBar.css";

const ProgressBar = ({ hours = 0 }) => {
  const maxHours = 60;
  const percentage = Math.min((hours / maxHours) * 100, 100);
  const milestones = [15, 30, 45];
  const [isHoveringFill, setIsHoveringFill] = useState(false);
  const isFull = hours >= 60;

  return (
    <div className="progress-bar-container">
      <div className={`progress-bar-track ${isFull ? "celebrate" : ""}`}>
        <div
          className={`progress-bar-fill ${isHoveringFill || isFull ? "glow" : ""}`}
          style={{ width: `${percentage}%` }}
          onMouseEnter={() => setIsHoveringFill(true)}
          onMouseLeave={() => setIsHoveringFill(false)}
        >
          {(isHoveringFill || isFull) && (
            <div className={`progress-bar-fill-tooltip ${isFull ? "celebrate-text" : "animate-tooltip"}`}>
              {hours} שעות
            </div>
          )}
        </div>

        {milestones.map((mark) =>
          hours === mark ? null : (
            <div
              key={mark}
              className="progress-bar-tick-wrapper"
              style={{ left: `${(mark / maxHours) * 100}%` }}
            >
              <div className="progress-bar-tick" />
              <div className="progress-bar-tooltip">{mark} שעות</div>
            </div>
          )
        )}
      </div>

      <div className="progress-bar-labels">
        <span>60</span>
        <span>0</span>
      </div>
    </div>
  );
};

export default ProgressBar;
