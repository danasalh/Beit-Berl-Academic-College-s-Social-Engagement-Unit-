import { getRoleLabel } from '../../utils/roleTranslations';
import { useUsers } from '../../Contexts/UsersContext'; // Import the useUsers hook
import './UserProfile.css';

const UserProfile = ({ user, organizations = [], onClose, onFeedback }) => {
  const { currentUser } = useUsers(); // Get current logged-in user

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

  // Helper function to get organization names from IDs
  const getOrganizationNames = (orgIds) => {
    if (!orgIds) return 'N/A';

    // Handle single orgId (backward compatibility)
    if (typeof orgIds === 'string' || typeof orgIds === 'number') {
      const org = organizations.find(o => o.id === orgIds || o.id === parseInt(orgIds));
      return org ? org.name || `Org ${org.id}` : `Unknown Org (${orgIds})`;
    }

    // Handle array of orgIds
    if (Array.isArray(orgIds)) {
      if (orgIds.length === 0) return 'N/A';

      const orgNames = orgIds.map(orgId => {
        const org = organizations.find(o => o.id === orgId || o.id === parseInt(orgId));
        return org ? org.name || `Org ${org.id}` : `Unknown Org (${orgId})`;
      });

      return orgNames.join(', ');
    }

    return 'N/A';
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>פרופיל המשתמש</h3>
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
              <label>שם פרטי:</label>
              <span>{user.firstName || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>שם משפחה:</label>
              <span>{user.lastName || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>כתובת דוא"ל:</label>
              <span>{user.email || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>מספר טלפון:</label>
              <span>{user.phoneNumber || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <label>תפקיד:</label>
              <span className={`role-badge ${user.role}`}>
                {getRoleLabel(user.role) || 'לא מוגדר'}
              </span>
            </div>
            <div className="detail-group">
              <label>ארגונים משוייכים:</label>
              <span className="organizations-list">
                {getOrganizationNames(user.orgId)}
              </span>
            </div>
            <div className="detail-group">
              <label>סטטוס:</label>
              <span className={`status-badge ${user.status}`}>
                {user.status}
              </span>
            </div>
            <div className="detail-group">
              <label>תאריך יצירה:</label>
              <span>{formatDate(user.createdAt)}</span>
            </div>
          </div>
          {/* Feedback Section - Only show for volunteers AND if current user is admin */}
          {user.role === 'volunteer' && isAdmin && (
            <div className="form-row">
              <div className="form-group feedback-group">
                <div className="feedback-controls">
                  <p className="feedback-description">
                    הוסף או צפה בפידבק של המתנדב:
                  </p>
                  <button
                    type="button"
                    className="btn btn-feedback"
                    onClick={() => onFeedback(user)}
                  >
                    צפייה והוספת פידבק
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;