import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUsers } from '../../Contexts/UsersContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import UserProfile from '../UserProfile/UserProfile';
import FilterBar from '../FilterBar/FilterBar';
import FeedbackPopup from '../PopUps/FeedbackPopup/FeedbackPopup';
import NotAllowed from '../PopUps/NotAllowed/NotAllowed';

import './UsersData.css';
import { HiOutlineEye, HiOutlinePencil } from 'react-icons/hi';

const LimitedUsersData = () => {
    const {
        users,
        currentUser,
        loading,
        error,
        getUsers,
    } = useUsers();

    const {
        organizations,
        getOrganizations,
        loading: orgLoading
    } = useOrganizations();

    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFirstName, setFilterFirstName] = useState('');
    const [filterLastName, setFilterLastName] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showNotAllowedPopup, setShowNotAllowedPopup] = useState(false);
    const [notAllowedRole, setNotAllowedRole] = useState('');


    // Background loading states - non-blocking
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
    const [hasInitialData, setHasInitialData] = useState(false);

    // Success notification state
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Feedback popup state
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    const [feedbackTargetUser, setFeedbackTargetUser] = useState(null);

    // Track if we've attempted to fetch data
    const fetchAttempted = useRef(false);

    // Success notification handler
    const showSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setShowSuccessPopup(true);
        setTimeout(() => {
            setShowSuccessPopup(false);
            setSuccessMessage('');
        }, 3000);
    }, []);

    // Get current user's organization IDs
    const getCurrentUserOrgIds = useCallback(() => {
        if (!currentUser || !currentUser.orgId) {
            console.log('⚠️ No current user or orgId found');
            return [];
        }

        const orgIds = Array.isArray(currentUser.orgId)
            ? currentUser.orgId.map(id => Number(id))
            : [Number(currentUser.orgId)];

        console.log('👤 Current user org IDs:', orgIds);
        return orgIds;
    }, [currentUser]);

    // Check if user shares at least one organization with current user
    const hasSharedOrganization = useCallback((user) => {
        const currentUserOrgIds = getCurrentUserOrgIds();

        if (currentUserOrgIds.length === 0) {
            return false;
        }

        if (!user.orgId) {
            return false;
        }

        const userOrgIds = Array.isArray(user.orgId)
            ? user.orgId.map(id => Number(id))
            : [Number(user.orgId)];

        const hasIntersection = currentUserOrgIds.some(orgId => userOrgIds.includes(orgId));

        if (hasIntersection) {
            console.log(`✅ User ${user.id} shares org with current user:`, {
                userOrgIds,
                currentUserOrgIds,
                sharedOrgs: currentUserOrgIds.filter(orgId => userOrgIds.includes(orgId))
            });
        }

        return hasIntersection;
    }, [getCurrentUserOrgIds]);

    // Fetch data function - now non-blocking
    const fetchData = useCallback(async () => {
        if (fetchAttempted.current) {
            return;
        }

        try {
            fetchAttempted.current = true;
            console.log('🚀 Fetching users and organizations in background...');

            // Set loading states for background indicators
            setIsLoadingUsers(true);
            setIsLoadingOrgs(true);

            const promises = [];

            // Only fetch if we don't have data yet
            if (users.length === 0 && !loading) {
                promises.push(getUsers().finally(() => setIsLoadingUsers(false)));
            } else {
                setIsLoadingUsers(false);
            }

            if (organizations.length === 0 && !orgLoading) {
                promises.push(getOrganizations().finally(() => setIsLoadingOrgs(false)));
            } else {
                setIsLoadingOrgs(false);
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }

            setHasInitialData(true);
            console.log('✅ Background data fetch completed');
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setIsLoadingUsers(false);
            setIsLoadingOrgs(false);
            // Reset on error to allow retry
            fetchAttempted.current = false;
        }
    }, [getUsers, getOrganizations, users.length, organizations.length, loading, orgLoading]);

    // Effect to fetch data when component mounts and currentUser is available
    useEffect(() => {
        if (currentUser && !fetchAttempted.current) {
            // Set initial data flag if we already have some data
            if (users.length > 0 || organizations.length > 0) {
                setHasInitialData(true);
            }
            fetchData();
        }
    }, [currentUser, fetchData, users.length, organizations.length]);

    // Handle watch user profile
    const handleWatch = useCallback((user) => {
        console.log('Viewing user profile for user ID:', user.id);
        setSelectedUser(user);
        setShowProfile(true);
    }, []);

    const handleEdit = useCallback((user) => {
        if (user.role !== 'volunteer') {
            console.log('Edit denied for non-volunteer:', user.role);
            setNotAllowedRole(user.role || 'Unknown');
            setShowNotAllowedPopup(true);
            return;
        }
        console.log('Opening feedback popup for volunteer user:', user.id);
        setFeedbackTargetUser(user);
        setShowFeedbackPopup(true);
    }, []);


    // Close profile modal
    const closeProfile = useCallback(() => {
        setShowProfile(false);
        setSelectedUser(null);
    }, []);

    // Close feedback popup
    const closeFeedbackPopup = useCallback(() => {
        setShowFeedbackPopup(false);
        setFeedbackTargetUser(null);
    }, []);

    // Format date
    const formatDate = useCallback((timestamp) => {
        if (!timestamp) return 'N/A';

        try {
            if (timestamp.toDate) {
                return timestamp.toDate().toLocaleDateString();
            }
            if (timestamp instanceof Date) {
                return timestamp.toLocaleDateString();
            }
            return new Date(timestamp).toLocaleDateString();
        } catch (error) {
            console.warn('Invalid date format:', timestamp);
            return 'Invalid Date';
        }
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setFilterFirstName('');
        setFilterLastName('');
        setFilterRole('');
        setFilterStatus('');
    }, []);

    // Retry function
    const handleRetry = useCallback(async () => {
        try {
            fetchAttempted.current = false; // Reset to allow retry
            setHasInitialData(false);
            console.log('🔄 Retrying to fetch data...');
            await fetchData();
            console.log('✅ Retry successful');
        } catch (error) {
            console.error('❌ Retry failed:', error);
        }
    }, [fetchData]);

    // Filter users based on organization sharing and other filters
    const filteredUsers = React.useMemo(() => {
        console.log('🔍 Filtering users...');
        console.log('Total users before filtering:', users.length);

        const orgFilteredUsers = users.filter(user => {
            if (currentUser && (
                user.id === currentUser.id ||
                user.docId === currentUser.docId ||
                (currentUser.docId && user.id === currentUser.docId) ||
                (currentUser.id && user.docId === currentUser.id)
            )) {
                console.log('🚫 Excluding current user from list:', user.id);
                return false;
            }

            return hasSharedOrganization(user);
        });

        console.log('Users after org filtering:', orgFilteredUsers.length);

        const finalFilteredUsers = orgFilteredUsers.filter(user => {
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch = !searchTerm ||
                (user.email && user.email.toLowerCase().includes(searchLower)) ||
                (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchLower));

            const matchesFirstName = !filterFirstName ||
                (user.firstName && user.firstName.toLowerCase().includes(filterFirstName.toLowerCase()));

            const matchesLastName = !filterLastName ||
                (user.lastName && user.lastName.toLowerCase().includes(filterLastName.toLowerCase()));

            const matchesRole = !filterRole || user.role === filterRole;
            const matchesStatus = !filterStatus || user.status === filterStatus;

            return matchesSearch && matchesFirstName && matchesLastName && matchesRole && matchesStatus;
        });

        console.log('Final filtered users count:', finalFilteredUsers.length);
        return finalFilteredUsers;
    }, [users, currentUser, hasSharedOrganization, searchTerm, filterFirstName, filterLastName, filterRole, filterStatus]);

    // Get unique roles, statuses for filter options
    const { uniqueRoles, uniqueStatuses } = React.useMemo(() => {
        const orgFilteredUsers = users.filter(user => {
            if (currentUser && user.id === currentUser.id) {
                return false;
            }
            return hasSharedOrganization(user);
        });

        const roles = [...new Set(orgFilteredUsers.map(user => user.role).filter(Boolean))];
        const statuses = [...new Set(orgFilteredUsers.map(user => user.status).filter(Boolean))];
        return { uniqueRoles: roles, uniqueStatuses: statuses };
    }, [users, currentUser, hasSharedOrganization]);

    // Check if current user is logged in
    if (!currentUser) {
        return (
            <div className="users-data-container">
                <div className="error-message">
                    <h3>Access Denied</h3>
                    <p>You must be logged in to view users data.</p>
                </div>
            </div>
        );
    }

    // Only show blocking loading if we have a critical error and no data at all
    if (error && !hasInitialData && users.length === 0) {
        return (
            <div className="users-data-container">
                <div className="error-message">
                    <h3>אירעה תקלה בעת טעינת המידע</h3>
                    <p>{error}</p>
                    <button onClick={handleRetry} className="retry-btn">
                        לנסות שוב
                    </button>
                </div>
            </div>
        );
    }

    const showBackgroundLoading = isLoadingUsers || isLoadingOrgs || loading || orgLoading;

    return (
        <div className="users-data-container">
            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="success-popup">
                    <div className="success-popup-content">
                        <div className="success-icon">✅</div>
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}

            <div className="users-header">
                <h2>
                    Users Management
                    {/* Background loading indicator */}
                    {showBackgroundLoading && (
                        <span className="loading-indicator" title="Loading data in background...">
                            <div className="small-spinner"></div>
                        </span>
                    )}
                </h2>
                <div className="users-stats">
                    Organization Users: <span className="stat-number">{filteredUsers.length}</span>
                    {searchTerm || filterFirstName || filterLastName || filterRole || filterStatus ? (
                        <span className="filtered-count">
                            (Filtered)
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Show error banner if there's an error but we have some data */}
            {error && hasInitialData && (
                <div className="error-banner">
                    <span>⚠️ Failed to update data: {error}</span>
                    <button onClick={handleRetry} className="retry-btn-small">
                        Retry
                    </button>
                </div>
            )}

            <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterFirstName={filterFirstName}
                setFilterFirstName={setFilterFirstName}
                filterLastName={filterLastName}
                setFilterLastName={setFilterLastName}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                uniqueRoles={uniqueRoles}
                uniqueStatuses={uniqueStatuses}
                clearFilters={clearFilters}
            />

            {filteredUsers.length === 0 ? (
                <div className="no-users">
                    <p>
                        {!currentUser
                            ? 'Please log in to view users'
                            : getCurrentUserOrgIds().length === 0
                                ? 'You are not assigned to any organization'
                                : searchTerm || filterFirstName || filterLastName || filterRole || filterStatus
                                    ? 'No users match the selected criteria'
                                    : showBackgroundLoading
                                        ? 'Loading users...'
                                        : 'No users found in your organizations'
                        }
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <div className="table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Organizations</th>
                                    <th>Created At</th>
                                    <th>Operations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const userOrgIds = Array.isArray(user.orgId)
                                        ? user.orgId.map(id => Number(id))
                                        : [Number(user.orgId)];

                                    const currentUserOrgIds = getCurrentUserOrgIds();
                                    const sharedOrgIds = userOrgIds.filter(orgId => currentUserOrgIds.includes(orgId));

                                    const sharedOrgNames = organizations
                                        .filter(org => sharedOrgIds.includes(Number(org.id)))
                                        .map(org => org.name)
                                        .join(', ');

                                    return (
                                        <tr key={user.docId || user.id}>
                                            <td data-label="Name">
                                                <div className="user-name">
                                                    <div className="user-avatar">
                                                        {(user.firstName || user.email || String(user.id)).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td data-label="Email">{user.email || 'N/A'}</td>
                                            <td data-label="Role">
                                                <span className={`role-badge ${user.role || 'no-role'}`}>
                                                    {user.role || 'N/A'}
                                                </span>
                                            </td>
                                            <td data-label="Status">
                                                <span className={`status-badge ${user.status}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td data-label="Organizations">
                                                <div className="organizations-list" title={sharedOrgNames}>
                                                    {sharedOrgNames || 'N/A'}
                                                </div>
                                            </td>
                                            <td data-label="Created At">{formatDate(user.createdAt)}</td>
                                            <td data-label="Operations">
                                                <div className="operations-buttons">
                                                    <button
                                                        className="btn btn-watch"
                                                        onClick={() => handleWatch(user)}
                                                        title="View Profile"
                                                    >
                                                        <HiOutlineEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-edit"
                                                        onClick={() => handleEdit(user)}
                                                        title="Add/Edit Feedback"
                                                    >
                                                        <HiOutlinePencil />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showNotAllowedPopup && (
                <NotAllowed
                    role={notAllowedRole}
                    onClose={() => setShowNotAllowedPopup(false)}
                />
            )}


            {/* User Profile Modal */}
            {showProfile && selectedUser && (
                <UserProfile
                    user={selectedUser}
                    organizations={organizations}
                    onClose={closeProfile}
                />
            )}

            {/* Feedback Popup Modal */}
            {showFeedbackPopup && feedbackTargetUser && (
                <FeedbackPopup
                    targetUser={feedbackTargetUser}
                    onClose={closeFeedbackPopup}
                />
            )}
        </div>
    );
};

export default LimitedUsersData;