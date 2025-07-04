// src/utils/feedbackReminderSystem.js
import { useUsers } from '../Contexts/UsersContext';
import { useNotifications } from '../Contexts/NotificationsContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Global state to prevent duplicate calls
const reminderCheckCache = new Map();
const activeReminderChecks = new Set();

export const useFeedbackReminderSystem = () => {
  const { getUsersByRole, getUserById } = useUsers();
  const { createNotification } = useNotifications();

  /**
   * Helper function to get user display name
   * @param {Object} user - User object
   * @returns {string} Display name (name or firstName)
   */
  const getUserDisplayName = (user) => {
    return user.name || user.firstName || 'Unknown User';
  };

  /**
   * Get the reminder tracking document for a volunteer
   * @param {string} volunteerId - The ID of the volunteer
   * @returns {Object} Tracking data with sent milestones
   */
  const getReminderTracking = async (volunteerId) => {
    try {
      const trackingRef = doc(db, 'feedbackReminderTracking', volunteerId);
      const trackingSnap = await getDoc(trackingRef);
      
      // Default structure
      const defaultTracking = {
        volunteerId: volunteerId,
        sentMilestones: {
          15: false,
          30: false,
          45: false,
          60: false
        },
        lastUpdated: new Date()
      };
      
      if (trackingSnap.exists()) {
        const data = trackingSnap.data();
        
        // Ensure sentMilestones has the correct structure
        const sentMilestones = {
          15: data.sentMilestones?.[15] || false,
          30: data.sentMilestones?.[30] || false,
          45: data.sentMilestones?.[45] || false,
          60: data.sentMilestones?.[60] || false
        };
        
        return {
          volunteerId: data.volunteerId || volunteerId,
          sentMilestones,
          lastUpdated: data.lastUpdated || new Date()
        };
      } else {
        return defaultTracking;
      }
    } catch (error) {
      console.error('❌ Error getting reminder tracking:', error);
      return {
        volunteerId: volunteerId,
        sentMilestones: {
          15: false,
          30: false,
          45: false,
          60: false
        },
        lastUpdated: new Date()
      };
    }
  };

  /**
   * Update the reminder tracking document for a volunteer
   * @param {string} volunteerId - The ID of the volunteer
   * @param {Object} milestones - Object with milestone numbers as keys and boolean as values
   */
  const updateReminderTracking = async (volunteerId, milestones) => {
    try {
      const trackingRef = doc(db, 'feedbackReminderTracking', volunteerId);
      const currentTracking = await getReminderTracking(volunteerId);
      
      const updatedTracking = {
        ...currentTracking,
        sentMilestones: {
          ...currentTracking.sentMilestones,
          ...milestones
        },
        lastUpdated: new Date()
      };
      
      await setDoc(trackingRef, updatedTracking);
      
      return updatedTracking;
    } catch (error) {
      console.error('❌ Error updating reminder tracking:', error);
      throw error;
    }
  };

  /**
   * Sends feedback reminders to VCs and OrgReps for specific milestones
   * @param {string} volunteerId - The ID of the volunteer
   * @param {number[]} milestonesToSend - Array of milestone hours to send reminders for (e.g., [15, 30])
   */
  const sendFeedbackReminders = async (volunteerId, milestonesToSend) => {
    try {

      if (!milestonesToSend || milestonesToSend.length === 0) {
        return 0;
      }

      // Get volunteer data
      const volunteer = await getUserById(volunteerId);
      if (!volunteer) {
        console.error('❌ Volunteer not found:', volunteerId);
        return 0;
      }

      if (!volunteer.orgId || !Array.isArray(volunteer.orgId) || volunteer.orgId.length === 0) {
        console.warn('⚠️ Volunteer has no organizations assigned:', volunteerId);
        return 0;
      }

      const volunteerDisplayName = getUserDisplayName(volunteer);

      // Get all VCs and OrgReps
      const [vcs, orgReps] = await Promise.all([
        getUsersByRole('vc'),
        getUsersByRole('orgRep')
      ]);


      // Combine VCs and OrgReps for processing
      const recipients = [...vcs, ...orgReps];
      
      // Remove duplicates based on user ID
      const uniqueRecipients = recipients.filter((recipient, index, self) => 
        index === self.findIndex(r => r.id === recipient.id)
      );      
      const notificationsToSend = [];

      // Find recipients that share at least one organization with the volunteer
      uniqueRecipients.forEach(recipient => {
        if (!recipient.orgId || !Array.isArray(recipient.orgId)) {
          return;
        }

        // Check if recipient shares at least one organization with volunteer
        const hasSharedOrg = recipient.orgId.some(recipientOrgId => 
          volunteer.orgId.includes(recipientOrgId)
        );

        if (hasSharedOrg) {
          const recipientDisplayName = getUserDisplayName(recipient);          
          // Create ONE notification per recipient that includes ALL milestones
          const milestonesText = milestonesToSend.length === 1 
            ? `${milestonesToSend[0]} שעות`
            : `${milestonesToSend.join(', ')} שעות`;
          
          notificationsToSend.push({
            receiverId: String(recipient.id),
            relatedId: String(volunteerId),
            title: 'תזכורת להוספת פידבק',
            content: `זוהי תזכורת להוסיף פידבק עבור המתנדב ${volunteerDisplayName} שהגיע ל-${milestonesText} התנדבות`,
            type: 'reminder',
            read: false,
            date: new Date()
          });
        }
      });

      // Send all notifications
      const notificationPromises = notificationsToSend.map(notification => 
        createNotification(notification)
      );

      await Promise.all(notificationPromises);

      // Mark these milestones as sent in tracking
      const milestonesToUpdate = {};
      milestonesToSend.forEach(milestone => {
        milestonesToUpdate[milestone] = true;
      });
      
      await updateReminderTracking(volunteerId, milestonesToUpdate);
      return notificationsToSend.length;

    } catch (error) {
      console.error('❌ Error sending feedback reminders:', error);
      throw error;
    }
  };

  /**
   * Check and send feedback reminders for a volunteer based on their current hours
   * This is the main function to call when volunteer hours are updated
   * @param {string} volunteerId - The ID of the volunteer
   * @param {number} currentApprovedHours - Current total approved hours
   */
  const checkAndSendFeedbackReminders = async (volunteerId, currentApprovedHours) => {
    const cacheKey = `${volunteerId}-${currentApprovedHours}`;
    
    // Check if we've already processed this volunteer with these hours
    if (reminderCheckCache.has(cacheKey)) {
      return 0;
    }
    
    // Check if there's already an active check for this volunteer
    if (activeReminderChecks.has(volunteerId)) {
      return 0;
    }
    
    try {
      // Mark as active
      activeReminderChecks.add(volunteerId);

      if (currentApprovedHours <= 0) {
        return 0;
      }

      // Get current reminder tracking
      const tracking = await getReminderTracking(volunteerId);

      // Determine which milestones should have been sent based on current hours
      const possibleMilestones = [15, 30, 45, 60];
      const milestonesToSend = [];

      possibleMilestones.forEach(milestone => {
        const hasReachedMilestone = currentApprovedHours >= milestone;
        const alreadySent = tracking.sentMilestones[milestone];
        
        
        if (hasReachedMilestone && !alreadySent) {
          milestonesToSend.push(milestone);
        }
      });


      if (milestonesToSend.length === 0) {
        // Cache the result even if no reminders were sent
        reminderCheckCache.set(cacheKey, true);
        return 0;
      }

      const remindersSent = await sendFeedbackReminders(volunteerId, milestonesToSend);

      // Cache the successful result
      reminderCheckCache.set(cacheKey, true);
      
      return remindersSent;
    } catch (error) {
      console.error('❌ Error in feedback reminder check:', error);
      throw error;
    } finally {
      // Remove from active checks
      activeReminderChecks.delete(volunteerId);
    }
  };

  /**
   * Clear the reminder cache (useful for testing or when volunteer hours change significantly)
   * @param {string} volunteerId - Optional: clear cache for specific volunteer only
   */
  const clearReminderCache = (volunteerId = null) => {
    if (volunteerId) {
      // Clear cache entries for specific volunteer
      for (const key of reminderCheckCache.keys()) {
        if (key.startsWith(volunteerId + '-')) {
          reminderCheckCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      reminderCheckCache.clear();
      activeReminderChecks.clear();
    }
  };

  /**
   * Utility function to calculate which milestones a volunteer has reached
   * @param {number} approvedHours - Total approved hours
   * @returns {number[]} Array of milestone hours (15, 30, 45, 60, etc.)
   */
  const getMilestonesReached = (approvedHours) => {
    const milestones = [15, 30, 45, 60];
    return milestones.filter(milestone => approvedHours >= milestone);
  };

  /**
   * Get the reminder tracking status for a volunteer (useful for debugging)
   * @param {string} volunteerId - The ID of the volunteer
   * @returns {Object} Current tracking data
   */
  const getVolunteerReminderStatus = async (volunteerId) => {
    return await getReminderTracking(volunteerId);
  };

  /**
   * Reset reminder tracking for a volunteer (useful for testing/admin purposes)
   * @param {string} volunteerId - The ID of the volunteer
   */
  const resetVolunteerReminderTracking = async (volunteerId) => {
    const resetTracking = {
      volunteerId: volunteerId,
      sentMilestones: {
        0: false,
        15: false,
        30: false,
        45: false,
        60: false
      },
      lastUpdated: new Date()
    };
    
    await setDoc(doc(db, 'feedbackReminderTracking', volunteerId), resetTracking);
    
    // Clear cache for this volunteer
    clearReminderCache(volunteerId);
    
    return resetTracking;
  };

  return {
    sendFeedbackReminders,
    checkAndSendFeedbackReminders,
    getMilestonesReached,
    getVolunteerReminderStatus,
    resetVolunteerReminderTracking,
    getReminderTracking,
    updateReminderTracking,
    clearReminderCache
  };
};