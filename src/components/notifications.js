import axios from 'axios';

export const getNotifications = async () => {
    const response = await axios.get('/api/notifications');
    return response.data;
};

export const markNotificationsRead = async () => {
    await axios.put('/api/notifications/mark-read');
};
