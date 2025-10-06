const API_URL = import.meta.env.PROD
    ? 'https://multipersonaaichatbox.onrender.com/api'
    : 'http://localhost:3001/api';

export const apiService = {
    async sendMessage(conversations, userMessage) {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversations, message: userMessage })  // Changed 'userMessage' to 'message'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;  // This returns the whole { success: true, responses: {...} } object
    }
};