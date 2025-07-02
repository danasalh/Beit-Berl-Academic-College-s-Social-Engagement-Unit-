import React, { useState, useEffect } from "react";
import { useUsers } from "../../../Contexts/UsersContext";
import { useVolunteerHours } from "../../../Contexts/VolunteerHoursContext";
import { useFeedbackReminderSystem } from "../../../utils/FeedbackReminderSystem";
import "./ProgressBar.css";

const ProgressBar = ({ 
  hours = null, // If provided, use this value instead of fetching
  approvedOnly = true // Show only approved hours by default
}) => {
  const { currentUser } = useUsers();
  const { getTotalHoursForVolunteer } = useVolunteerHours();
  const { checkAndSendFeedbackReminders } = useFeedbackReminderSystem();
  
  const [userHours, setUserHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isHoveringFill, setIsHoveringFill] = useState(false);
  const [reminderCheckDone, setReminderCheckDone] = useState(false);

  // Use provided hours or fetch from database
  const displayHours = hours !== null ? hours : userHours;
  
  const maxHours = 60;
  const percentage = Math.min((displayHours / maxHours) * 100, 100);
  const milestones = [
    { label: 15, pos: 45 },
    { label: 30, pos: 30 },
    { label: 45, pos: 15 }
  ];
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
        setUserHours(0);
        setReminderCheckDone(false);
        return;
      }

      setLoading(true);

      try {
        const totalHours = await getTotalHoursForVolunteer(currentUser.id, approvedOnly);
        setUserHours(totalHours);

      } catch (err) {
        console.error('❌ Error fetching user hours:', err);
        setUserHours(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserHours();
  }, [currentUser?.id, getTotalHoursForVolunteer, approvedOnly, hours]);

  // NON-BLOCKING reminder check - runs in background
  useEffect(() => {
    const checkReminders = async () => {
      // Only check reminders if:
      // 1. We have a current user who is a volunteer
      // 2. We have approved hours > 0
      // 3. We're showing approved hours only
      // 4. We haven't already done the reminder check
      // 5. We're not using provided hours (meaning this is the user's own progress)
      if (currentUser?.role === 'volunteer' && 
          displayHours > 0 && 
          approvedOnly && 
          !reminderCheckDone &&
          hours === null) {
        
        // Mark as done immediately to prevent multiple calls
        setReminderCheckDone(true);

        // Run reminder check in background - don't await it!
        checkAndSendFeedbackReminders(String(currentUser.id), displayHours)
          .then(() => {
          })
          .catch((error) => {
          });
      }
    };

    // Only run if we have valid data and haven't checked yet
    if (!loading && displayHours >= 0) {
      checkReminders();
    }
  }, [currentUser, displayHours, approvedOnly, reminderCheckDone, checkAndSendFeedbackReminders, loading, hours]);

  // Reset reminder check when user changes
  useEffect(() => {
    setReminderCheckDone(false);
  }, [currentUser?.id]);

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
          <div className={`progress-bar-fill-tooltip${isFull ? " celebrate-text" : ""} ${isHoveringFill || isFull ? "glow" : ""}`}>
            {displayHours} שעות
          </div>
        </div>

        {milestones.map((mark) => {
  if (displayHours >= mark.label - 1) return null;
  return (
    <div
      key={mark.label}
      className="progress-bar-tick-wrapper"
      style={{ left: `${(mark.pos / maxHours) * 100}%` }}
    >
      <div className="progress-bar-tick" />
      <div className="progress-bar-tooltip">{mark.label} שעות</div>
    </div>
  );
})}
      </div>

      <div className="progress-bar-labels">
        <span>0</span>
        {!isFull && <span>60</span>}
      </div>
    </div>
  );
};

export default ProgressBar;