/**
 * DataMigrationService.js
 * 
 * This service handles data migration and synchronization between
 * local storage and the server database through API calls.
 */

import DbService from './dbService.js';

class DataMigrationService {
    constructor() {
        this.connected = false;
    }

    /**
     * Check API connection
     * @returns {Promise<boolean>} Whether the server API is connected
     */
    async checkConnection() {
        try {
            const result = await DbService.checkHealth();
            this.connected = true;
            return true;
        } catch (error) {
            console.error('API connection error:', error);
            this.connected = false;
            return false;
        }
    }

    /**
     * Migrate all data for a specific user
     * @param {Object} userData - User data from local storage
     * @returns {Promise<Object>} Result of migration
     */
    async migrateUserData(userData) {
        if (!userData) {
            throw new Error('No user data provided');
        }

        if (!this.connected) {
            await this.checkConnection();
            if (!this.connected) {
                throw new Error('Server API not connected');
            }
        }

        try {
            // Use the DbService to call the migration API endpoint
            const result = await DbService.executeQuery('migration/migrate-user-data', 'POST', userData);
            return result;
        } catch (error) {
            console.error('Error in data migration:', error);
            throw error;
        }
    }

    /**
     * Synchronize data from database to local storage for a user
     * @param {Object} userData - User data in local storage format
     * @param {number} userId - User ID in database
     * @returns {Promise<Object>} Updated user data
     */
    async syncFromDatabase(userData, userId) {
        if (!userData || !userId) {
            throw new Error('Invalid user data or user ID');
        }
        
        if (!this.connected) {
            await this.checkConnection();
            if (!this.connected) {
                throw new Error('Server API not connected');
            }
        }
        
        try {
            // Use the DbService to call the sync API endpoint
            const updatedUserData = await DbService.executeQuery(`migration/sync/${userId}`, 'GET');
            
            // Merge the server data with local user data
            return { ...userData, ...updatedUserData };
        } catch (error) {
            console.error('Error syncing from database:', error);
            throw error;
        }
    }
}

// Create singleton instance
const dataMigrationService = new DataMigrationService();

export default dataMigrationService;