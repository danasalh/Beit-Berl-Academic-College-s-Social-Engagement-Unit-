import React, { useState, useEffect } from 'react';
import { useUsers } from '../../../../Contexts/UsersContext';
import { useVolunteerHours } from '../../../../Contexts/VolunteerHoursContext';
import ProgressBar from '../../../Bars/ProgressBar/ProgressBar';
import ThreeButtonDush from '../../../Buttons/ThreeButtonDush/ThreeButtonDush';
import SubmitHoursBar from '../../../Bars/SubmitHoursBar/SubmitHoursBar';
import FinishVol from '../../../Buttons/FinishVol/FinishVol';
import './VolunteerDashboard.css';

export default function VcDashboard() {
  const { currentUser } = useUsers();
  const { logVolunteerHours, getTotalHoursForVolunteer } = useVolunteerHours();
  
  const [showPopup, setShowPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userTotalHours, setUserTotalHours] = useState(0);
  const [progressKey, setProgressKey] = useState(0); // Force ProgressBar re-render

  // Fetch user's total approved hours on component mount and when currentUser changes
  useEffect(() => {
    const fetchUserTotalHours = async () => {
      if (!currentUser?.id) {
        setUserTotalHours(0);
        return;
      }

      try {
        const totalHours = await getTotalHoursForVolunteer(currentUser.id, true);
        setUserTotalHours(totalHours);
      } catch (error) {
        console.error('Error fetching user total hours:', error);
        setUserTotalHours(0);
      }
    };

    fetchUserTotalHours();
  }, [currentUser?.id, getTotalHoursForVolunteer]);

  const handleMarkHoursClick = () => {
    setShowPopup(true);
  };

  const handleSubmitHours = async (hoursToAdd) => {
    if (!currentUser?.id) {
      alert("יש להתחבר למערכת כדי לרשום שעות");
      return;
    }

    setSubmitting(true);
    
    try {
      // Save hours to database using the currentUser.id
      await logVolunteerHours({
        volunteerId: currentUser.id, // Use the actual ID from currentUser
        orgId: 0, // Default organization ID as requested
        hours: hoursToAdd,
        // approved: false is set by default in the context
      });

      // Update local total hours immediately for better UX
      setUserTotalHours(prevTotal => prevTotal + hoursToAdd);

      // Force ProgressBar to refresh by changing its key
      setProgressKey(prev => prev + 1);

      setShowPopup(false);
      
      // Show success message
      alert(`נרשמו בהצלחה ${hoursToAdd} שעות! השעות ממתינות לאישור.`);
      
    } catch (error) {
      console.error('Error submitting hours:', error);
      alert("אירעה שגיאה ברישום השעות. אנא נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishVol = () => {
    alert("כל הכבוד! סיימת 60 שעות התנדבות 🎉");
    // Add additional logic here (send to server, navigate, etc.)
  };

  return (
    <div className="volunteer-dashboard-root">
      <div className="welcome-title">
        ברוך הבא{currentUser?.name ? ` ${currentUser.name}` : ''}
      </div>
      
      <div className="dashboard-bar-wrapper">
        {/* ProgressBar will fetch approved hours from database */}
        <ProgressBar key={progressKey} approvedOnly={true} />
      </div>
      
      <div className="dashboard-buttons-wrapper">
        <ThreeButtonDush onMarkHoursClick={handleMarkHoursClick} />
      </div>
      
      {/* Show finish button when user has 60+ approved hours */}
      {userTotalHours >= 60 && (
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
          <FinishVol onClick={handleFinishVol} />
        </div>
      )}
      
      {showPopup && (
        <div className="popup-overlay" onClick={() => !submitting && setShowPopup(false)}>
          <div
            className="popup-content popup-animate"
            onClick={e => e.stopPropagation()}
          >
            <SubmitHoursBar 
              onSubmit={handleSubmitHours} 
              loading={submitting}
            />
            <button 
              className="close-btn" 
              onClick={() => setShowPopup(false)}
              disabled={submitting}
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}