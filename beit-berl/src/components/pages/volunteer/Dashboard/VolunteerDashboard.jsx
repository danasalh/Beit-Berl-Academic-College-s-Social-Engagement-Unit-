// Enhanced VolunteerDashboard.jsx with comprehensive debug logging
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
  const [progressKey, setProgressKey] = useState(0);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgsLoaded, setOrgsLoaded] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);

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
    console.log('Mark hours button clicked');

    // Load organizations when needed
    if (!orgsLoaded) {
      await loadUserOrganizations();
    }

    setShowPopup(true);
  };

  // Fetch user's total approved hours on component mount and when currentUser changes
  useEffect(() => {
    const fetchUserTotalHours = async () => {
      const userId = getUserId(currentUser);
      if (!userId) {
        setUserTotalHours(0);
        return;
      }

      try {
        const totalHours = await getTotalHoursForVolunteer(userId, true);
        setUserTotalHours(totalHours);
      } catch (error) {
        console.error('Error fetching user total hours:', error);
        setUserTotalHours(0);
      }
    };

    fetchUserTotalHours();
  }, [currentUser?.docId, currentUser?.id, getTotalHoursForVolunteer]);

  // Function to load organizations - called only when needed
  const loadUserOrganizations = async () => {
    if (orgsLoaded || loadingOrgs) return;

    console.log('Loading user organizations...');

    if (!currentUser?.orgId) {
      console.log('User has no organizations');
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
        console.log('No valid organization IDs found');
        setUserOrganizations([]);
        setOrgsLoaded(true);
        setLoadingOrgs(false);
        return;
      }

      console.log('Fetching organizations for IDs:', orgIds);

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

      console.log('Successfully loaded organizations:', validOrganizations);
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
    console.log('🔔 === STARTING NOTIFICATION PROCESS ===');
    console.log('Selected Organization ID:', selectedOrgId, 'Type:', typeof selectedOrgId);
    console.log('Hours Submitted:', hoursSubmitted);

    // Use consistent user ID - prioritize user.id over docId
    const userId = currentUser?.id || currentUser?.docId;
    const userName = getUserName(currentUser);

    console.log('Current User Info:', {
      id: currentUser?.id,
      docId: currentUser?.docId,
      actualUserId: userId,
      name: userName,
      role: currentUser?.role,
      orgId: currentUser?.orgId
    });

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
      console.log('📋 Fetching all admins...');
      try {
        const admins = await getUsersByRole('admin');
        console.log('Found admins:', admins?.length || 0);

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
              console.log('✅ Added notification for admin:', adminId);
            }
          }
        } else {
          console.warn('⚠️ No admins found in the system!');
        }
      } catch (error) {
        console.error('❌ Error fetching admins:', error);
      }

      // 2. Get VCs and orgReps specifically for the selected organization
      console.log('🏢 Fetching VCs and orgReps for organization:', selectedOrgId);
      try {
        // Convert selectedOrgId to ensure consistent comparison
        const orgIdToSearch = String(selectedOrgId);

        // Get all VCs
        const allVCs = await getUsersByRole('vc');
        console.log('All VCs found:', allVCs?.length || 0);

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
          console.log(`VC ${vc.id || vc.docId} orgIds:`, vcOrgIds, 'includes', orgIdToSearch, '?', hasOrg);
          return hasOrg;
        }) || [];

        console.log('Relevant VCs for org', selectedOrgId, ':', relevantVCs.length);

        // Get all orgReps
        const allOrgReps = await getUsersByRole('orgRep');
        console.log('All orgReps found:', allOrgReps?.length || 0);

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
          console.log(`OrgRep ${orgRep.id || orgRep.docId} orgIds:`, orgRepOrgIds, 'includes', orgIdToSearch, '?', hasOrg);
          return hasOrg;
        }) || [];

        console.log('Relevant orgReps for org', selectedOrgId, ':', relevantOrgReps.length);

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
            console.log('✅ Added notification for VC:', vcId);
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
            console.log('✅ Added notification for orgRep:', orgRepId);
          }
        }

      } catch (error) {
        console.error('❌ Error fetching VCs and orgReps:', error);
      }

      // 3. Alternative approach: Get users by organization (fallback)
      console.log('🔄 Fallback: Getting users by organization...');
      try {
        const orgUsers = await getUsersByOrganization(selectedOrgId);
        console.log('Users in organization', selectedOrgId, ':', orgUsers?.length || 0);

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

          console.log('Additional VCs found:', additionalVCs.length);
          console.log('Additional orgReps found:', additionalOrgReps.length);

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
              console.log('✅ Added additional notification for VC:', vcId);
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
              console.log('✅ Added additional notification for orgRep:', orgRepId);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in fallback organization user fetch:', error);
      }

      console.log(`📨 Total notifications to create: ${notifications.length}`);
      console.log('Notification recipients:', notifications.map(n => ({
        receiverId: n.receiverId,
        type: n.type,
        orgId: n.orgId
      })));

      if (notifications.length === 0) {
        console.warn('⚠️ No notifications to send! Check user roles and organization setup.');
        return;
      }

      // Create all notifications
      console.log('🚀 Creating notifications...');
      const results = [];

      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        try {
          console.log(`Creating notification ${i + 1}/${notifications.length} for receiver:`, notification.receiverId);
          const result = await createNotification(notification);
          results.push(result);
          console.log(`✅ Notification ${i + 1} created successfully with ID:`, result);
        } catch (error) {
          console.error(`❌ Failed to create notification ${i + 1}:`, error);
          results.push(null);
        }
      }

      const successCount = results.filter(r => r !== null).length;
      console.log(`📊 Notification creation results: ${successCount}/${notifications.length} successful`);

      if (successCount > 0) {
        console.log('✅ Notification process completed successfully!');
      } else {
        console.error('❌ All notifications failed to create!');
      }

    } catch (error) {
      console.error('❌ Critical error in notification process:', error);
      // Don't throw error to prevent breaking the main flow
    }

    console.log('🔔 === NOTIFICATION PROCESS COMPLETED ===');
  };

  const handleSubmitHours = async (hoursToAdd, selectedOrgId) => {
    console.log('🚀 === STARTING HOURS SUBMISSION ===');
    console.log('Hours to add:', hoursToAdd);
    console.log('Selected org ID:', selectedOrgId);
    console.log('Current user:', currentUser);

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

      console.log('📝 Submitting hours to database:', hoursData);

      // 1. Save hours to database with the selected organization ID
      const hoursId = await logVolunteerHours(hoursData);
      console.log('✅ Hours saved successfully with ID:', hoursId);

      // 2. Send notifications to relevant users
      console.log('📢 Sending notifications...');
      await sendNotificationsForNewHours(selectedOrgId, hoursToAdd);

      // 3. Update local total hours immediately for better UX
      setUserTotalHours(prevTotal => prevTotal + hoursToAdd);

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

      console.log('✅ === HOURS SUBMISSION COMPLETED SUCCESSFULLY ===');

    } catch (error) {
      console.error('❌ === ERROR IN HOURS SUBMISSION ===', error);
      alert("אירעה שגיאה ברישום השעות. אנא נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishVol = () => {
    setShowEndPopup(true);
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

      {userTotalHours >= 60 && (
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
          <FinishVol onClick={handleFinishVol} />
        </div>
      )}

      <div className="dashboard-buttons-wrapper">
        <ThreeButtonDush onMarkHoursClick={handleMarkHoursClick} />
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
            <CloseButton onClick={() => setShowEndPopup(false)} className="close"/>
            <EndVolunteering />
          </div>
        </div>
      )}

    </div>
  );
}