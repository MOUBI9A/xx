// Client-side database service
// This file provides an API for the client to communicate with the server

const API_BASE_URL = '/api';

class DbService {
    static async executeQuery(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }
            return await response.json();
        } catch (error) {
            console.error('Database service error:', error);
            throw error;
        }
    }

    // User related methods
    static async registerUser(userData) {
        return this.executeQuery('users/register', 'POST', userData);
    }

    static async searchUsers(query) {
        return this.executeQuery(`users/search?query=${encodeURIComponent(query)}`);
    }

    // Friend related methods
    static async getFriends(userId) {
        return this.executeQuery(`friends/${userId}`);
    }

    static async getPendingFriendRequests(userId) {
        return this.executeQuery(`friends/pending/${userId}`);
    }

    static async sendFriendRequest(userId, friendId) {
        return this.executeQuery('friends/request', 'POST', { user_id: userId, friend_id: friendId });
    }

    static async respondToFriendRequest(requestId, status) {
        return this.executeQuery(`friends/${requestId}/respond`, 'PUT', { status });
    }

    // Health check
    static async checkHealth() {
        return this.executeQuery('health');
    }
}

export default DbService;