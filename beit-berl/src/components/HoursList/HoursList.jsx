import { useState, useEffect, useCallback, useRef } from 'react';
import { useVolunteerHours } from '../../Contexts/VolunteerHoursContext';
import { useUsers } from '../../Contexts/UsersContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import { HiOutlineClock, HiOutlineExclamation, HiRefresh } from 'react-icons/hi';
import HoursData from '../HoursData/HoursData';
import './HoursList.css';

const HoursList = () => {
  const { getVolunteerHours } = useVolunteerHours();
  const { getUserById, currentUser } = useUsers();
  const { organizations } = useOrganizations();

  const [pendingHoursData, setPendingHoursData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showHoursModal, setShowHoursModal] = useState(false);
  
  // Use ref to track if initial load has been triggered
  const initialLoadTriggered = useRef(false);

  // Check if current user can approve hours for a specific organization
  const canApproveForOrg = useCallback((orgId) => {
    if (!currentUser) return false;
    
    // Admin can approve all hours
    if (currentUser.role === 'admin') return true;
    
    // OrgRep or VC can approve only for their organizations
    if (currentUser.role === 'orgRep' || currentUser.role === 'vc') {
      // Check if user has the same orgId
      if (Array.isArray(currentUser.orgId)) {
        return currentUser.orgId.includes(Number(orgId));
      }
      return Number(currentUser.orgId) === Number(orgId);
    }
    
    return false;
  }, [currentUser]);

  // Get organization name by ID
  const getOrganizationName = useCallback((orgId) => {
    const org = organizations.find(o => o.id === Number(orgId));
    return org ? org.name || `Org ${orgId}` : `Unknown Org (${orgId})`;
  }, [organizations]);

  // Fetch pending hours data
  const fetchPendingHours = useCallback(async (isRefresh = false) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      // Get all volunteer hours
      const allHours = await getVolunteerHours();

      // Filter for pending hours that the current user can approve
      const pendingHours = allHours.filter(record => 
        !record.approved && canApproveForOrg(record.orgId)
      );
      // Group pending hours by volunteer ID and get volunteer details
      const volunteersMap = new Map();

      for (const hoursRecord of pendingHours) {
        const volunteerId = hoursRecord.volunteerId;
        
        if (!volunteersMap.has(volunteerId)) {
          // Fetch volunteer details
          try {
            const volunteerData = await getUserById(volunteerId);
            if (volunteerData) {
              volunteersMap.set(volunteerId, {
                volunteer: volunteerData,
                pendingRecords: [],
                totalPendingHours: 0
              });
            }
          } catch (err) {
            console.warn(`⚠️ Could not fetch volunteer data for ID: ${volunteerId}`);
            // Create a placeholder for unknown volunteers
            volunteersMap.set(volunteerId, {
              volunteer: {
                id: volunteerId,
                firstName: 'Unknown',
                lastName: 'Volunteer',
                email: `volunteer-${volunteerId}`
              },
              pendingRecords: [],
              totalPendingHours: 0
            });
          }
        }

        // Add hours record to volunteer's pending list
        const volunteerEntry = volunteersMap.get(volunteerId);
        volunteerEntry.pendingRecords.push(hoursRecord);
        volunteerEntry.totalPendingHours += Number(hoursRecord.hours || 0);
      }

      // Convert map to array and sort by total pending hours (descending)
      const pendingData = Array.from(volunteersMap.values())
        .sort((a, b) => b.totalPendingHours - a.totalPendingHours);

      setPendingHoursData(pendingData);
    } catch (err) {
      console.error('❌ Error fetching pending hours:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getVolunteerHours, canApproveForOrg, getUserById]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchPendingHours(true);
  }, [fetchPendingHours]);

  // Handle opening hours modal
  const handleOpenHoursModal = useCallback((volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowHoursModal(true);
  }, []);

  // Handle closing hours modal
  const handleCloseHoursModal = useCallback(() => {
    setShowHoursModal(false);
    setSelectedVolunteer(null);
    // Refresh data after modal closes (in case hours were approved)
    fetchPendingHours(true);
  }, [fetchPendingHours]);

  // Load data on component mount - only once
  useEffect(() => {
    if (!initialLoadTriggered.current && currentUser) {
      initialLoadTriggered.current = true;
      fetchPendingHours(false);
    }
  }, [currentUser]); // Only depend on currentUser

  // Get volunteer display name
  const getVolunteerName = useCallback((volunteer) => {
    return `${volunteer?.firstName || ''} ${volunteer?.lastName || ''}`.trim() || 
           volunteer?.email || 
           `Volunteer ${volunteer?.id}`;
  }, []);

  // Don't render anything until we have currentUser
  if (!currentUser) {
    return (
      <div className="hours-list-container">
        <div className="hours-list-header">
          <div className="header-content">
            <HiOutlineClock className="header-icon" />
            <div className="header-text">
              <h2>שעות הממתינות לאישור</h2>
              <p>רשימת מתנדבים עם שעות הממתינות לאישור שלך</p>
            </div>
          </div>
        </div>
        <div className="hours-list-content">
          <div className="loading-section">
            <div className="spinner"></div>
            <p>טוען נתוני משתמש...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render content based on state
  const renderContent = () => {
    if (error) {
      return (
        <div className="error-section">
          <HiOutlineExclamation className="error-icon" />
          <p>שגיאה בטעינת הנתונים: {error}</p>
          <button className="retry-btn" onClick={() => fetchPendingHours(false)}>
            נסה שוב
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="loading-section">
          <div className="spinner"></div>
          <p>טוען נתוני שעות ממתינות...</p>
        </div>
      );
    }

    if (pendingHoursData.length === 0) {
      return (
        <div className="no-pending-section">
          <HiOutlineClock className="no-pending-icon" />
          <h3>אין שעות הממתינות לאישור</h3>
          <p>כל השעות הרלוונטיות כבר אושרו</p>
        </div>
      );
    }

    return (
      <>
        {/* Summary with refresh indicator */}
        <div className="pending-summary">
          <span className="summary-text">
            {pendingHoursData.length} מתנדבים עם שעות הממתינות לאישור
            {refreshing && <span className="refresh-indicator"> (מעדכן...)</span>}
          </span>
        </div>

        {/* Pending Hours List */}
        <div className="pending-hours-list">
          {pendingHoursData.map(({ volunteer, pendingRecords, totalPendingHours }) => (
            <div key={volunteer.id} className="pending-hours-row">
              <div className="volunteer-info">
                <div className="volunteer-name-display">
                  {getVolunteerName(volunteer)}
                </div>
                <div className="volunteer-details">
                  <span className="pending-count">
                    {pendingRecords.length} בקשות
                  </span>
                  <span className="separator">•</span>
                  <span className="pending-hours">
                    {totalPendingHours} שעות
                  </span>
                  <span className="separator">•</span>
                  <span className="organizations">
                    {Array.from(new Set(pendingRecords.map(r => getOrganizationName(r.orgId)))).join(', ')}
                  </span>
                </div>
              </div>
              
              <div className="row-actions">
                <button
                  className="hours-btn"
                  onClick={() => handleOpenHoursModal(volunteer)}
                  disabled={refreshing}
                >
                  שעות
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="hours-list-container">
      {/* Header - Always visible to prevent layout shift */}
      <div className="hours-list-header">
        <div className="header-content">
          <HiOutlineClock className="header-icon" />
          <div className="header-text">
            <h2>שעות הממתינות לאישור</h2>
            <p>רשימת מתנדבים עם שעות הממתינות לאישור שלך</p>
          </div>
        </div>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="רענן נתונים"
        >
          <HiRefresh className={refreshing ? 'rotating' : ''} />
        </button>
      </div>

      {/* Content - Consistent container to prevent layout shift */}
      <div className="hours-list-content">
        {renderContent()}
      </div>

      {/* Hours Modal */}
      {showHoursModal && selectedVolunteer && (
        <HoursData
          volunteer={selectedVolunteer}
          onClose={handleCloseHoursModal}
        />
      )}
    </div>
  );
};

export default HoursList;