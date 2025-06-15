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
        setReminderCheckDone(false);
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
        
        console.log('🔔 Performing background reminder check for volunteer:', {
          volunteerId: currentUser.id,
          hours: displayHours
        });

        // Mark as done immediately to prevent multiple calls
        setReminderCheckDone(true);

        // Run reminder check in background - don't await it!
        checkAndSendFeedbackReminders(String(currentUser.id), displayHours)
          .then(() => {
            console.log('✅ Background reminder check completed');
          })
          .catch((error) => {
            console.error('❌ Error during background reminder check:', error);
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