import Settings from '../../../Settings/Settings';
import UserProfile from '../../../UserProfile/UserProfile';

export default function AdminSettings() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin settings</h1>
      <p>Welcome to the admin settings.</p>
      <Settings/>
    </div>
  );
}
