import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useNotifications } from "../../../Contexts/NotificationsContext";
import { useUsers } from "../../../Contexts/UsersContext";
import "./NotificationsPanel.css";

export default function NotificationsPanel() {
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const {
    getNotificationsByReceiver,
    markNotificationAsRead,
    markNotificationAsUnread,
    loading: notificationsLoading,
    error: notificationsError
  } = useNotifications();

  const { currentUser } = useUsers();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const notificationTypeConfig = useMemo(() => ({
    'reminder': { title: 'תזכורת', displayName: 'תזכורת', color: '#ff9800', icon: '🔔' },
    'approval-needed': { title: 'דרוש אישור', displayName: 'דרוש אישור', color: '#f44336', icon: '⚠️' },
    'feedback-notification': { title: 'הוזן פידבק חדש במערכת', displayName: 'פידבק חדש', color: '#4caf50', icon: '💬' },
    'welcome': { title: 'ברוכים הבאים למערכת!', displayName: 'ברוכים הבאים', color: '#2196f3', icon: '🎉' }
  }), []);

  const getNotificationDisplayProps = useCallback((notification) => {
    const config = notificationTypeConfig[notification.type] || {};
    const finalTitle = notification.type === 'feedback-notification'
      ? config.title || notification.title || 'הוזן פידבק חדש במערכת'
      : notification.title || config.title || 'הודעה חדשה';
    return {
      title: finalTitle,
      displayName: config.displayName || notification.type || 'הודעה',
      color: config.color || '#2196f3',
      icon: config.icon || '📄'
    };
  }, [notificationTypeConfig]);

  const formatTime = useCallback((date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    try {
      if (!hasInitialized) setLoading(true);
      const userNotifications = await getNotificationsByReceiver(currentUser.id);
      const transformed = userNotifications.map(notif => {
        const props = getNotificationDisplayProps(notif);
        return {
          id: notif.id,
          title: props.title,
          message: notif.content,
          time: formatTime(notif.date),
          date: formatDate(notif.date),
          read: notif.read,
          type: notif.type,
          originalDate: notif.date,
          displayName: props.displayName,
          color: props.color,
          icon: props.icon
        };
      });
      const sorted = transformed.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
      setNotifications(sorted);
      if (sorted.length > 0 && !selectedNotification) setSelectedNotification(sorted[0]);
      setHasInitialized(true);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, getNotificationsByReceiver, formatTime, formatDate, hasInitialized, selectedNotification, getNotificationDisplayProps]);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser?.id]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === "read") return n.read;
      if (filter === "unread") return !n.read;
      return true;
    });
  }, [notifications, filter]);

  const notificationCounts = useMemo(() => ({
    all: notifications.length,
    read: notifications.filter(n => n.read).length,
    unread: notifications.filter(n => !n.read).length
  }), [notifications]);

  const toggleReadStatus = useCallback(async (id, readStatus) => {
    try {
      if (readStatus) await markNotificationAsRead(id);
      else await markNotificationAsUnread(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: readStatus } : n));
      if (selectedNotification?.id === id) setSelectedNotification(prev => ({ ...prev, read: readStatus }));
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }, [markNotificationAsRead, markNotificationAsUnread, selectedNotification]);

  const handleNotificationSelect = useCallback(async (notif) => {
    setSelectedNotification(notif);
    if (!notif.read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setSelectedNotification(prev => ({ ...prev, read: true }));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  }, [markNotificationAsRead]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-dropdown') && !e.target.closest('.notifications-item-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  /*ajout test */
  useEffect(() => {
  const handleScroll = () => {
    if (openMenuId) {
      setOpenMenuId(null);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, [openMenuId]);

/*/fin test*/


  if (loading && !hasInitialized) {
    return <div className="notifications-panel-container"><div className="notifications-loading"><p>טוען הודעות...</p></div></div>;
  }

  if (notificationsError) {
    return <div className="notifications-panel-container"><div className="notifications-error"><p>שגיאה בטעינת ההודעות: {notificationsError}</p></div></div>;
  }

  if (!currentUser) {
    return <div className="notifications-panel-container"><div className="notifications-no-user"><p>יש להתחבר כדי לראות הודעות</p></div></div>;
  }

  return (
    <div className="notifications-panel-container">
      <div className="notifications-main">
        {selectedNotification && (
          <>
            <h2 className="notifications-title">{selectedNotification.title}</h2>
            <div className="notifications-time">{selectedNotification.time} | {selectedNotification.date}</div>
            <div className="notifications-content">
              <p className="notifications-message">{selectedNotification.message}</p>
              {selectedNotification.type && (
                <div className="notifications-type">
                  <span className={`type-badge ${selectedNotification.type}`}>{selectedNotification.icon} {selectedNotification.displayName}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="notifications-sidebar">
        <div className="notifications-filters">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>הכל ({notificationCounts.all})</button>
          <button className={filter === "read" ? "active" : ""} onClick={() => setFilter("read")}>נקראו ({notificationCounts.read})</button>
          <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>לא נקראו ({notificationCounts.unread})</button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.map(notif => (
            <div key={notif.id} className={`notifications-item ${selectedNotification?.id === notif.id ? "selected" : ""} ${!notif.read ? "unread" : ""}`}>
              <div onClick={() => handleNotificationSelect(notif)}>
                <div className="notifications-item-time">{notif.time} | {notif.date}</div>
                <div className="notifications-item-title">
                  <span className={`read-icon ${notif.read ? "read" : "unread"}`}>{notif.read ? "✅" : notif.icon}</span>
                  <span className="title-text">{notif.title}</span>
                  {notif.type && <span className={`type-indicator ${notif.type}`} style={{ backgroundColor: notif.color }}></span>}
                </div>
              </div>

              <div
                className="notifications-item-menu"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 160});
                  setOpenMenuId(openMenuId === notif.id ? null : notif.id);
                }}
              >
                ⋮
              </div>

              {selectedNotification?.id === notif.id && (
                <div className="notifications-item-expanded-content">
                  <p>{notif.message}</p>
                  {notif.type && (
                    <div className="notifications-type">
                      <span className={`type-badge ${notif.type}`}>{notif.icon} {notif.displayName}</span>
                    </div>
                  )}
                </div>
              )}

              {openMenuId === notif.id && ReactDOM.createPortal(
                <div
                  className="menu-dropdown"
                  style={{
                    position: "absolute",
                    top: `${menuCoords.top}px`,
                    left: `${menuCoords.left}px`,
                    zIndex: 9999
                  }}
                >
                  <div className="menu-item" onClick={(e) => { e.stopPropagation(); toggleReadStatus(notif.id, true); }}>סמן כנקרא</div>
                  <div className="menu-item" onClick={(e) => { e.stopPropagation(); toggleReadStatus(notif.id, false); }}>סמן כלא נקרא</div>
                </div>,
                document.body
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
