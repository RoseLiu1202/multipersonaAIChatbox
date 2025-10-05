const API_URL = 'http://localhost:3001/api';

export const apiService = {
    async sendMessage(conversations, message) {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversations, message })
        });

        if (!response.ok) {
            throw new Error('Failed to get responses');
        }

        return response.json();
    }
};