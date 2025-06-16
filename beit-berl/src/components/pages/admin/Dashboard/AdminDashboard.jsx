// src/components/pages/admin/Dashboard/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useUsers } from '../../../../Contexts/UsersContext';
import { useOrganizations } from '../../../../Contexts/OrganizationsContext';
import { useFeedback } from '../../../../Contexts/FeedbackContext';
import { useVolunteerHours } from '../../../../Contexts/VolunteerHoursContext';
import DashboardAnalytics from './DashboardAnalytics';

const AdminDashboard = () => {
  // Get data and functions from contexts
  const { users, getUsers, loading: usersLoading } = useUsers();
  const { organizations, getOrganizations, loading: orgsLoading } = useOrganizations();
  const { feedback, getFeedback, loading: feedbackLoading } = useFeedback();
  const { volunteerHours, getVolunteerHours, loading: hoursLoading } = useVolunteerHours();
  
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate overall loading state
  const isDataLoading = usersLoading || orgsLoading || feedbackLoading || hoursLoading;
  // Initialize data fetch only once
  useEffect(() => {
    if (hasInitialized) return;    
    
    const initializeData = async () => {
      setIsLoading(true);
      try {
        setError(null);
        
        // Import the withFirestoreRetry utility
        const { withFirestoreRetry } = await import('../../../../utils/firebaseErrorHandling');
        
        // Sequential data fetching with retry logic
        if (!users || users.length === 0) {
          await withFirestoreRetry(() => getUsers());
        }

        if (!organizations || organizations.length === 0) {
          await withFirestoreRetry(() => getOrganizations());
        }

        if (!feedback || feedback.length === 0) {
          await withFirestoreRetry(() => getFeedback());
        }

        if (!volunteerHours || volunteerHours.length === 0) {
          await withFirestoreRetry(() => getVolunteerHours());
        }

        setHasInitialized(true);
      } catch (err) {
        console.error('Error initializing dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data. Please try again.');
        // Don't mark as initialized if we had a failure
        setHasInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [hasInitialized]); // Only depend on hasInitialized

  const handleRetry = () => {
    setError(null);
    setHasInitialized(false); // This will trigger the useEffect again
  };

  // Show loading state only if we haven't initialized and are actually loading
  if (!hasInitialized && isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Dashboard Data...
            </h2>
            <p className="text-gray-600">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render dashboard even if some data is still loading (progressive loading)
  return (
    <div className="admin-dashboard">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          {isDataLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Updating data...
            </div>
          )}
        </div>
      </div>
      
      <DashboardAnalytics
        users={users || []}
        organizations={organizations || []}
        hoursTracking={volunteerHours || []}
        feedback={feedback || []}
        isLoading={isDataLoading}
      />
    </div>
  );
};
export default AdminDashboard;