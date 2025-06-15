import { useState, useEffect, useCallback } from 'react';
import { useVolunteerHours } from '../../Contexts/VolunteerHoursContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import { useUsers } from '../../Contexts/UsersContext';
import { HiX, HiOutlineClock, HiOutlineCheck, HiOutlineExclamation } from 'react-icons/hi';
import './HoursData.css';

const HoursData = ({ volunteer, onClose }) => {
  const {
    getVolunteerHoursByVolunteerId,
    getTotalHoursForVolunteer,
    updateHoursApprovalStatus,
    loading: hoursLoading
  } = useVolunteerHours();

  const { organizations } = useOrganizations();
  const { currentUser } = useUsers();

  const [volunteerHours, setVolunteerHours] = useState([]);
  const [totalApprovedHours, setTotalApprovedHours] = useState(0);
  const [pendingHours, setPendingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Format date and time
  const formatDateTime = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid date format:', timestamp);
      return 'Invalid Date';
    }
  }, []);

  // Fetch volunteer hours data
  const fetchVolunteerHours = useCallback(async () => {
    if (!volunteer?.id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching hours for volunteer:', volunteer.id);

      // Fetch all hours for this volunteer
      const [allHours, totalHours] = await Promise.all([
        getVolunteerHoursByVolunteerId(volunteer.id),
        getTotalHoursForVolunteer(volunteer.id, true) // approved only
      ]);

      console.log('📊 Hours data:', { allHours, totalHours });

      // Separate pending and approved hours
      const pending = allHours.filter(record => !record.approved);
      
      setVolunteerHours(allHours);
      setTotalApprovedHours(totalHours);
      setPendingHours(pending);

      console.log(`✅ Found ${pending.length} pending hours records`);
    } catch (err) {
      console.error('❌ Error fetching volunteer hours:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [volunteer?.id, getVolunteerHoursByVolunteerId, getTotalHoursForVolunteer]);

  // Handle approve hours
  const handleApproveHours = useCallback(async (hoursRecord) => {
    if (!hoursRecord?.id) return;

    // Check if user can approve for this organization
    if (!canApproveForOrg(hoursRecord.orgId)) {
      alert('אין לך הרשאה לאשר שעות עבור ארגון זה');
      return;
    }

    try {
      setApproving(hoursRecord.id);
      console.log('✅ Approving hours record:', hoursRecord.id);

      await updateHoursApprovalStatus(hoursRecord.id, true);

      // Show success message
      setSuccessMessage(`${hoursRecord.hours} שעות אושרו בהצלחה!`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh data
      await fetchVolunteerHours();

      console.log('✅ Hours approved successfully');
    } catch (err) {
      console.error('❌ Error approving hours:', err);
      alert(`שגיאה באישור השעות: ${err.message}`);
    } finally {
      setApproving(null);
    }
  }, [canApproveForOrg, updateHoursApprovalStatus, fetchVolunteerHours]);

  // Load data on component mount
  useEffect(() => {
    fetchVolunteerHours();
  }, [fetchVolunteerHours]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const volunteerName = `${volunteer?.firstName || ''} ${volunteer?.lastName || ''}`.trim() || volunteer?.email || 'N/A';

  return (
    <div className="hours-modal-overlay" onClick={onClose}>
      <div className="hours-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="hours-modal-header">
          <div className="header-info">
            <HiOutlineClock className="hours-icon" />
            <div>
              <h2>שעות התנדבות</h2>
              <p className="volunteer-name">{volunteerName}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <HiOutlineCheck className="success-icon" />
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="hours-modal-body">
          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>טוען נתוני שעות...</p>
            </div>
          ) : error ? (
            <div className="error-section">
              <HiOutlineExclamation className="error-icon" />
              <p>שגיאה בטעינת הנתונים: {error}</p>
              <button className="retry-btn" onClick={fetchVolunteerHours}>
                נסה שוב
              </button>
            </div>
          ) : (
            <>
              {/* Total Approved Hours */}
              <div className="total-hours-section">
                <div className="total-hours-card">
                  <div className="total-hours-icon">
                    <HiOutlineCheck />
                  </div>
                  <div className="total-hours-info">
                    <h3>סה"כ שעות מאושרות</h3>
                    <div className="total-hours-number">{totalApprovedHours}</div>
                  </div>
                </div>
              </div>

              {/* Pending Hours Section */}
              <div className="pending-hours-section">
                <h3 className="section-title">
                  שעות הממתינות לאישור ({pendingHours.length})
                </h3>

                {pendingHours.length === 0 ? (
                  <div className="no-pending-hours">
                    <HiOutlineCheck className="no-pending-icon" />
                    <p>אין שעות הממתינות לאישור</p>
                  </div>
                ) : (
                  <div className="pending-hours-list">
                    {pendingHours.map((record) => {
                      const canApprove = canApproveForOrg(record.orgId);
                      const isApproving = approving === record.id;

                      return (
                        <div key={record.id} className="pending-hours-item">
                          <div className="hours-details">
                            <div className="hours-main-info">
                              <div className="hours-amount">
                                <span className="hours-number">{record.hours}</span>
                                <span className="hours-label">שעות</span>
                              </div>
                              <div className="hours-meta">
                                <div className="hours-org">
                                  <strong>ארגון:</strong> {getOrganizationName(record.orgId)}
                                </div>
                                <div className="hours-date">
                                  <strong>תאריך:</strong> {formatDateTime(record.createdAt)}
                                </div>
                                {record.description && (
                                  <div className="hours-description">
                                    <strong>תיאור:</strong> {record.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hours-actions">
                            {canApprove ? (
                              <button
                                className={`approve-btn ${isApproving ? 'approving' : ''}`}
                                onClick={() => handleApproveHours(record)}
                                disabled={isApproving}
                              >
                                {isApproving ? (
                                  <>
                                    <div className="btn-spinner"></div>
                                    מאשר...
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineCheck />
                                    אשר
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="no-permission">
                                <span>אין הרשאה לאישור</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="hours-modal-footer">
          <button className="close-footer-btn" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoursData;