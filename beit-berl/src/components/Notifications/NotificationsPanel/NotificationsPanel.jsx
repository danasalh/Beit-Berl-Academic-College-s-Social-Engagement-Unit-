import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifications } from "../../../Contexts/NotificationsContext";
import { useUsers } from "../../../Contexts/UsersContext";
import "./NotificationsPanel.css";

export default function NotificationsPanel() {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // New type filter
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showTypeFilter, setShowTypeFilter] = useState(false); // Toggle for mobile

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
  const [hasInitialized, setHasInitialized] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({});

  // Notification type configurations - contains titles and display info
  const notificationTypeConfig = useMemo(() => ({
    'reminder': {
      title: 'תזכורת',
      displayName: 'תזכורת',
      color: '#ff9800',
      icon: '🔔'
    },
    'approval-needed': {
      title: 'דרוש אישור',
      displayName: 'דרוש אישור',
      color: '#f44336',
      icon: '⚠️'
    },
    'feedback-notification': {
      title: 'הוזן פידבק חדש במערכת',
      displayName: 'פידבק חדש',
      color: '#4caf50',
      icon: '💬'
    },
    'welcome': {
      title: 'ברוכים הבאים למערכת!',
      displayName: 'ברוכים הבאים',
      color: '#2196f3',
      icon: '🎉'
    },
    'hours-status': {
      title: 'עדכון על שעות התנדבות',
      displayName: 'סטטוס שעות',
      color: '#d1e725',
      icon: '⏰'
    },
    'volunteer-completed': {
      title: 'מתנדב השלים 60 שעות התנדבות',
      displayName: 'השלמת התנדבות',
      color: '#9c27b0',
      icon: '🎓'
    }
  }), []);

  // Get available notification types from current notifications
  const availableTypes = useMemo(() => {
    const types = [...new Set(notifications.map(n => n.type).filter(Boolean))];
    return types.map(type => ({
      value: type,
      ...notificationTypeConfig[type],
      count: notifications.filter(n => n.type === type).length
    }));
  }, [notifications, notificationTypeConfig]);

  // Helper function to get notification display properties
  const getNotificationDisplayProps = useCallback((notification) => {
    const config = notificationTypeConfig[notification.type] || {};

    // For feedback-notification, prioritize the config title over notification.title
    let finalTitle;
    if (notification.type === 'feedback-notification') {
      finalTitle = config.title || notification.title || 'הוזן פידבק חדש במערכת';
    } else if (notification.type === 'volunteer-completed') {
      // For volunteer-completed, use the dynamic title from the notification if available
      finalTitle = notification.title || config.title || 'מתנדב השלים 60 שעות התנדבות';
    } else {
      finalTitle = notification.title || config.title || 'הודעה חדשה';
    }

    return {
      title: finalTitle,
      displayName: config.displayName || notification.type || 'הודעה',
      color: config.color || '#2196f3',
      icon: config.icon || '📄'
    };
  }, [notificationTypeConfig]);

  // Helper functions to format date and time - memoized to prevent recreating on every render
  const formatTime = useCallback((date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }, []);

  // Memoized fetch function to prevent recreating on every render
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      console.log('No current user found');
      setLoading(false);
      return;
    }

    try {
      // Only show loading on initial load, not on subsequent updates
      if (!hasInitialized) {
        setLoading(true);
      }

      console.log('Fetching notifications for user:', currentUser.id);

      const userNotifications = await getNotificationsByReceiver(currentUser.id);

      // Transform notifications to match the expected format
      const transformedNotifications = userNotifications.map(notif => {
        const displayProps = getNotificationDisplayProps(notif);

        return {
          id: notif.id,
          title: displayProps.title,
          message: notif.content,
          time: formatTime(notif.date),
          date: formatDate(notif.date),
          read: notif.read,
          type: notif.type,
          originalDate: notif.date,
          displayName: displayProps.displayName,
          color: displayProps.color,
          icon: displayProps.icon,
          // Include metadata for volunteer-completed notifications
          metadata: notif.metadata || null
        };
      });

      // Sort notifications by date (newest first)
      const sortedNotifications = transformedNotifications.sort((a, b) => {
        return new Date(b.originalDate) - new Date(a.originalDate);
      });

      setNotifications(sortedNotifications);

      // Set the first notification as selected if none is selected and we have notifications
      if (sortedNotifications.length > 0 && !selectedNotification) {
        setSelectedNotification(sortedNotifications[0]);
      }

      setHasInitialized(true);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, getNotificationsByReceiver, formatTime, formatDate, hasInitialized, selectedNotification, getNotificationDisplayProps]);

  // Fetch notifications when component mounts or when currentUser.id changes
  useEffect(() => {
    fetchNotifications();
  }, [currentUser?.id]); // Only depend on currentUser.id, not the entire fetchNotifications function

  // Filter notifications based on selected filters - memoized for performance
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Read/unread filter
      let passesReadFilter = true;
      if (filter === "read") passesReadFilter = n.read;
      if (filter === "unread") passesReadFilter = !n.read;

      // Type filter
      let passesTypeFilter = true;
      if (typeFilter !== "all") passesTypeFilter = n.type === typeFilter;

      return passesReadFilter && passesTypeFilter;
    });
  }, [notifications, filter, typeFilter]);

  // Memoized count calculations
  const notificationCounts = useMemo(() => ({
    all: notifications.length,
    read: notifications.filter(n => n.read).length,
    unread: notifications.filter(n => !n.read).length
  }), [notifications]);

  // Handle read/unread status toggle
  const toggleReadStatus = useCallback(async (id, readStatus) => {
    console.log('toggleReadStatus called:', { id, readStatus });

    try {
      if (readStatus) {
        await markNotificationAsRead(id);
      } else {
        await markNotificationAsUnread(id);
      }

      // Update local state
      setNotifications(prev => {
        const updated = prev.map(notif =>
          notif.id === id ? { ...notif, read: readStatus } : notif
        );
        console.log('Updated notifications state:', updated);
        return updated;
      });

      // Update selected notification if it's the one being changed
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(prev => ({ ...prev, read: readStatus }));
      }

      // Close the dropdown
      setOpenMenuId(null);

      console.log('Successfully updated notification status');
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }, [markNotificationAsRead, markNotificationAsUnread, selectedNotification]);

  // Handle notification selection and mark as read
  const handleNotificationSelect = useCallback(async (notif) => {
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
  }, [markNotificationAsRead]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the menu button and dropdown
      if (openMenuId &&
        !event.target.closest('.notifications-item-menu') &&
        !event.target.closest('.menu-dropdown')) {
        setOpenMenuId(null);
      }
    };

    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    const handleResize = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [openMenuId]);

  // Helper function to render notification content based on type
  const renderNotificationContent = useCallback((notification) => {
    const baseContent = (
      <>
        <p className="notifications-message">{notification.message}</p>
        {notification.type && (
          <div className="notifications-type">
            <span className={`type-badge ${notification.type}`}>
              {notification.icon} {notification.displayName}
            </span>
          </div>
        )}
      </>
    );

    // Add extra details for volunteer-completed notifications
    if (notification.type === 'volunteer-completed' && notification.metadata) {
      const { volunteerName, volunteerEmail, completionDate } = notification.metadata;

      return (
        <>
          {baseContent}
          <div className="notification-details volunteer-completed-details">
            <h4>פרטי המתנדב:</h4>
            <div className="detail-item">
              <strong>שם:</strong> {volunteerName || 'לא צוין'}
            </div>
            <div className="detail-item">
              <strong>אימייל:</strong> {volunteerEmail || 'לא צוין'}
            </div>
            <div className="detail-item">
              <strong>תאריך השלמה:</strong> {completionDate ? new Date(completionDate).toLocaleDateString('he-IL') : 'לא צוין'}
            </div>
          </div>
        </>
      );
    }

    return baseContent;
  }, []);

  // Loading state - only show on initial load
  if (loading && !hasInitialized) {
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
  if (notifications.length === 0 && hasInitialized) {
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
  if (filteredNotifications.length === 0 && hasInitialized) {
    return (
      <div className="notifications-panel-container">
        <div className="notifications-sidebar">
          <div className="notifications-filters">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              הכל ({notificationCounts.all})
            </button>
            <button
              className={filter === "read" ? "active" : ""}
              onClick={() => setFilter("read")}
            >
              נקראו ({notificationCounts.read})
            </button>
            <button
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              לא נקראו ({notificationCounts.unread})
            </button>
          </div>

          {/* Type Filter */}
          <div className="notifications-type-filters">
            <div className="type-filter-header">
              <button 
                className="type-filter-toggle"
                onClick={() => setShowTypeFilter(!showTypeFilter)}
              >
                <span>סינון לפי סוג</span>
                <span className={`toggle-icon ${showTypeFilter ? 'open' : ''}`}>▼</span>
              </button>
            </div>
            
            <div className={`type-filter-content ${showTypeFilter ? 'show' : ''}`}>
              <button
                className={`type-filter-btn ${typeFilter === "all" ? "active" : ""}`}
                onClick={() => setTypeFilter("all")}
              >
                <span className="type-icon">📋</span>
                <span>הכל</span>
                <span className="count">({notifications.length})</span>
              </button>
              
              {availableTypes.map(type => (
                <button
                  key={type.value}
                  className={`type-filter-btn ${typeFilter === type.value ? "active" : ""}`}
                  onClick={() => setTypeFilter(type.value)}
                  style={{ '--type-color': type.color }}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span>{type.displayName}</span>
                  <span className="count">({type.count})</span>
                </button>
              ))}
            </div>
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
        {selectedNotification && (
          <>
            <h2 className="notifications-title">{selectedNotification.title}</h2>
            <div className="notifications-time">
              {selectedNotification.time} | {selectedNotification.date}
            </div>
            <div className="notifications-content">
              {renderNotificationContent(selectedNotification)}
            </div>
          </>
        )}
      </div>

      {/* Sidebar with notifications list */}
      <div className="notifications-sidebar">
        <div className="notifications-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            הכל ({notificationCounts.all})
          </button>
          <button
            className={filter === "read" ? "active" : ""}
            onClick={() => setFilter("read")}
          >
            נקראו ({notificationCounts.read})
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            לא נקראו ({notificationCounts.unread})
          </button>
        </div>

        {/* Type Filter */}
        <div className="notifications-type-filters">
          <div className="type-filter-header">
            <button 
              className="type-filter-toggle"
              onClick={() => setShowTypeFilter(!showTypeFilter)}
            >
              <span>סינון לפי סוג</span>
              <span className={`toggle-icon ${showTypeFilter ? 'open' : ''}`}>▼</span>
            </button>
          </div>
          
          <div className={`type-filter-content ${showTypeFilter ? 'show' : ''}`}>
            <button
              className={`type-filter-btn ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              <span className="type-icon">📋</span>
              <span>הכל</span>
              <span className="count">({notifications.length})</span>
            </button>
            
            {availableTypes.map(type => (
              <button
                key={type.value}
                className={`type-filter-btn ${typeFilter === type.value ? "active" : ""}`}
                onClick={() => setTypeFilter(type.value)}
                style={{ '--type-color': type.color }}
              >
                <span className="type-icon">{type.icon}</span>
                <span>{type.displayName}</span>
                <span className="count">({type.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="notifications-list">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notifications-item ${selectedNotification?.id === notif.id ? "selected" : ""
                } ${!notif.read ? "unread" : ""} ${notif.type === 'volunteer-completed' ? 'volunteer-completed-item' : ''}`}
            >
              <div onClick={() => handleNotificationSelect(notif)}>
                <div className="notifications-item-time">
                  {notif.time} | {notif.date}
                </div>
                <div className="notifications-item-title">
                  <span className={`read-icon ${notif.read ? "read" : "unread"}`}>
                    {notif.read ? "✅" : notif.icon}
                  </span>
                  <span className="title-text">{notif.title}</span>
                  {notif.type && (
                    <span
                      className={`type-indicator ${notif.type}`}
                      style={{ backgroundColor: notif.color }}
                    ></span>
                  )}
                </div>
              </div>

              {/* Dropdown menu */}
              <div
                className="notifications-item-menu"
                onClick={(e) => {
                  e.stopPropagation();

                  if (openMenuId === notif.id) {
                    setOpenMenuId(null);
                  } else {
                    // Calculate position for fixed positioning
                    const rect = e.currentTarget.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                    setDropdownPosition({
                      top: rect.bottom + scrollTop,
                      right: window.innerWidth - rect.right,
                    });

                    setOpenMenuId(notif.id);
                  }
                }}
              >
                ⋮
              </div>

              {/* Render dropdown outside of the menu button but still inside the item */}
              {openMenuId === notif.id && (
                <div
                  className="menu-dropdown"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    zIndex: 1000
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="menu-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      console.log('Mark as read clicked for notification:', notif.id);
                      await toggleReadStatus(notif.id, true);
                    }}
                  >
                    סמן כנקרא
                  </div>
                  <div
                    className="menu-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      console.log('Mark as unread clicked for notification:', notif.id);
                      await toggleReadStatus(notif.id, false);
                    }}
                  >
                    סמן כלא נקרא
                  </div>
                </div>
              )}

              {/* Show expanded content on mobile under item */}
              {selectedNotification?.id === notif.id && (
                <div className="notifications-item-expanded-content">
                  {renderNotificationContent(notif)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}