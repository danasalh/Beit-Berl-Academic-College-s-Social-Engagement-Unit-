// Enhanced VolunteerDashboard.jsx with fix for approved hours calculation
import { useState, useEffect } from 'react';
import { useUsers } from '../../../../Contexts/UsersContext';
import { useVolunteerHours } from '../../../../Contexts/VolunteerHoursContext';
import { useOrganizations } from '../../../../Contexts/OrganizationsContext';
import { useNotifications } from '../../../../Contexts/NotificationsContext';
import ProgressBar from '../../../Bars/ProgressBar/ProgressBar';
import ThreeButtonDush from '../../../Buttons/ThreeButtonDush/ThreeButtonDush';
import SubmitHoursBar from '../../../Bars/SubmitHoursBar/SubmitHoursBar';
import FinishVol from '../../../Buttons/FinishVol/FinishVol';
import './VolunteerDashboard.css'
import EndVolunteering from '../../../PopUps/EndVolunteering/EndVolunteering';
import CloseButton from '../../../Buttons/CloseButton/CloseButton';

export default function VcDashboard() {
  const { currentUser, getUsersByRole, getUsersByOrganization } = useUsers();
  const { logVolunteerHours, getTotalHoursForVolunteer } = useVolunteerHours();
  const { getOrganizationById } = useOrganizations();
  const { createNotification } = useNotifications();

  const [showPopup, setShowPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userTotalHours, setUserTotalHours] = useState(0);
  const [userApprovedHours, setUserApprovedHours] = useState(0); // Separate state for approved hours
  const [progressKey, setProgressKey] = useState(0);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgsLoaded, setOrgsLoaded] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [hasDeclared, setHasDeclared] = useState(false);


  // Updated helper function to get the correct user ID - prioritize id over docId
  const getUserId = (user) => {
    return user?.id || user?.docId;
  };

  // Helper function to get the user name
  const getUserName = (user) => {
    return user?.name || user?.displayName || user?.firstName || user?.email || 'משתמש לא מזוהה';
  };

  // ADD THE MISSING FUNCTION HERE
  const handleMarkHoursClick = async () => {

    // Load organizations when needed
    if (!orgsLoaded) {
      await loadUserOrganizations();
    }

    setShowPopup(true);
  };

  // Fetch user's total hours (all) and approved hours separately
  useEffect(() => {
    const fetchUserHours = async () => {
      const userId = getUserId(currentUser);
      if (!userId) {
        setUserTotalHours(0);
        setUserApprovedHours(0);
        return;
      }

      try {
        // Fetch total hours (all submissions)
        const totalHours = await getTotalHoursForVolunteer(userId, false);
        setUserTotalHours(totalHours);

        // Fetch approved hours only
        const approvedHours = await getTotalHoursForVolunteer(userId, true);
        setUserApprovedHours(approvedHours);

      } catch (error) {
        console.error('Error fetching user hours:', error);
        setUserTotalHours(0);
        setUserApprovedHours(0);
      }
    };

    fetchUserHours();
  }, [currentUser?.docId, currentUser?.id, getTotalHoursForVolunteer]);

  // Function to load organizations - called only when needed
  const loadUserOrganizations = async () => {
    if (orgsLoaded || loadingOrgs) return;

    if (!currentUser?.orgId) {
      setUserOrganizations([]);
      setOrgsLoaded(true);
      return;
    }

    setLoadingOrgs(true);

    try {
      let orgIds = [];
      if (Array.isArray(currentUser.orgId)) {
        orgIds = currentUser.orgId;
      } else if (typeof currentUser.orgId === 'string' || typeof currentUser.orgId === 'number') {
        orgIds = [currentUser.orgId];
      }

      orgIds = orgIds.filter(id => id !== null && id !== undefined && id !== '');

      if (orgIds.length === 0) {
        setUserOrganizations([]);
        setOrgsLoaded(true);
        setLoadingOrgs(false);
        return;
      }
      const orgPromises = orgIds.map(async (orgId) => {
        try {
          const org = await getOrganizationById(orgId);
          return org;
        } catch (error) {
          console.error(`Error fetching organization ${orgId}:`, error);
          return null;
        }
      });

      const organizations = await Promise.all(orgPromises);

      const validOrganizations = organizations.filter(org => {
        if (!org) return false;
        if (!org.id && !org.Id) return false;
        return true;
      });

      setUserOrganizations(validOrganizations);
      setOrgsLoaded(true);

    } catch (error) {
      console.error('Error loading organizations:', error);
      setUserOrganizations([]);
      setOrgsLoaded(true);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Enhanced function to send notifications when hours are submitted
  const sendNotificationsForNewHours = async (selectedOrgId, hoursSubmitted) => {

    // Use consistent user ID - prioritize user.id over docId
    const userId = currentUser?.id || currentUser?.docId;
    const userName = getUserName(currentUser);

    if (!userId) {
      console.error('❌ No valid user ID found for notifications');
      return;
    }

    if (!selectedOrgId) {
      console.error('❌ No organization ID provided for notifications');
      return;
    }

    try {
      const notifications = [];

      // 1. Get all admins (they get notifications for all submissions)
      try {
        const admins = await getUsersByRole('admin');

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            const adminId = admin?.id || admin?.docId;
            if (adminId && String(adminId) !== String(userId)) {
              notifications.push({
                receiverId: String(adminId),
                relatedId: String(userId),
                type: 'approval-needed',
                title: 'שעות חדשות הוזנו וממתינות לאישורך',
                content: `המשתמש ${userName} הזין ${hoursSubmitted} שעות חדשות במערכת. השעות ממתינות לאישורך.`,
                date: new Date(),
                orgId: selectedOrgId
              });
            }
          }
        } else {
          console.warn('⚠️ No admins found in the system!');
        }
      } catch (error) {
        console.error('❌ Error fetching admins:', error);
      }

      // 2. Get VCs and orgReps specifically for the selected organization
      try {
        // Convert selectedOrgId to ensure consistent comparison
        const orgIdToSearch = String(selectedOrgId);

        // Get all VCs
        const allVCs = await getUsersByRole('vc');

        // Filter VCs by organization
        const relevantVCs = allVCs?.filter(vc => {
          if (!vc.orgId) return false;

          // Handle different orgId formats
          let vcOrgIds = [];
          if (Array.isArray(vc.orgId)) {
            vcOrgIds = vc.orgId.map(id => String(id));
          } else {
            vcOrgIds = [String(vc.orgId)];
          }

          const hasOrg = vcOrgIds.includes(orgIdToSearch);
          return hasOrg;
        }) || [];


        // Get all orgReps
        const allOrgReps = await getUsersByRole('orgRep');

        // Filter orgReps by organization
        const relevantOrgReps = allOrgReps?.filter(orgRep => {
          if (!orgRep.orgId) return false;

          // Handle different orgId formats
          let orgRepOrgIds = [];
          if (Array.isArray(orgRep.orgId)) {
            orgRepOrgIds = orgRep.orgId.map(id => String(id));
          } else {
            orgRepOrgIds = [String(orgRep.orgId)];
          }

          const hasOrg = orgRepOrgIds.includes(orgIdToSearch);
          return hasOrg;
        }) || [];

        // Add notifications for relevant VCs
        for (const vc of relevantVCs) {
          const vcId = vc?.id || vc?.docId;
          if (vcId && String(vcId) !== String(userId)) {
            notifications.push({
              receiverId: String(vcId),
              relatedId: String(userId),
              type: 'approval-needed',
              title: 'שעות חדשות הוזנו וממתינות לאישורך',
              content: `המשתמש ${userName} הזין ${hoursSubmitted} שעות חדשות במערכת. השעות ממתינות לאישורך.`,
              date: new Date(),
              orgId: selectedOrgId
            });
          }
        }

        // Add notifications for relevant orgReps
        for (const orgRep of relevantOrgReps) {
          const orgRepId = orgRep?.id || orgRep?.docId;
          if (orgRepId && String(orgRepId) !== String(userId)) {
            notifications.push({
              receiverId: String(orgRepId),
              relatedId: String(userId),
              type: 'approval-needed',
              title: 'שעות חדשות הוזנו וממתינות לאישורך',
              content: `המשתמש ${userName} הזין ${hoursSubmitted} שעות חדשות במערכת. השעות ממתינות לאישורך.`,
              date: new Date(),
              orgId: selectedOrgId
            });
          }
        }

      } catch (error) {
        console.error('❌ Error fetching VCs and orgReps:', error);
      }

      // 3. Alternative approach: Get users by organization (fallback)
      try {
        const orgUsers = await getUsersByOrganization(selectedOrgId);

        if (orgUsers && orgUsers.length > 0) {
          // Filter for VCs and orgReps that we haven't already processed
          const additionalVCs = orgUsers.filter(user =>
            user.role === 'vc' &&
            !notifications.some(n => n.receiverId === String(user.id || user.docId))
          );

          const additionalOrgReps = orgUsers.filter(user =>
            user.role === 'orgRep' &&
            !notifications.some(n => n.receiverId === String(user.id || user.docId))
          );

          // Add notifications for additional VCs
          for (const vc of additionalVCs) {
            const vcId = vc?.id || vc?.docId;
            if (vcId && String(vcId) !== String(userId)) {
              notifications.push({
                receiverId: String(vcId),
                relatedId: String(userId),
                type: 'approval-needed',
                title: 'שעות חדשות הוזנו וממתינות לאישורך',
                content: `המשתמש ${userName} הזין ${hoursSubmitted} שעות חדשות במערכת. השעות ממתינות לאישורך.`,
                date: new Date(),
                orgId: selectedOrgId
              });
            }
          }

          // Add notifications for additional orgReps
          for (const orgRep of additionalOrgReps) {
            const orgRepId = orgRep?.id || orgRep?.docId;
            if (orgRepId && String(orgRepId) !== String(userId)) {
              notifications.push({
                receiverId: String(orgRepId),
                relatedId: String(userId),
                type: 'approval-needed',
                title: 'שעות חדשות הוזנו וממתינות לאישורך',
                content: `המשתמש ${userName} הזין ${hoursSubmitted} שעות חדשות במערכת. השעות ממתינות לאישורך.`,
                date: new Date(),
                orgId: selectedOrgId
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in fallback organization user fetch:', error);
      }

      if (notifications.length === 0) {
        console.warn('⚠️ No notifications to send! Check user roles and organization setup.');
        return;
      }

      // Create all notifications
      const results = [];

      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        try {
          const result = await createNotification(notification);
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to create notification ${i + 1}:`, error);
          results.push(null);
        }
      }

      const successCount = results.filter(r => r !== null).length;

      if (successCount > 0) {
      } else {
        console.error('❌ All notifications failed to create!');
      }

    } catch (error) {
      console.error('❌ Critical error in notification process:', error);
      // Don't throw error to prevent breaking the main flow
    }

  };

  const handleSubmitHours = async (hoursToAdd, selectedOrgId) => {

    const userId = getUserId(currentUser);
    if (!userId) {
      alert("יש להתחבר למערכת כדי לרשום שעות");
      return;
    }

    if (!selectedOrgId) {
      alert("יש לבחור ארגון לפני רישום השעות");
      return;
    }

    setSubmitting(true);

    try {
      const hoursData = {
        volunteerId: userId,
        orgId: selectedOrgId,
        hours: hoursToAdd
      };


      // 1. Save hours to database with the selected organization ID
      const hoursId = await logVolunteerHours(hoursData);

      // 2. Send notifications to relevant users
      await sendNotificationsForNewHours(selectedOrgId, hoursToAdd);

      // 3. Update local total hours immediately for better UX (but not approved hours - they need approval)
      setUserTotalHours(prevTotal => prevTotal + hoursToAdd);
      // Note: userApprovedHours should NOT be updated here since the hours are pending approval

      // 4. Force ProgressBar to refresh by changing its key
      setProgressKey(prev => prev + 1);

      setShowPopup(false);

      // Find organization name for success message
      const selectedOrg = userOrganizations.find(org =>
        (org.id && org.id === selectedOrgId) || (org.Id && org.Id === selectedOrgId)
      );
      const orgName = selectedOrg ?
        (selectedOrg.name || selectedOrg.Name || `ארגון ${selectedOrgId}`) :
        'הארגון הנבחר';

      // Show success message
      alert(`נרשמו בהצלחה ${hoursToAdd} שעות עבור ${orgName}! השעות ממתינות לאישור והודעות נשלחו לגורמים המאשרים.`);

    } catch (error) {
      console.error('❌ === ERROR IN HOURS SUBMISSION ===', error);
      alert("אירעה שגיאה ברישום השעות. אנא נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishVol = () => {
    setShowEndPopup(true);
    setHasDeclared(true);
  }

  // Function to refresh approved hours (call this when hours are approved/rejected)
  const refreshApprovedHours = async () => {
    const userId = getUserId(currentUser);
    if (!userId) return;

    try {
      const approvedHours = await getTotalHoursForVolunteer(userId, true);
      setUserApprovedHours(approvedHours);
    } catch (error) {
      console.error('Error refreshing approved hours:', error);
    }
  };

  const displayName = getUserName(currentUser);

  return (
    <div className="volunteer-dashboard-root">
      <div className="welcome-title">
        ברוך הבא{displayName ? ` ${displayName}` : ''}
      </div>

      <div className="dashboard-bar-wrapper">
        <ProgressBar key={progressKey} approvedOnly={true} />
      </div>

      {/* Show FinishVol button only when user has at least 60 APPROVED hours */}
      {userApprovedHours >= 60 && (
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
          <FinishVol
            onClick={handleFinishVol}
            label={hasDeclared ? "להצהיר שוב?" : "סיום התנדבות"}
          />
        </div>
      )}

      <div className="dashboard-buttons-wrapper">
        <ThreeButtonDush onMarkHoursClick={handleMarkHoursClick} />
      </div>

      {/* Debug info - remove in production */}
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '10px',
        textAlign: 'center',
        display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
      }}>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => !submitting && setShowPopup(false)}>
          <div
            className="popup-content popup-animate"
            onClick={e => e.stopPropagation()}
          >
            <SubmitHoursBar
              onSubmit={handleSubmitHours}
              loading={submitting}
              userOrganizations={userOrganizations}
              loadingOrgs={loadingOrgs}
            />
            <button
              className="close-btn-hours"
              onClick={() => setShowPopup(false)}
              disabled={submitting}
            >
              סגור
            </button>
          </div>
        </div>
      )}
      {showEndPopup && (
        <div className="popup-overlay" onClick={() => setShowEndPopup(false)}>
          <div
            className="popup-content popup-animate"
            onClick={e => e.stopPropagation()}
          >
            <CloseButton onClick={() => setShowEndPopup(false)} className="close" />
            <EndVolunteering />
          </div>
        </div>
      )}

    </div>
  );
}