import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFeedback } from '../../../Contexts/FeedbackContext';
import { useUsers } from '../../../Contexts/UsersContext';
import { HiX, HiPencil, HiPlus, HiTrash } from 'react-icons/hi';
import './FeedbackPopup.css'; 

const FeedbackPopup = ({ targetUser, onClose }) => {
  const { 
    createFeedback, 
    updateFeedback, 
    deleteFeedback, 
    getFeedbackByVolunteerId,
    loading: feedbackLoading,
    error: feedbackError
  } = useFeedback();
  
  const { currentUser } = useUsers();

  // State for feedback list and current editing
  const [feedbackList, setFeedbackList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use ref to prevent multiple fetch attempts
  const hasFetchedRef = useRef(false);
  const targetUserIdRef = useRef(null);

  // Fetch existing feedback for the target user
  const fetchFeedback = useCallback(async () => {
    if (!targetUser?.id) return;
    
    // Prevent multiple simultaneous fetches for the same user
    if (hasFetchedRef.current && targetUserIdRef.current === targetUser.id) {
      return;
    }

    try {
      setIsLoading(true);
      hasFetchedRef.current = true;
      targetUserIdRef.current = targetUser.id;
      
      console.log('Fetching feedback for user:', targetUser.id);
      const feedback = await getFeedbackByVolunteerId(String(targetUser.id));
      setFeedbackList(feedback || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setErrorMessage('Failed to load feedback');
      hasFetchedRef.current = false; // Reset on error to allow retry
    } finally {
      setIsLoading(false);
    }
  }, [targetUser?.id]); // Removed getFeedbackByVolunteerId from dependencies

  // Load feedback on component mount and when targetUser changes
  useEffect(() => {
    // Reset fetch status when targetUser changes
    if (targetUserIdRef.current !== targetUser?.id) {
      hasFetchedRef.current = false;
    }
    
    fetchFeedback();
  }, [targetUser?.id]); // Only depend on targetUser.id, not the entire fetchFeedback function

  // Format date for display
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid date format:', timestamp);
      return 'Invalid date';
    }
  }, []);

  // Show success message
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  // Show error message
  const showError = useCallback((message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  }, []);

  // Handle add new feedback
  const handleAddNew = useCallback(() => {
    setIsEditing(true);
    setEditingFeedback(null);
    setFeedbackContent('');
  }, []);

  // Handle edit existing feedback
  const handleEdit = useCallback((feedback) => {
    setIsEditing(true);
    setEditingFeedback(feedback);
    setFeedbackContent(feedback.content || '');
  }, []);

  // Handle cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditingFeedback(null);
    setFeedbackContent('');
  }, []);

  // Refresh feedback list after operations
  const refreshFeedback = useCallback(async () => {
    if (!targetUser?.id) return;
    
    try {
      console.log('Refreshing feedback for user:', targetUser.id);
      const feedback = await getFeedbackByVolunteerId(String(targetUser.id));
      setFeedbackList(feedback || []);
    } catch (error) {
      console.error('Error refreshing feedback:', error);
      showError('Failed to refresh feedback');
    }
  }, [targetUser?.id, getFeedbackByVolunteerId, showError]);

  // Handle submit (create or update)
  const handleSubmit = useCallback(async () => {
    if (!feedbackContent.trim()) {
      showError('Please enter feedback content');
      return;
    }

    if (!currentUser?.id) {
      showError('You must be logged in to submit feedback');
      return;
    }

    if (!targetUser?.id) {
      showError('Invalid target user');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingFeedback) {
        // Update existing feedback
        const updateData = {
          content: feedbackContent.trim(),
          updatedAt: new Date()
        };
        
        const success = await updateFeedback(editingFeedback.id, updateData);
        
        if (success) {
          showSuccess('Feedback updated successfully');
          await refreshFeedback(); // Use refreshFeedback instead of fetchFeedback
          handleCancel();
        } else {
          showError('Failed to update feedback');
        }
      } else {
        // Create new feedback
        const feedbackData = {
          volunteerId: String(targetUser.id),
          fromVCId: String(currentUser.id),
          content: feedbackContent.trim(),
          date: new Date(),
          createdAt: new Date()
        };
        
        const newFeedback = await createFeedback(feedbackData);
        
        if (newFeedback) {
          showSuccess('הפידבק נוסף בהצלחה');
          await refreshFeedback(); // Use refreshFeedback instead of fetchFeedback
          handleCancel();
        } else {
          showError('Failed to create feedback');
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showError(editingFeedback ? 'Failed to update feedback' : 'Failed to add feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackContent, currentUser, targetUser, editingFeedback, updateFeedback, createFeedback, refreshFeedback, handleCancel, showSuccess, showError]);

  // Handle delete feedback
  const handleDelete = useCallback(async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const success = await deleteFeedback(feedbackId);
      
      if (success) {
        showSuccess('Feedback deleted successfully');
        await refreshFeedback(); // Use refreshFeedback instead of fetchFeedback
      } else {
        showError('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showError('Failed to delete feedback');
    }
  }, [deleteFeedback, refreshFeedback, showSuccess, showError]);

  // Filter feedback from current user (for editing/deleting)
  const myFeedback = feedbackList.filter(feedback => 
    String(feedback.fromVCId) === String(currentUser?.id)
  );

  // Filter feedback from others (read-only)
  const othersFeedback = feedbackList.filter(feedback => 
    String(feedback.fromVCId) !== String(currentUser?.id)
  );

  if (!targetUser) {
    return null;
  }

  // Use local loading state instead of context loading to avoid loops
  const showLoading = isLoading || feedbackLoading;

  return (
    <div className="feedback-popup-overlay" onClick={onClose}>
      <div className="feedback-popup" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="feedback-popup-header">
          <h2>
            מציג פידבק עבור {targetUser.firstName} {targetUser.lastName}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <div className="feedback-popup-content">
          {/* Add New Feedback Button */}
          {!isEditing && !showLoading && (
            <div className="add-feedback-section">
              <button className="add-feedback-btn" onClick={handleAddNew}>
                <HiPlus /> הוספת פידבק חדש
              </button>
            </div>
          )}

          {/* Feedback Form (when editing/adding) */}
          {isEditing && (
            <div className="feedback-form-section">
              <h3>
                {editingFeedback ? 'עריכת פידבק' : 'הוספת פידבק חדש'}
              </h3>
              <div className="feedback-form">
                <div className="form-group">
                  <label htmlFor="feedback-content">פרטי הפידבק</label>
                  <textarea
                    id="feedback-content"
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder="הוספת פידבק כאן..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    ביטול
                  </button>
                  <button 
                    type="button"
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !feedbackContent.trim()}
                  >
                    {isSubmitting ? 'שומר...' : (editingFeedback ? 'עדכון' : 'הוספת פידבק')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Feedback Section */}
          {!showLoading && myFeedback.length > 0 && (
            <div className="feedback-section">
              <h3>הפידבק שאני הזנתי</h3>
              <div className="feedback-list">
                {myFeedback.map((feedback) => (
                  <div key={feedback.id} className="feedback-item my-feedback">
                    <div className="feedback-content">
                      <p>{feedback.content}</p>
                      <small className="feedback-date">
                        {formatDate(feedback.date || feedback.createdAt)}
                        {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt && (
                          <span> (edited)</span>
                        )}
                      </small>
                    </div>
                    <div className="feedback-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(feedback)}
                        title="Edit feedback"
                      >
                        <HiPencil />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(feedback.id)}
                        title="Delete feedback"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Others' Feedback Section */}
          {!showLoading && othersFeedback.length > 0 && (
            <div className="feedback-section">
              <h3>פידבק שניתן על ידי אחרים</h3>
              <div className="feedback-list">
                {othersFeedback.map((feedback) => (
                  <div key={feedback.id} className="feedback-item others-feedback">
                    <div className="feedback-content">
                      <p>{feedback.content}</p>
                      <small className="feedback-date">
                        {formatDate(feedback.date || feedback.createdAt)}
                        {feedback.fromVCId && (
                          <span> • From User ID: {feedback.fromVCId}</span>
                        )}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Feedback Message */}
          {!showLoading && feedbackList.length === 0 && (
            <div className="no-feedback">
              <p>לא הוזן עדיין פידבק עבור משתמש זה</p>
            </div>
          )}

          {/* Loading State */}
          {showLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>טוען פידבק...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPopup;