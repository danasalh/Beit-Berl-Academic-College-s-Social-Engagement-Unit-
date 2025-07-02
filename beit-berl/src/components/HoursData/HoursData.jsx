import { useState, useEffect, useCallback } from 'react';
import { useVolunteerHours } from '../../Contexts/VolunteerHoursContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import { useUsers } from '../../Contexts/UsersContext';
import { useNotifications } from '../../Contexts/NotificationsContext'; // Add this import
import { HiOutlineClock, HiOutlineCheck, HiOutlineExclamation, HiOutlineX } from 'react-icons/hi';
import CloseButton from '../Buttons/CloseButton/CloseButton';
import './HoursData.css';

const HoursData = ({ volunteer, onClose }) => {
  const {
    getVolunteerHoursByVolunteerId,
    getTotalHoursForVolunteer,
    updateHoursApprovalStatus,
    updateHoursRejectionStatus,
    loading: hoursLoading
  } = useVolunteerHours();

  const { organizations } = useOrganizations();
  const { currentUser } = useUsers();
  const { createNotification } = useNotifications(); // Add this line

  const [volunteerHours, setVolunteerHours] = useState([]);
  const [totalApprovedHours, setTotalApprovedHours] = useState(0);
  const [pendingHours, setPendingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
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

  // Helper function to create notification for volunteer
  const createVolunteerNotification = useCallback(async (hoursRecord, isApproved) => {
    try {
      const orgName = getOrganizationName(hoursRecord.orgId);
      const volunteerName = `${volunteer?.firstName || ''} ${volunteer?.lastName || ''}`.trim() || volunteer?.email || 'מתנדב';
      const approverName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'מנהל';

      const notificationData = {
        receiverId: String(volunteer.id), // Make sure to convert to string
        relatedId: String(hoursRecord.id), // Reference to the hours record
        type: 'hours-status', // New notification type
        title: isApproved ? 'שעות התנדבות אושרו' : 'שעות התנדבות נדחו',
        content: isApproved
          ? `שלום ${volunteerName}, ${hoursRecord.hours} שעות ההתנדבות שלך בארגון "${orgName}" אושרו על ידי ${approverName}.`
          : `שלום ${volunteerName}, ${hoursRecord.hours} שעות ההתנדבות שלך בארגון "${orgName}" נדחו על ידי ${approverName}.`,
        date: new Date(),
        read: false
      };

      await createNotification(notificationData);
    } catch (error) {
      // Don't throw error here - notification failure shouldn't block the main operation
    }
  }, [volunteer, currentUser, getOrganizationName, createNotification]);

  // Fetch volunteer hours data
  const fetchVolunteerHours = useCallback(async () => {
    if (!volunteer?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all hours for this volunteer (excluding rejected)
      const [allHours, totalHours] = await Promise.all([
        getVolunteerHoursByVolunteerId(volunteer.id, false), // Don't include rejected
        getTotalHoursForVolunteer(volunteer.id, true) // approved only
      ]);

      // Separate pending hours (not approved and not rejected)
      const pending = allHours.filter(record => !record.approved && !record.rejected);

      setVolunteerHours(allHours);
      setTotalApprovedHours(totalHours);
      setPendingHours(pending);

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
      await updateHoursApprovalStatus(hoursRecord.id, true);

      // Create notification for volunteer
      await createVolunteerNotification(hoursRecord, true);

      // Show success message
      setSuccessMessage(`${hoursRecord.hours} שעות אושרו בהצלחה!`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh data
      await fetchVolunteerHours();
    } catch (err) {
      alert(`שגיאה באישור השעות: ${err.message}`);
    } finally {
      setApproving(null);
    }
  }, [canApproveForOrg, updateHoursApprovalStatus, createVolunteerNotification, fetchVolunteerHours]);

  // Handle reject hours
  const handleRejectHours = useCallback(async (hoursRecord) => {
    if (!hoursRecord?.id) return;

    // Check if user can reject for this organization
    if (!canApproveForOrg(hoursRecord.orgId)) {
      alert('אין לך הרשאה לדחות שעות עבור ארגון זה');
      return;
    }

    // Confirm rejection
    if (!window.confirm(`האם אתה בטוח שברצונך לדחות ${hoursRecord.hours} שעות?`)) {
      return;
    }

    try {
      setRejecting(hoursRecord.id);

      await updateHoursRejectionStatus(hoursRecord.id, true);

      // Create notification for volunteer
      await createVolunteerNotification(hoursRecord, false);

      // Show success message
      setSuccessMessage(`${hoursRecord.hours} שעות נדחו בהצלחה`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh data
      await fetchVolunteerHours();
    } catch (err) {
      alert(`שגיאה בדחיית השעות: ${err.message}`);
    } finally {
      setRejecting(null);
    }
  }, [canApproveForOrg, updateHoursRejectionStatus, createVolunteerNotification, fetchVolunteerHours]);

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
          <CloseButton onClick={onClose} />
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={`success-message ${successMessage.includes('נדחו') ? 'reject-message' : ''}`}>
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
                      const isRejecting = rejecting === record.id;

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

                          {/* Action Buttons */}
                          {canApprove && (
                            <div className="hours-actions">
                              <button
                                className={`approve-btn ${isApproving ? 'loading' : ''}`}
                                onClick={() => handleApproveHours(record)}
                                disabled={isApproving || isRejecting}
                              >
                                {isApproving ? (
                                  <>
                                    <div className="btn-spinner"></div>
                                    מאשר...
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineCheck />
                                    אישור
                                  </>
                                )}
                              </button>

                              <button
                                className={`reject-btn ${isRejecting ? 'loading' : ''}`}
                                onClick={() => handleRejectHours(record)}
                                disabled={isApproving || isRejecting}
                              >
                                {isRejecting ? (
                                  <>
                                    <div className="btn-spinner"></div>
                                    דוחה...
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineX />
                                    דחייה
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {!canApprove && (
                            <div className="no-permission">
                              <p>אין הרשאה לאישור שעות עבור ארגון זה</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Hours History */}
              <div className="all-hours-section">
                <h3 className="section-title">
                  היסטוריית שעות ({volunteerHours.length})
                </h3>

                {volunteerHours.length === 0 ? (
                  <div className="no-hours">
                    <HiOutlineClock className="no-hours-icon" />
                    <p>אין רשומות שעות</p>
                  </div>
                ) : (
                  <div className="all-hours-list">
                    {volunteerHours.map((record) => (
                      <div key={record.id} className={`hours-history-item ${record.approved ? 'approved' : 'pending'}`}>
                        <div className="history-details">
                          <div className="history-main-info">
                            <div className="history-amount">
                              <span className="history-hours-number">{record.hours}</span>
                              <span className="history-hours-label">שעות</span>
                            </div>
                            <div className="history-meta">
                              <div className="history-org">
                                <strong>ארגון:</strong> {getOrganizationName(record.orgId)}
                              </div>
                              <div className="history-date">
                                <strong>תאריך:</strong> {formatDateTime(record.createdAt)}
                              </div>
                              {record.description && (
                                <div className="history-description">
                                  <strong>תיאור:</strong> {record.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="history-status">
                            {record.approved ? (
                              <span className="status-approved">
                                <HiOutlineCheck />
                                מאושר
                              </span>
                            ) : (
                              <span className="status-pending">
                                <HiOutlineClock />
                                ממתין
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HoursData;