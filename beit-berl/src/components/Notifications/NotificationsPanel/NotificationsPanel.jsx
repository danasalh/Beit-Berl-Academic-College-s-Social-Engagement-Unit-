import React, { useState, useEffect } from "react";
import { useNotifications } from "../../../contexts/NotificationsContext";
import { useUsers } from "../../../contexts/UsersContext";
import "./NotificationsPanel.css";

export default function NotificationsPanel() {
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Get context functions and state
  const {
    getNotificationsByReceiver,
    markNotificationAsRead,
    markNotificationAsUnread,
    loading: notificationsLoading,
    error: notificationsError
  } = useNotifications();

  const { currentUser } = useUsers();

  // Local state for notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications when component mounts or currentUser changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.id) {
        console.log('No current user found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching notifications for user:', currentUser.id);
        
        const userNotifications = await getNotificationsByReceiver(currentUser.id);
        
        // Transform notifications to match the expected format
        const transformedNotifications = userNotifications.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.content, // Map 'content' to 'message' for compatibility
          time: formatTime(notif.date),
          date: formatDate(notif.date),
          read: notif.read,
          type: notif.type,
          originalDate: notif.date // Keep original date for sorting
        }));

        setNotifications(transformedNotifications);
        
        // Set the first notification as selected if none is selected
        if (transformedNotifications.length > 0 && !selectedNotification) {
          setSelectedNotification(transformedNotifications[0]);
        }
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser?.id, getNotificationsByReceiver]);

  // Helper functions to format date and time
  const formatTime = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "read") return n.read;
    if (filter === "unread") return !n.read;
    return true;
  });

  // Handle read/unread status toggle
  const toggleReadStatus = async (id, readStatus) => {
    try {
      if (readStatus) {
        await markNotificationAsRead(id);
      } else {
        await markNotificationAsUnread(id);
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: readStatus } : notif
        )
      );

      // Update selected notification if it's the one being changed
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(prev => ({ ...prev, read: readStatus }));
      }

      setOpenMenuId(null);
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  };

  // Handle notification selection and mark as read
  const handleNotificationSelect = async (notif) => {
    setSelectedNotification(notif);
    
    // Mark as read if it's unread
    if (!notif.read) {
      try {
        await markNotificationAsRead(notif.id);
        
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notif.id ? { ...n, read: true } : n
          )
        );
        
        // Update selected notification
        setSelectedNotification(prev => ({ ...prev, read: true }));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  // Loading state
  if (loading || notificationsLoading) {
    return (
      <div className="notifications-panel-container">
        <div className="notifications-loading">
          <p>טוען הודעות...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (notificationsError) {
    return (
      <div className="notifications-panel-container">
        <div className="notifications-error">
          <p>שגיאה בטעינת ההודעות: {notificationsError}</p>
        </div>
      </div>
    );
  }

  // No user state
  if (!currentUser) {
    return (
      <div className="notifications-panel-container">
        <div className="notifications-no-user">
          <p>יש להתחבר כדי לראות הודעות</p>
        </div>
      </div>
    );
  }

  // No notifications state
  if (notifications.length === 0) {
    return (
      <div className="notifications-panel-container">
        <div className="notifications-empty">
          <h2>אין הודעות</h2>
          <p>כרגע אין לך הודעות חדשות</p>
        </div>
      </div>
    );
  }

  // No filtered notifications
  if (filteredNotifications.length === 0) {
    return (
      <div className="notifications-panel-container">
        <div className="notifications-sidebar">
          <div className="notifications-filters">
            <button 
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              הכל ({notifications.length})
            </button>
            <button 
              className={filter === "read" ? "active" : ""}
              onClick={() => setFilter("read")}
            >
              נקראו ({notifications.filter(n => n.read).length})
            </button>
            <button 
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              לא נקראו ({notifications.filter(n => !n.read).length})
            </button>
          </div>
          <div className="notifications-empty-filter">
            <p>אין הודעות בקטגוריה זו</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-panel-container">
      {/* Main notification display */}
      <div className="notifications-main">
        {selectedNotification ? (
          <>
            <h2 className="notifications-title">{selectedNotification.title}</h2>
            <div className="notifications-time">
              {selectedNotification.time} | {selectedNotification.date}
            </div>
            <div className="notifications-content">
              <p className="notifications-message">
                {selectedNotification.message}
              </p>
              {selectedNotification.type && (
                <div className="notifications-type">
                  <span className={`type-badge ${selectedNotification.type}`}>
                    {selectedNotification.type === 'reminder' ? 'תזכורת' : 
                     selectedNotification.type === 'approval-needed' ? 'דרוש אישור' : 
                     selectedNotification.type}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="notifications-select-prompt">
            <p>בחר הודעה לצפייה</p>
          </div>
        )}
      </div>

      {/* Sidebar with notifications list */}
      <div className="notifications-sidebar">
        <div className="notifications-filters">
          <button 
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            הכל ({notifications.length})
          </button>
          <button 
            className={filter === "read" ? "active" : ""}
            onClick={() => setFilter("read")}
          >
            נקראו ({notifications.filter(n => n.read).length})
          </button>
          <button 
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            לא נקראו ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notifications-item ${
                selectedNotification?.id === notif.id ? "selected" : ""
              } ${!notif.read ? "unread" : ""}`}
            >
              <div onClick={() => handleNotificationSelect(notif)}>
                <div className="notifications-item-time">
                  {notif.time} | {notif.date}
                </div>
                <div className="notifications-item-title">
                  <span className={`read-icon ${notif.read ? "read" : "unread"}`}>
                    {notif.read ? "✅" : "📩"}
                  </span>
                  <span className="title-text">{notif.title}</span>
                  {notif.type && (
                    <span className={`type-indicator ${notif.type}`}></span>
                  )}
                </div>
              </div>

              {/* Dropdown menu */}
              <div
                className="notifications-item-menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === notif.id ? null : notif.id);
                }}
              >
                ⋮
                {openMenuId === notif.id && (
                  <div className="menu-dropdown">
                    <div
                      className="menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReadStatus(notif.id, true);
                      }}
                    >
                      סמן כנקרא
                    </div>
                    <div
                      className="menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReadStatus(notif.id, false);
                      }}
                    >
                      סמן כלא נקרא
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}