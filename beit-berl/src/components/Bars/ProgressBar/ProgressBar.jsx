import React, { useState, useEffect } from "react";
import { useUsers } from "../../../Contexts/UsersContext";
import { useVolunteerHours } from "../../../Contexts/VolunteerHoursContext";
import "./ProgressBar.css";

const ProgressBar = ({ 
  hours = null, // If provided, use this value instead of fetching
  approvedOnly = true // Show only approved hours by default
}) => {
  const { currentUser } = useUsers();
  const { getTotalHoursForVolunteer } = useVolunteerHours();
  
  const [userHours, setUserHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isHoveringFill, setIsHoveringFill] = useState(false);

  // Use provided hours or fetch from database
  const displayHours = hours !== null ? hours : userHours;
  
  const maxHours = 60;
  const percentage = Math.min((displayHours / maxHours) * 100, 100);
  const milestones = [15, 30, 45];
  const isFull = displayHours >= 60;

  // Fetch user's total hours only if hours prop is not provided
  useEffect(() => {
    const fetchUserHours = async () => {
      // Skip fetching if hours are provided as prop
      if (hours !== null) {
        return;
      }

      // Only fetch if we have a current user
      if (!currentUser?.id) {
        console.log('👤 No current user, resetting hours to 0');
        setUserHours(0);
        return;
      }

      console.log('📊 Fetching hours for current user:', currentUser.id);
      setLoading(true);

      try {
        const totalHours = await getTotalHoursForVolunteer(currentUser.id, approvedOnly);
        setUserHours(totalHours);
        console.log(`✅ Total hours for user ${currentUser.id}: ${totalHours}`);
      } catch (err) {
        console.error('❌ Error fetching user hours:', err);
        setUserHours(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserHours();
  }, [currentUser?.id, getTotalHoursForVolunteer, approvedOnly, hours]);

  // Show loading state if we're fetching data
  if (hours === null && loading) {
    return (
      <div className="progress-bar-container">
        <div className="progress-bar-loading">
          <div className="loading-spinner"></div>
          <span>טוען שעות...</span>
        </div>
      </div>
    );
  }

  // Show message if no current user and no hours provided
  if (hours === null && !currentUser) {
    return (
      <div className="progress-bar-container">
        <div className="progress-bar-message">
          <span>יש להתחבר כדי לראות את ההתקדמות</span>
        </div>
      </div>
    );
  }

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
              {displayHours} שעות
            </div>
          )}
        </div>

        {milestones.map((mark) =>
          displayHours === mark ? null : (
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
        <span>0</span>
        {!isFull && <span>60</span>}
      </div>
    </div>
  );
};

export default ProgressBar;