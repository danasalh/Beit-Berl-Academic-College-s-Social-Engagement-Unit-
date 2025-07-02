# Vtime - Volunteer Coordination System

This project is a responsive, scalable web application designed to support and streamline volunteer coordination for academic and community organizations. Built with React and Firebase, Vtime provides role-based access control and comprehensive volunteer management features.

**Live Demo**: [https://vtime-beitberl.web.app/login](https://vtime-beitberl.web.app/login)

## Academic Context
This project was developed as part of the "תכנון וניהול פרויקטי תוכנה" (Software Project Planning and Management) and "הנדסת תוכנה בשירות הקהילה" (Software Engineering in the Service of the Community) courses in the Software Engineering B.Sc. program at JCE Azrieli College of Engineering.

**Team & Roles:**
- Tehila Raviv – Developer & Scrum Master
- Saar Niran – Developer & Product Owner  
- Noa Uzan – Developer
- Dana Salah – Developer

**Customer:** Head of the Academic Social Engagement Unit at Beit Berl College

## Features

### Authentication & Authorization
- Firebase Authentication with email/password or Google login
- Admin approval required for new users
- Password recovery via email reset link
- Role-based access control with different permissions per user type

### User Roles & Permissions

**1. Volunteer**
- Browse and search for organizations
- Log volunteering hours
- Receive notifications
- Edit profile settings

**2. Volunteer Coordinator (VC)**
- Approve/reject submitted hours
- Add feedback for volunteers
- Manage and filter volunteers per organization
- Update contact details
- Receive notifications
- Edit profile settings

**3. Organization Representative (OrgRep)**
- All VC permissions
- Manage multiple organizations
- Manage multiple users (Volunteers and VCs)

**4. Admin**
- Full system access
- Assign users to organizations
- Change user roles or statuses
- Export system data to Excel
- Analytics dashboard for system data analysis

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/en) (Version 18.x or higher recommended)
- `npm` (Version 8.x or higher)
- Firebase account and project

### Clone the Repository
```bash
git clone https://github.com/danasalh/Beit-Berl-Academic-College-s-Social-Engagement-Unit-.git
cd Beit-Berl-Academic-College-s-Social-Engagement-Unit-/beit-berl
```

### Project Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password and Google providers)
   - Enable Firestore Database
   - Set up Firestore security rules and indexes

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Copy the template below and fill in your Firebase configuration:

## Configuration

### Environment Variables
Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

**Important:** Never commit your `.env` file to version control. Keep your Firebase credentials secure.

### Firebase Setup
1. **Authentication**: Enable Email/Password and Google sign-in methods
2. **Firestore Database**: Create database with appropriate security rules
3. **Firestore Indexes**: Set up composite indexes for efficient querying
4. **Security Rules**: Configure rules based on user roles and permissions 

## Usage

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Build
```bash
npm run build
```

### Deployment
Deploy to Firebase Hosting:
```bash
npm run build
firebase deploy
```

**Note:** Remember to build before every deployment when changes are made.

### Test the Application
1. Navigate to the login page
2. Register a new account (requires admin approval)
3. Once approved, explore the features based on your assigned role
4. Test volunteer hour logging, approval workflows, and notification system

## Tech Stack

### Frontend
- **React 19.0.0** - UI library
- **Vite** - Build tool and development server
- **React Router DOM 7.6.0** - Client-side routing
- **Lucide React 0.515.0** - Icon library
- **React Icons 5.5.0** - Additional icons
- **Recharts 2.15.3** - Data visualization

### Backend & Database
- **Firebase 11.7.3** - Backend-as-a-Service
  - Authentication
  - Firestore (NoSQL Database)
  - Hosting

### Additional Libraries
- **UUID 11.1.0** - Unique identifier generation
- **XLSX 0.18.5** - Excel file handling for data export

## Project Structure

```
src/
├── components/          # Reusable UI components
├── Contexts/           # React context providers
├── firebase/           # Firebase configuration and services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── App.css            # Main application styles
├── App.jsx            # Main application component
├── index.css          # Global styles
└── main.jsx           # Application entry point
```

## Data Structure

The application uses Firestore NoSQL database with the following main collections:
- **Users Collection** - User profiles with roles and organization assignments
- **Organizations Collection** - Organization information and settings
- **hoursTracking Collection** - Volunteer hour submissions and approvals
- **Feedback Collection** - Feedback and communications
- **Notifications Collection** - System notifications
- **feedbackReminderTracking Collection** - Automated reminder system

## Best Practices & Development

### Code Standards
- Follow React best practices and hooks patterns
- Use meaningful component and variable names
- Implement proper error handling
- Maintain consistent code formatting

### Security
- Never expose Firebase credentials in public repositories
- Implement proper Firestore security rules
- Validate user permissions on both client and server side
- Use environment variables for sensitive configuration

## Troubleshooting

### Common Issues

**Authentication Problems:**
- Verify Firebase configuration in `.env` file
- Check if authentication providers are enabled in Firebase Console
- Ensure Firestore security rules allow proper access

**Build/Deployment Issues:**
- Run `npm run build` before deployment
- Check for any TypeScript or linting errors
- Verify all environment variables are properly set

**Database Issues:**
- Check Firestore security rules
- Verify indexes are properly configured
- Monitor Firebase console for any quota limits

## Support

For technical issues or questions:
- Refer to [Firebase Documentation](https://firebase.google.com/docs) for Firebase-related issues

## License

This project was developed for academic purposes as part of JCE Azrieli College of Engineering coursework.

---

**Happy Coding! 🚀**