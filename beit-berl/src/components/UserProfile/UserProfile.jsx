// src/components/UserProfile/UserProfile.jsx
import './UserProfile.css';

const UserProfile = ({ user, onClose }) => {
  // Ensure user exists
  if (!user) {
    return null; // Don't render anything if no user
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Profile</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="profile-section">
            <div className="profile-avatar">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : 
               user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <h4>{user.firstName || 'Unknown'} {user.lastName || ''}</h4>
          </div>
          <div className="profile-details">
            <div className="detail-group">
              <label>User ID:</label>
              <span>{user.id || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>First Name:</label>
              <span>{user.firstName || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>Last Name:</label>
              <span>{user.lastName || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>Email:</label>
              <span>{user.email || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>Phone Number:</label>
              <span>{user.phoneNumber || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>Role:</label>
              <span className={`role-badge ${user.role}`}>
                {user.role || 'N/A'}
              </span>
            </div>
            <div className="detail-group">
              <label>Status:</label>
              <span className={`status-badge ${user.status}`}>
                {user.status}
              </span>
            </div>
            <div className="detail-group">
              <label>Created At:</label>
              <span>{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;