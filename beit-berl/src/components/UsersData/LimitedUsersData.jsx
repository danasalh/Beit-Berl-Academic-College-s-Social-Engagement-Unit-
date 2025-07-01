import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUsers } from '../../Contexts/UsersContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import UserProfile from '../UserProfile/UserProfile';
import { getRoleLabel } from '../../utils/roleTranslations';
import FilterBar from '../FilterBar/FilterBar';
import FeedbackPopup from '../PopUps/FeedbackPopup/FeedbackPopup';
import NotAllowed from '../PopUps/NotAllowed/NotAllowed';
import HoursData from '../HoursData/HoursData';

import './UsersData.css';
import { HiOutlineEye, HiOutlinePencil, HiOutlineClock } from 'react-icons/hi';

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
    const [filterOrganization, setFilterOrganization] = useState('');
    const [showNotAllowedPopup, setShowNotAllowedPopup] = useState(false);
    const [notAllowedRole, setNotAllowedRole] = useState('');
    const [showHoursModal, setShowHoursModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

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

    // Handle hours management - UPDATED
    const handleHours = useCallback((user) => {
        setSelectedUser(user);
        setShowHoursModal(true);
        // Close other modals when opening hours
        setShowProfile(false);
        setShowEditModal(false);
    }, []);

    // Close hours modal
    const closeHoursModal = useCallback(() => {
        setShowHoursModal(false);
        setSelectedUser(null);
    }, []);

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
            return [];
        }

        const orgIds = Array.isArray(currentUser.orgId)
            ? currentUser.orgId.map(id => Number(id))
            : [Number(currentUser.orgId)];

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

        return hasIntersection;
    }, [getCurrentUserOrgIds]);

    // Fetch data function - now non-blocking
    const fetchData = useCallback(async () => {
        if (fetchAttempted.current) {
            return;
        }

        try {
            fetchAttempted.current = true;
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
        setSelectedUser(user);
        setShowProfile(true);
    }, []);

    const handleEdit = useCallback((user) => {
        if (user.role !== 'volunteer') {
            setNotAllowedRole(user.role || 'Unknown');
            setShowNotAllowedPopup(true);
            return;
        }
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
        setFilterOrganization(''); // Add this line
    }, []);

    // Retry function
    const handleRetry = useCallback(async () => {
        try {
            fetchAttempted.current = false; // Reset to allow retry
            setHasInitialData(false);
            await fetchData();
        } catch (error) {
            console.error('❌ Retry failed:', error);
        }
    }, [fetchData]);

    // Filter users based on organization sharing and other filters
    const filteredUsers = React.useMemo(() => {

        const orgFilteredUsers = users.filter(user => {
            if (currentUser && (
                user.id === currentUser.id ||
                user.docId === currentUser.docId ||
                (currentUser.docId && user.id === currentUser.docId) ||
                (currentUser.id && user.docId === currentUser.id)
            )) {
                return false;
            }

            return hasSharedOrganization(user);
        });

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

            // Organization filter - check if any of user's shared organizations match
            const matchesOrganization = !filterOrganization || (() => {
                const userOrgIds = Array.isArray(user.orgId)
                    ? user.orgId.map(id => Number(id))
                    : [Number(user.orgId)];

                const currentUserOrgIds = getCurrentUserOrgIds();
                const sharedOrgIds = userOrgIds.filter(orgId => currentUserOrgIds.includes(orgId));

                const sharedOrgNames = organizations
                    .filter(org => sharedOrgIds.includes(Number(org.id)))
                    .map(org => org.name)
                    .join(', ');

                return sharedOrgNames.toLowerCase().includes(filterOrganization.toLowerCase());
            })();

            return matchesSearch && matchesFirstName && matchesLastName && matchesRole && matchesStatus && matchesOrganization;
        });

        return finalFilteredUsers;
    }, [users, currentUser, hasSharedOrganization, searchTerm, filterFirstName, filterLastName, filterRole, filterStatus, filterOrganization, getCurrentUserOrgIds, organizations]);

    // Get unique roles, statuses for filter options
    const { uniqueRoles, uniqueStatuses, uniqueOrganizations } = React.useMemo(() => {
        const orgFilteredUsers = users.filter(user => {
            if (currentUser && user.id === currentUser.id) {
                return false;
            }
            return hasSharedOrganization(user);
        });

        const roles = [...new Set(orgFilteredUsers.map(user => user.role).filter(Boolean))];
        const statuses = [...new Set(orgFilteredUsers.map(user => user.status).filter(Boolean))];

        // Get unique shared organizations
        const orgSet = new Set();
        const currentUserOrgIds = getCurrentUserOrgIds();

        orgFilteredUsers.forEach(user => {
            const userOrgIds = Array.isArray(user.orgId)
                ? user.orgId.map(id => Number(id))
                : [Number(user.orgId)];

            const sharedOrgIds = userOrgIds.filter(orgId => currentUserOrgIds.includes(orgId));

            sharedOrgIds.forEach(orgId => {
                const org = organizations.find(o => Number(o.id) === orgId);
                if (org && org.name) {
                    orgSet.add(JSON.stringify({ id: org.id, name: org.name }));
                }
            });
        });

        const uniqueOrgs = Array.from(orgSet).map(orgStr => JSON.parse(orgStr));

        return {
            uniqueRoles: roles,
            uniqueStatuses: statuses,
            uniqueOrganizations: uniqueOrgs
        };
    }, [users, currentUser, hasSharedOrganization, getCurrentUserOrgIds, organizations]);

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
                    ניהול משתמשים
                    {/* Background loading indicator */}
                    {showBackgroundLoading && (
                        <span className="loading-indicator" title="Loading data in background...">
                            <div className="small-spinner"></div>
                        </span>
                    )}
                </h2>
                <div className="users-stats">
                    משתמשים בארגון: <span className="stat-number">{filteredUsers.length}</span>
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
                    <span>⚠️ עדכון המידע כשל {error}</span>
                    <button onClick={handleRetry} className="retry-btn-small">
                        לנסות שוב
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
                filterOrganization={filterOrganization}
                setFilterOrganization={setFilterOrganization}
                uniqueRoles={uniqueRoles}
                uniqueStatuses={uniqueStatuses}
                uniqueOrganizations={uniqueOrganizations}
                clearFilters={clearFilters}
            />

            {filteredUsers.length === 0 ? (
                <div className="no-users">
                    <p>
                        {!currentUser
                            ? 'יש להתחבר כדי לראות את רשימת המשתמשים'
                            : getCurrentUserOrgIds().length === 0
                                ? 'אין לך עדיין שיוך לארגון'
                                : searchTerm || filterFirstName || filterLastName || filterRole || filterStatus
                                    ? 'לא נמצאו משתמשים התואמים את הקריטריונים שלך'
                                    : showBackgroundLoading
                                        ? 'טוען משתמשים...'
                                        : 'אין משתמשים זמינים כרגע'
                        }
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <div className="table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>שם</th>
                                    <th>כתובת דוא"ל</th>
                                    <th>תפקיד</th>
                                    <th>סטטוס</th>
                                    <th>ארגונים</th>
                                    <th>תאריך יצירה</th>
                                    <th>פעולות</th>
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
                                            <td data-label="">
                                                <div className="user-name">
                                                    <div className="user-avatar">
                                                        {(user.firstName || user.email || String(user.id)).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td data-label="">{user.email || 'N/A'}</td>
                                            <td data-label="">
                                                <span className={`role-badge ${user.role || 'no-role'}`}>
                                                    {getRoleLabel(user.role) || 'לא מוגדר'}
                                                </span>
                                            </td>
                                            <td data-label="">
                                                <span className={`status-badge ${user.status}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td data-label="">
                                                <div className="organizations-list" title={sharedOrgNames}>
                                                    {sharedOrgNames || 'N/A'}
                                                </div>
                                            </td>
                                            <td data-label="">{formatDate(user.createdAt)}</td>
                                            <td data-label="">
                                                <div className="operations-buttons">
                                                    <button
                                                        className="btn btn-watch"
                                                        onClick={() => handleWatch(user)}
                                                        title="צפייה בפרופיל"
                                                    >
                                                        <HiOutlineEye />
                                                    </button>
                                                    <button
                                                        className="btn btn-edit"
                                                        onClick={() => handleEdit(user)}
                                                        title="הוספת פידבק"
                                                    >
                                                        <HiOutlinePencil /> 
                                                    </button>
                                                    {/* UPDATED: Added onClick handler and conditional display */}
                                                    {user.role === 'volunteer' && (
                                                        <button
                                                            className="btn btn-hours"
                                                            onClick={() => handleHours(user)}
                                                            title="אישור וצפייה בשעות"
                                                        >
                                                            <HiOutlineClock />
                                                        </button>
                                                    )}
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

            {/* Hours Management Modal - NEW */}
            {showHoursModal && selectedUser && (
                <HoursData
                    volunteer={selectedUser}
                    onClose={closeHoursModal}
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