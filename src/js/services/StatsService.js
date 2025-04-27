// Client-side stats service
import DbService from './dbService.js';

class StatsService {
    async recordGameSession(gameType, userId, score, metadata) {
        try {
            // Use the DbService to make API calls instead of direct DB queries
            return await DbService.executeQuery('stats/record-game', 'POST', {
                userId, 
                gameType, 
                score, 
                metadata: JSON.stringify(metadata)
            });
        } catch (error) {
            console.error('Error recording game session:', error);
            throw error;
        }
    }

    async getGameStats(gameType, userId) {
        try {
            // Use the DbService to make API calls instead of direct DB queries
            return await DbService.executeQuery(`stats/${gameType}/${userId}`);
        } catch (error) {
            console.error('Error fetching game stats:', error);
            throw error;
        }
    }

    async getLeaderboard(gameType, limit = 10) {
        try {
            return await DbService.executeQuery(`stats/leaderboard/${gameType}?limit=${limit}`);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            throw error;
        }
    }

    async getRecentGames(userId, gameType = null, limit = 5) {
        try {
            const endpoint = gameType 
                ? `stats/recent-games/${userId}/${gameType}?limit=${limit}`
                : `stats/recent-games/${userId}?limit=${limit}`;
            
            return await DbService.executeQuery(endpoint);
        } catch (error) {
            console.error('Error fetching recent games:', error);
            throw error;
        }
    }
}

export default new StatsService();