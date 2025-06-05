import NotificationsPanel from '../../../Notifications/NotificationsPanel/NotificationsPanel';

export default function AdminNotifications() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Notifications</h1>
      <p>This is where admin notifications will be displayed.</p>
      <NotificationsPanel />
      <p>Additional admin functionalities can be added here.</p>
    </div>
  );
}
