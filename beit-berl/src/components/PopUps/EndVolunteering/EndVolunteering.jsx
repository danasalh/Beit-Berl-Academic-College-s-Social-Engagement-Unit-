// src/components/PopUps/EndVolunteering/EndVolunteering.jsx
import { useState } from 'react';
import { useNotifications } from '../../../Contexts/NotificationsContext';
import { useUsers } from '../../../Contexts/UsersContext';
import './EndVolunteering.css';

const EndVolunteering = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { createNotification } = useNotifications();
    const { currentUser, getUsers } = useUsers();

    const handleConfirm = async () => {
        if (!isChecked) {
            alert('יש לאשר את ההצהרה בשביל לקבל את הזכאות בגין ביצוע ההתנדבות');
            return;
        }

        setIsSubmitting(true);

        try {
            // Send notification to all admin users
            const allUsers = await getUsers();
            const adminUsers = allUsers.filter(user => user.role === 'admin');

            const notificationPromises = adminUsers.map(admin =>
                createNotification({
                    receiverId: admin.id || admin.docId,
                    type: 'volunteer-completed',
                    title: 'מתנדב השלים 60 שעות התנדבות',
                    content: `המתנדב/ת ${currentUser?.firstName || ''} ${currentUser?.lastName || ''} השלימ/ה את הצהרת סיום ההתנדבות ומוכן/ה להמשך התהליך.`,
                    date: new Date(),
                    metadata: {
                        volunteerId: currentUser?.id || currentUser?.docId,
                        volunteerName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`,
                        volunteerEmail: currentUser?.email,
                        completionDate: new Date().toISOString(),
                        action: 'volunteer-declaration-approved'
                    }
                })
            );

            await Promise.all(notificationPromises);

            alert('הצהרת ההתנדבות אושרה בהצלחה! הודעה נשלחה למנהלי המערכת.');

        } catch (error) {
            console.error('Error sending notifications:', error);
            alert('הייתה שגיאה בשליחת ההודעה למנהלים. יש לנסות שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="end-volunteering-container">
            <h2 className="title">הצהרת סיום התנדבות</h2>
            <p className="description">
                הריני מאשר/ת את נכונות הפרטים שהזנתי במערכת</p>
            <label className="checkbox-container">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                    disabled={isSubmitting}
                />
                <span className="checkbox-label">
                    אני מאשר/ת
                </span>
            </label>

            <button
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'מעבד...' : 'אישור'}
            </button>
        </div>
    );
};

export default EndVolunteering;