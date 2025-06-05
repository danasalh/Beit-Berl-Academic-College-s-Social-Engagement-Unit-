// src/contexts/CombinedProvider.jsx
import { UsersProvider } from './UsersContext';
import { OrganizationsProvider } from './OrganizationsContext';
import { VolunteerHoursProvider } from './VolunteerHoursContext';
import { FeedbackProvider } from './FeedbackContext';
import { NotificationsProvider } from './NotificationsContext';

/**
 * Combined Provider Component
 * Wraps your app with all the context providers in the correct order
 * Usage: Wrap your main App component with this provider
 */
export const CombinedProvider = ({ children }) => {
  console.log('🚀 Initializing all context providers...');
  
  return (
    <UsersProvider>
      <OrganizationsProvider>
        <VolunteerHoursProvider>
          <FeedbackProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </FeedbackProvider>
        </VolunteerHoursProvider>
      </OrganizationsProvider>
    </UsersProvider>
  );
};

// Individual provider exports for selective usage
export {
  UsersProvider,
  OrganizationsProvider,
  VolunteerHoursProvider,
  FeedbackProvider,
  NotificationsProvider
};