import React, { useState } from "react";
import "./NotificationsPanel.css";

const notificationsDataInitial = [
  {
    id: 1,
    title: "שים לב: הסטודנט X השלים 60 שעות התנדבות",
    message: `שלום סרה,
לידיעתך, הסטודנט <שם> השלים 60 שעות התנדבות והושלם את טופס סיום ההתנדבות.
לאחר אישור סיום ההתנדבות עבור הסטודנט, יש להפוך את הסטטוס ל"לא פעיל" ע"י לחיצה כאן.
למעבר לפרופיל הסטודנט: לחץ כאן`,
    time: "10:39",
    date: "05/04/24",
    read: false,
  },
  {
    id: 2,
    title: "הודעה חדשה ממנהל המערכת",
    message: "שלום, יש לעדכן את פרטי ההתנדבות לשנה החדשה.",
    time: "09:15",
    date: "05/04/24",
    read: true,
  },
];

export default function NotificationsPanel() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState(notificationsDataInitial);
  const [selectedNotification, setSelectedNotification] = useState(notifications[0]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "read") return n.read;
    if (filter === "unread") return !n.read;
    return true;
  });

  const toggleReadStatus = (id, readStatus) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: readStatus } : notif
      )
    );
    setOpenMenuId(null);
  };

  return (
    <div className="notifications-panel-container">
      {/* Zone principale */}
      <div className="notifications-main">
        <h2 className="notifications-title">{selectedNotification.title}</h2>
        <div className="notifications-time">
          {selectedNotification.time} | {selectedNotification.date}
        </div>
        <p className="notifications-message">{selectedNotification.message}</p>
      </div>

      {/* Sidebar */}
      <div className="notifications-sidebar">
        <div className="notifications-filters">
          <button onClick={() => setFilter("all")}>הכל</button>
          <button onClick={() => setFilter("read")}>נקראו</button>
          <button onClick={() => setFilter("unread")}>לא נקראו</button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notifications-item ${
                selectedNotification.id === notif.id ? "selected" : ""
              }`}
            >
              <div onClick={() => setSelectedNotification(notif)}>
                <div className="notifications-item-time">
                  {notif.time} | {notif.date}
                </div>
                <div className="notifications-item-title">
                  <span className={`read-icon ${notif.read ? "read" : "unread"}`}>
                    {notif.read ? "✅" : "📩"}
                  </span>
                  {notif.title}
                </div>
              </div>

              {/* Menu déroulant */}
              <div
                className="notifications-item-menu"
                onClick={() =>
                  setOpenMenuId(openMenuId === notif.id ? null : notif.id)
                }
              >
                ⋮
                {openMenuId === notif.id && (
                  <div className="menu-dropdown">
                    <div
                      className="menu-item"
                      onClick={() => toggleReadStatus(notif.id, true)}
                    >
                      סמן כנקרא
                    </div>
                    <div
                      className="menu-item"
                      onClick={() => toggleReadStatus(notif.id, false)}
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
