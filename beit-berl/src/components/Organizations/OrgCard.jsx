import React from 'react';
import { HiLocationMarker } from 'react-icons/hi';

const OrgCard = ({ org, onShowDetails }) => {
  return (
    <div className="org-card">
      <div className="org-card-header">
        <div className="city-info">
          <HiLocationMarker  className="location-icon" />
          <span className="city-text">עיר</span>
        </div>
      </div>
      
      <h3 className="org-name">
        {`<${org.name}>`}
      </h3>
      
      <p className="org-description">
        {org.description}
      </p>
      
      <p className="org-description-continued">
        ...{org.description}
      </p>
      
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