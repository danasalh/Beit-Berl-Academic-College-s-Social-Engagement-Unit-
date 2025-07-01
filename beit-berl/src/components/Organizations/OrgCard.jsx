import { HiLocationMarker } from 'react-icons/hi';

const OrgCard = ({ org, onShowDetails, allUsers = [], isVolunteer = false }) => {
  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper function to get city value - handles different possible field names
  const getCityValue = (org) => {
    // Check all possible variations of city field
    return org.City || org.city || org.CITY || org.location || org.Location || '';
  };

  // Calculate number of volunteers based on current user roles and orgId
  const calculateVolunteerCount = (organization) => {
    if (!allUsers || !Array.isArray(allUsers) || !organization.id) {
      return 0;
    }

    const volunteers = allUsers.filter(user => {
      // Check if user is a volunteer
      const isVolunteer = user.role === "volunteer" || user.role === "Volunteer";
      
      if (!isVolunteer) return false;

      // Check if user's orgId array contains this organization's id
      const userOrgIds = Array.isArray(user.orgId) ? user.orgId : [];
      return userOrgIds.includes(organization.id);
    });

    return volunteers.length;
  };

  const volunteerCount = calculateVolunteerCount(org);

  return (
    <div className="org-card">
      <div className="org-card-header">
        <div className="city-info">
          <HiLocationMarker className="location-icon" />
          <span className="city-text">
            {getCityValue(org) || 'עיר לא צוינה'}
          </span>
        </div>
      </div>
      
      <h3 className="org-name">
        {org.name || 'שם הארגון'}
      </h3>
      
      <p className="org-description">
        {truncateText(org.description) || 'אין תיאור זמין'}
      </p>
      
      {org.description && org.description.length > 100 && (
        <p className="org-description-continued">
          ...
        </p>
      )}

      {/* Only show volunteer count if user is NOT a volunteer */}
      {!isVolunteer && (
        <div className="org-stats">
          <span className="volunteer-count">
            מתנדבים פעילים: {volunteerCount}
          </span>
        </div>
      )}
      
      <button 
        onClick={() => onShowDetails(org)}
        className="details-button"
      >
        פרטים נוספים
      </button>
    </div>
  );
};

export default OrgCard;