import { useState, useEffect, useCallback } from 'react';
import { useFeedback } from '../../Contexts/FeedbackContext';
import { useUsers } from '../../Contexts/UsersContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import { useVolunteerHours } from '../../Contexts/VolunteerHoursContext';
import { HiOutlineChatAlt2, HiOutlineExclamation, HiRefresh } from 'react-icons/hi';
import FeedbackPopup from '../PopUps/FeedbackPopup/FeedbackPopup';
import './FeedbackList.css';

const FeedbackList = () => {
  const { getFeedback } = useFeedback();
  const { getUserById, currentUser } = useUsers();
  const { organizations } = useOrganizations();
  const { getVolunteerHours } = useVolunteerHours();

  const [feedbackRequestsData, setFeedbackRequestsData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  // Check if current user can provide feedback for a specific organization
  const canProvideFeedbackForOrg = useCallback((orgId) => {
    if (!currentUser) return false;
    
    // Admin can provide feedback for all organizations
    if (currentUser.role === 'admin') return true;
    
    // OrgRep or VC can provide feedback only for their organizations
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

  // Calculate if volunteer needs feedback based on hours
  const calculateFeedbackNeeded = useCallback((volunteerHours, existingFeedback) => {
    // Group approved hours by organization
    const approvedHoursByOrg = {};
    
    volunteerHours
      .filter(record => record.approved)
      .forEach(record => {
        const orgId = record.orgId;
        if (!approvedHoursByOrg[orgId]) {
          approvedHoursByOrg[orgId] = 0;
        }
        approvedHoursByOrg[orgId] += Number(record.hours || 0);
      });

    // Calculate feedback requests needed
    const feedbackRequests = [];
    
    Object.entries(approvedHoursByOrg).forEach(([orgId, totalHours]) => {
      // Check if current user can provide feedback for this org
      if (!canProvideFeedbackForOrg(orgId)) return;
      
      // Calculate how many feedback sessions should have been completed
      const expectedFeedbackSessions = Math.floor(totalHours / 15);
      
      // Count existing feedback for this volunteer from this organization
      const existingFeedbackCount = existingFeedback.filter(feedback => {
        // Check if feedback is from someone in the same organization
        return feedback.volunteerId === String(volunteerHours[0]?.volunteerId);
      }).length;
      
      // If we need more feedback sessions
      if (expectedFeedbackSessions > existingFeedbackCount) {
        const missingSessions = expectedFeedbackSessions - existingFeedbackCount;
        feedbackRequests.push({
          orgId: Number(orgId),
          totalHours,
          expectedSessions: expectedFeedbackSessions,
          existingSessions: existingFeedbackCount,
          missingSessions,
          orgName: getOrganizationName(orgId)
        });
      }
    });

    return feedbackRequests;
  }, [canProvideFeedbackForOrg, getOrganizationName]);

  // Fetch feedback requests data
  const fetchFeedbackRequests = useCallback(async (isRefresh = false) => {
    try {
      // Set appropriate loading state (background loading)
      if (isRefresh) {
        setRefreshing(true);
      } else if (feedbackRequestsData.length === 0) {
        setInitialLoading(true);
      }
      
      setError(null);

      console.log('🔍 Fetching feedback requests for dashboard...');

      // Get all volunteer hours and existing feedback in parallel
      const [allHours, existingFeedback] = await Promise.all([
        getVolunteerHours(),
        getFeedback()
      ]);

      // Group hours by volunteer ID
      const volunteerHoursMap = new Map();
      allHours.forEach(record => {
        const volunteerId = record.volunteerId;
        if (!volunteerHoursMap.has(volunteerId)) {
          volunteerHoursMap.set(volunteerId, []);
        }
        volunteerHoursMap.get(volunteerId).push(record);
      });

      console.log(`📊 Processing ${volunteerHoursMap.size} volunteers for feedback requests`);

      // Calculate feedback requests for each volunteer
      const feedbackRequestsMap = new Map();

      for (const [volunteerId, volunteerHours] of volunteerHoursMap) {
        const volunteerFeedback = existingFeedback.filter(f => 
          f.volunteerId === String(volunteerId)
        );
        
        const feedbackRequests = calculateFeedbackNeeded(volunteerHours, volunteerFeedback);
        
        if (feedbackRequests.length > 0) {
          // Fetch volunteer details
          try {
            const volunteerData = await getUserById(volunteerId);
            if (volunteerData) {
              feedbackRequestsMap.set(volunteerId, {
                volunteer: volunteerData,
                requests: feedbackRequests,
                totalMissingSessions: feedbackRequests.reduce((sum, req) => sum + req.missingSessions, 0),
                totalHours: feedbackRequests.reduce((sum, req) => sum + req.totalHours, 0)
              });
            }
          } catch (err) {
            console.warn(`⚠️ Could not fetch volunteer data for ID: ${volunteerId}`);
            // Create a placeholder for unknown volunteers
            feedbackRequestsMap.set(volunteerId, {
              volunteer: {
                id: volunteerId,
                firstName: 'Unknown',
                lastName: 'Volunteer',
                email: `volunteer-${volunteerId}`
              },
              requests: feedbackRequests,
              totalMissingSessions: feedbackRequests.reduce((sum, req) => sum + req.missingSessions, 0),
              totalHours: feedbackRequests.reduce((sum, req) => sum + req.totalHours, 0)
            });
          }
        }
      }

      // Convert map to array and sort by total missing sessions (descending)
      const requestsData = Array.from(feedbackRequestsMap.values())
        .sort((a, b) => b.totalMissingSessions - a.totalMissingSessions);

      setFeedbackRequestsData(requestsData);
      console.log(`✅ Found feedback requests for ${requestsData.length} volunteers`);

    } catch (err) {
      console.error('❌ Error fetching feedback requests:', err);
      setError(err.message);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [getVolunteerHours, getFeedback, calculateFeedbackNeeded, getUserById, feedbackRequestsData.length]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchFeedbackRequests(true);
  }, [fetchFeedbackRequests]);

  // Handle opening feedback popup
  const handleOpenFeedbackPopup = useCallback((volunteer) => {
    console.log('💬 Opening feedback popup for volunteer:', volunteer);
    setSelectedVolunteer(volunteer);
    setShowFeedbackPopup(true);
  }, []);

  // Handle closing feedback popup
  const handleCloseFeedbackPopup = useCallback(() => {
    setShowFeedbackPopup(false);
    setSelectedVolunteer(null);
    // Refresh data after popup closes (in case feedback was submitted)
    fetchFeedbackRequests(true);
  }, [fetchFeedbackRequests]);

  // Load data on component mount
  useEffect(() => {
    fetchFeedbackRequests(false);
  }, [fetchFeedbackRequests]);

  // Get volunteer display name
  const getVolunteerName = useCallback((volunteer) => {
    return `${volunteer?.firstName || ''} ${volunteer?.lastName || ''}`.trim() || 
           volunteer?.email || 
           `Volunteer ${volunteer?.id}`;
  }, []);

  // Show initial loading only on first load with empty data
  if (initialLoading && feedbackRequestsData.length === 0 && !error) {
    return (
      <div className="feedback-list-container">
        <div className="feedback-list-header">
          <div className="header-content">
            <HiOutlineChatAlt2 className="header-icon" />
            <div className="header-text">
              <h2>בקשות פידבק</h2>
              <p>רשימת מתנדבים הזקוקים לפידבק על פי שעות התנדבות</p>
            </div>
          </div>
        </div>
        <div className="feedback-list-content">
          <div className="loading-section">
            <div className="spinner"></div>
            <p>טוען בקשות פידבק...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-list-container">
      {/* Header */}
      <div className="feedback-list-header">
        <div className="header-content">
          <HiOutlineChatAlt2 className="header-icon" />
          <div className="header-text">
            <h2>בקשות פידבק</h2>
            <p>רשימת מתנדבים הזקוקים לפידבק על פי שעות התנדבות</p>
          </div>
        </div>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          title="רענן נתונים"
        >
          <HiRefresh className={refreshing ? 'rotating' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="feedback-list-content">
        {error ? (
          <div className="error-section">
            <HiOutlineExclamation className="error-icon" />
            <p>שגיאה בטעינת הנתונים: {error}</p>
            <button className="retry-btn" onClick={() => fetchFeedbackRequests(false)}>
              נסה שוב
            </button>
          </div>
        ) : feedbackRequestsData.length === 0 && !initialLoading ? (
          <div className="no-requests-section">
            <HiOutlineChatAlt2 className="no-requests-icon" />
            <h3>אין בקשות פידבק</h3>
            <p>כל המתנדבים קיבלו פידבק מתאים לשעות התנדבותם</p>
          </div>
        ) : (
          <>
            {/* Summary with refresh indicator */}
            <div className="requests-summary">
              <span className="summary-text">
                {feedbackRequestsData.length} מתנדבים זקוקים לפידבק
                {refreshing && <span className="refresh-indicator"> (מעדכן...)</span>}
              </span>
            </div>

            {/* Feedback Requests List */}
            <div className="feedback-requests-list">
              {feedbackRequestsData.map(({ volunteer, requests, totalMissingSessions, totalHours }) => (
                <div key={volunteer.id} className="feedback-request-row">
                  <div className="volunteer-info">
                    <div className="volunteer-name">
                      {getVolunteerName(volunteer)}
                    </div>
                    <div className="volunteer-details">
                      <span className="missing-sessions">
                        {totalMissingSessions} פידבקים חסרים
                      </span>
                      <span className="separator">•</span>
                      <span className="total-hours">
                        {totalHours} שעות כולל
                      </span>
                      <span className="separator">•</span>
                      <span className="organizations">
                        {requests.map(req => req.orgName).join(', ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="row-actions">
                    <button
                      className="feedback-btn"
                      onClick={() => handleOpenFeedbackPopup(volunteer)}
                      disabled={refreshing}
                    >
                      פידבק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Feedback Popup */}
      {showFeedbackPopup && selectedVolunteer && (
        <FeedbackPopup
          volunteer={selectedVolunteer}
          onClose={handleCloseFeedbackPopup}
        />
      )}
    </div>
  );
};

export default FeedbackList;