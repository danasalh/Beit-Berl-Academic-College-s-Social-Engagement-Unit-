// src/components/pages/volunteer/notifications/VcNotifications.jsx
import NotificationsPanel from '../../../Notifications/NotificationsPanel/NotificationsPanel';
import './VolunteerNotifications.css';

export default function VolunteerNotifications() {
  return (
    <div className="volunteer-notifications-root">
      <div
        style={{
          fontSize: '2.2rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#0077c2',
          textAlign: 'center',
          width: '100%',
          maxWidth: 600,
          textShadow: '0 0 16px #90caf9, 0 0 8px #90caf9',
          animation: 'glow 2s ease-in-out infinite alternate',
        }}
      >
        התראות
      </div>
      <style>
        {`
          @keyframes glow {
            from {
              text-shadow: 0 0 4px #90caf9, 0 0 2px #90caf9;
            }
            to {
              text-shadow: 0 0 24px #42a5f5, 0 0 12px #42a5f5;
            }
          }
        `}
      </style>
      <div className="notifications-panel-wrapper">
        <NotificationsPanel />
      </div>
    </div>
  );
}
