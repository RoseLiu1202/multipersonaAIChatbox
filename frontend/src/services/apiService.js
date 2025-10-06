const API_URL = import.meta.env.PROD
    ? 'https://multipersonaaichatbox.onrender.com/api'
    : 'http://localhost:3001/api';

export const apiService = {
    async sendMessage(conversations, userMessage) {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversations,
                message: userMessage  // Changed from 'userMessage: userMessage' to 'message: userMessage'
            })
        });

        const data = await response.json();
        return data;
    }
};