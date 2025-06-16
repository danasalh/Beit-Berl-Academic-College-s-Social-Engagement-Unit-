// src/utils/welcomeNotificationHelpers.js
import { useNotifications } from '../Contexts/NotificationsContext';

/**
 * Helper function to create welcome notifications
 * This can be used as a custom hook or imported as utility functions
 */
export const useWelcomeNotifications = () => {
  const { createNotification } = useNotifications();

  /**
   * Send welcome notification to newly approved user
   * @param {Object} user - The user object who was approved
   * @param {string} user.id - User ID
   * @param {string} user.name - User name
   * @param {string} user.role - User role (volunteer, orgRep, vc)
   * @param {string} approvedBy - Name/ID of admin who approved
   */
  const sendWelcomeNotification = async (user, approvedBy = 'Admin') => {
    if (!user || !user.id) {
      throw new Error('User object with ID is required');
    }

    console.log('🎉 Sending welcome notification to user:', user.id);

    try {      // Customize welcome message based on user role
      const getWelcomeMessage = (role, userName) => {
        const messages = {
          volunteer: {
            title: '🎉 ברוכים הבאים למערכת!',
            content: `שלום ${userName}! חשבון המתנדב שלך אושר. כעת תוכל/י לעיין ולהגיש מועמדות להזדמנויות התנדבות. תודה על הצטרפותך לקהילה שלנו!`
          },
          orgRep: {
            title: '🎉 ברוכים הבאים למערכת!',
            content: `שלום ${userName}! חשבון נציג הארגון שלך אושר. כעת תוכל/י ליצור ולנהל הזדמנויות התנדבות עבור הארגון שלך. ברוכים הבאים!`
          },
          vc: {
            title: '🎉 ברוכים הבאים למערכת!',
            content: `שלום ${userName}! חשבון רכז ההתנדבות שלך אושר. כעת תוכל/י לסייע בניהול פעילויות התנדבות ולתמוך ביוזמות הקהילה שלנו. ברוכים הבאים לצוות!`
          },
          default: {
            title: '🎉 ברוכים הבאים למערכת!',
            content: `שלום ${userName}! חשבונך אושר וכעת תוכל/י לגשת למערכת. ברוכים הבאים לקהילה שלנו!`
          }
        };

        return messages[role] || messages.default;
      };

      const welcomeMessage = getWelcomeMessage(user.role, user.name || 'there');

      const notificationData = {
        type: 'welcome',
        receiverId: String(user.id),
        title: welcomeMessage.title,
        content: welcomeMessage.content,
        date: new Date(),
        metadata: {
          approvedBy: approvedBy,
          userRole: user.role,
          approvalDate: new Date().toISOString()
        }
      };

      const notificationId = await createNotification(notificationData);
      console.log('✅ Welcome notification sent successfully:', notificationId);
      
      return notificationId;
    } catch (error) {
      console.error('❌ Error sending welcome notification:', error);
      throw error;
    }
  };

  /**
   * Send bulk welcome notifications to multiple users
   * @param {Array} users - Array of user objects
   * @param {string} approvedBy - Name/ID of admin who approved
   */
  const sendBulkWelcomeNotifications = async (users, approvedBy = 'Admin') => {
    console.log('🎉 Sending bulk welcome notifications to', users.length, 'users');

    try {
      const notificationPromises = users.map(user => 
        sendWelcomeNotification(user, approvedBy)
      );

      const results = await Promise.allSettled(notificationPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      console.log(`✅ Bulk welcome notifications completed: ${successful.length} successful, ${failed.length} failed`);
      
      if (failed.length > 0) {
        console.error('❌ Failed notifications:', failed.map(f => f.reason));
      }

      return {
        successful: successful.length,
        failed: failed.length,
        results
      };
    } catch (error) {
      console.error('❌ Error sending bulk welcome notifications:', error);
      throw error;
    }
  };

  return {
    sendWelcomeNotification,
    sendBulkWelcomeNotifications
  };
};

/**
 * Standalone utility functions (for use without hooks)
 */

/**
 * Create welcome notification data object
 * @param {Object} user - User object
 * @param {string} approvedBy - Who approved the user
 * @returns {Object} Notification data ready for createNotification
 */
export const createWelcomeNotificationData = (user, approvedBy = 'Admin') => {
  if (!user || !user.id) {
    throw new Error('User object with ID is required');
  }

  const getWelcomeMessage = (role, userName) => {
    const messages = {
      volunteer: {
        title: '🎉 Welcome to the Platform!',
        content: `Hi ${userName}! Your volunteer account has been approved. You can now browse and apply for volunteer opportunities. Thank you for joining our community!`
      },
      orgRep: {
        title: '🎉 Welcome to the Platform!',
        content: `Hi ${userName}! Your organization representative account has been approved. You can now create and manage volunteer opportunities for your organization. Welcome aboard!`
      },
      vc: {
        title: '🎉 Welcome to the Platform!',
        content: `Hi ${userName}! Your volunteer coordinator account has been approved. You can now help manage volunteer activities and support our community initiatives. Welcome to the team!`
      },
      default: {
        title: '🎉 Welcome to the Platform!',
        content: `Hi ${userName}! Your account has been approved and you can now access the platform. Welcome to our community!`
      }
    };

    return messages[role] || messages.default;
  };

  const welcomeMessage = getWelcomeMessage(user.role, user.name || 'there');

  return {
    type: 'welcome',
    receiverId: String(user.id),
    title: welcomeMessage.title,
    content: welcomeMessage.content,
    date: new Date(),
    metadata: {
      approvedBy: approvedBy,
      userRole: user.role,
      approvalDate: new Date().toISOString()
    }
  };
};

/**
 * Enhanced user approval function that includes welcome notification
 * This function should be used in your admin approval logic
 */
export const approveUserWithWelcomeNotification = async (
  userId, 
  updateUserFunction, 
  createNotificationFunction,
  approverName = 'Admin'
) => {
  try {
    console.log('👤 Approving user and sending welcome notification:', userId);

    // First, update the user status to approved
    await updateUserFunction(userId, { status: 'approved' });
    console.log('✅ User status updated to approved');

    // Get the updated user data (you might need to fetch this)
    // This assumes you have a way to get user data after update
    // You'll need to adapt this based on your specific implementation
    
    // Create welcome notification data
    // Note: You'll need to pass the actual user object here
    // This is a placeholder - adapt based on your user data structure
    const user = { id: userId, name: 'User', role: 'volunteer' }; // Replace with actual user fetch
    
    const welcomeNotificationData = createWelcomeNotificationData(user, approverName);
    
    // Send the welcome notification
    const notificationId = await createNotificationFunction(welcomeNotificationData);
    console.log('✅ Welcome notification sent:', notificationId);

    return {
      success: true,
      userId,
      notificationId,
      message: 'User approved and welcome notification sent'
    };
  } catch (error) {
    console.error('❌ Error in user approval with welcome notification:', error);
    throw error;
  }
};