class AuthService {
    constructor() {
        this.USERS_KEY = 'game_hub_users';
        this.SESSION_KEY = 'game_hub_session';
        this.users = this.loadUsers();
        this.currentUser = this.loadSession();
        this.authStatus = this.currentUser !== null;
        this.isDbConnected = false;
    }

    /**
     * Load users from localStorage
     */
    loadUsers() {
        const usersJSON = localStorage.getItem(this.USERS_KEY);
        return usersJSON ? JSON.parse(usersJSON) : {};
    }

    /**
     * Save users to localStorage
     */
    saveUsers() {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));
    }

    /**
     * Load current user session from localStorage
     */
    loadSession() {
        const sessionJSON = localStorage.getItem(this.SESSION_KEY);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
    }

    /**
     * Save user session to localStorage
     */
    saveSession(user) {
        if (user) {
            // Create a session object without sensitive data
            const session = {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName || user.username,
                avatar: user.avatar || null,
                created: user.created,
                gameHistory: user.gameHistory || [],
                matchHistory: user.matchHistory || [],
                stats: user.stats || {
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    byGame: {}
                }
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            this.currentUser = session;
            this.authStatus = true;
        } else {
            localStorage.removeItem(this.SESSION_KEY);
            this.currentUser = null;
            this.authStatus = false;
        }
    }

    /**
     * Check if username already exists
     */
    isUsernameTaken(username) {
        return this.users.hasOwnProperty(username);
    }

    /**
     * Hash password using SHA-256
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Register a new user
     */
    async register(username, email, password) {
        // First check if we can register in localStorage
        if (this.isUsernameTaken(username)) {
            throw new Error('Username already taken');
        }

        const hashedPassword = await this.hashPassword(password);
        
        const newUser = {
            username,
            email,
            displayName: username,
            password: hashedPassword,
            created: new Date().toISOString(),
            avatar: null,
            gameHistory: [],
            matchHistory: [],
            stats: {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            }
        };
        
        try {
            // Try to register user in the database
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: newUser.username,
                    email: newUser.email,
                    password_hash: newUser.password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to register user in database');
            }

            const data = await response.json();
            
            // Add the database ID to the user object
            newUser.id = data.id;
            this.isDbConnected = true;
        } catch (error) {
            console.warn('Failed to register user in database, using local storage only:', error.message);
            this.isDbConnected = false;
            // Continue with localStorage registration even if database fails
        }
        
        // Save to localStorage
        this.users[username] = newUser;
        this.saveUsers();
        this.saveSession(newUser);
        
        return { success: true, user: newUser };
    }

    /**
     * Login user
     */
    async login(username, password) {
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }
        
        const hashedPassword = await this.hashPassword(password);
        
        if (user.password !== hashedPassword) {
            throw new Error('Incorrect password');
        }
        
        // Initialize stats if they don't exist (for backward compatibility)
        if (!user.stats) {
            user.stats = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        // Initialize matchHistory if it doesn't exist
        if (!user.matchHistory) {
            user.matchHistory = [];
        }
        
        // Try to validate against database
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password_hash: hashedPassword
                })
            });

            if (response.ok) {
                const dbUser = await response.json();
                
                // Update user with database ID if not already set
                if (!user.id && dbUser.id) {
                    user.id = dbUser.id;
                }
                
                // Mark as connected to database
                this.isDbConnected = true;
                
                // Update last login
                await fetch(`/api/users/${dbUser.id}/update-login`, {
                    method: 'PUT'
                });
            } else {
                this.isDbConnected = false;
                console.warn('Failed to validate user with database, using local storage only');
            }
        } catch (error) {
            this.isDbConnected = false;
            console.warn('Database login validation error:', error.message);
        }
        
        // Update user in localStorage
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        return { success: true, user };
    }

    /**
     * Logout user
     */
    logout() {
        this.saveSession(null);
        return { success: true };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Apply updates to local storage
        if (updates.displayName) {
            user.displayName = updates.displayName;
        }
        
        if (updates.avatar) {
            user.avatar = updates.avatar;
        }
        
        if (updates.bio) {
            user.bio = updates.bio;
        }
        
        // Save changes to localStorage
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        // Try to sync changes with database
        if (this.isDbConnected && user.id) {
            try {
                const response = await fetch(`/api/users/${user.id}/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        display_name: updates.displayName,
                        avatar: updates.avatar,
                        bio: updates.bio
                    })
                });

                if (!response.ok) {
                    console.warn('Failed to update profile in database');
                }
            } catch (error) {
                console.warn('Error updating profile in database:', error.message);
            }
        }
        
        return { success: true, user };
    }

    /**
     * Add game to user history
     */
    async addGameToHistory(gameData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize game history if it doesn't exist
        if (!user.gameHistory) {
            user.gameHistory = [];
        }

        // Add game with timestamp
        const game = {
            ...gameData,
            playedAt: new Date().toISOString()
        };
        
        user.gameHistory.unshift(game); // Add to beginning of array
        
        // Save changes to localStorage
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        // Try to sync with database
        if (this.isDbConnected && user.id) {
            try {
                const response = await fetch(`/api/game-sessions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        game: game.game,
                        score: game.score,
                        details: game.details || {},
                        played_at: game.playedAt
                    })
                });

                if (!response.ok) {
                    console.warn('Failed to save game to database');
                }
            } catch (error) {
                console.warn('Error saving game to database:', error.message);
            }
        }
        
        return { success: true, user };
    }

    /**
     * Get user game history
     */
    async getGameHistory() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        // If database is connected, try to get latest from DB
        if (this.isDbConnected && this.currentUser.id) {
            try {
                const response = await fetch(`/api/users/${this.currentUser.id}/game-history`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('Error fetching game history from database:', error.message);
            }
        }
        
        // Fallback to localStorage
        return this.currentUser.gameHistory || [];
    }
    
    /**
     * Add match to user history with opponent and result
     * @param {Object} matchData - Data about the match
     * @param {string} matchData.game - Name of the game
     * @param {string} matchData.opponent - Name of the opponent
     * @param {string} matchData.result - "win", "loss", or "draw"
     * @param {Object} matchData.score - Score object for the match
     */
    async addMatchToHistory(matchData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize match history if it doesn't exist
        if (!user.matchHistory) {
            user.matchHistory = [];
        }
        
        // Initialize stats if they don't exist
        if (!user.stats) {
            user.stats = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        // Initialize game stats if it doesn't exist
        if (!user.stats.byGame[matchData.game]) {
            user.stats.byGame[matchData.game] = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
        }

        // Add match with timestamp
        const match = {
            ...matchData,
            playedAt: new Date().toISOString()
        };
        
        user.matchHistory.unshift(match); // Add to beginning of array
        
        // Update stats
        user.stats.totalMatches++;
        user.stats.byGame[matchData.game].totalMatches++;
        
        if (matchData.result === 'win') {
            user.stats.wins++;
            user.stats.byGame[matchData.game].wins++;
        } else if (matchData.result === 'loss') {
            user.stats.losses++;
            user.stats.byGame[matchData.game].losses++;
        } else if (matchData.result === 'draw') {
            user.stats.draws++;
            user.stats.byGame[matchData.game].draws++;
        }
        
        // Save changes to localStorage
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        // Try to sync with database
        if (this.isDbConnected && user.id) {
            try {
                // First, check if opponent exists in database
                let opponentId = null;
                if (matchData.opponent) {
                    const opponentResponse = await fetch(`/api/users/by-username/${matchData.opponent}`);
                    if (opponentResponse.ok) {
                        const opponentData = await opponentResponse.json();
                        opponentId = opponentData.id;
                    }
                }
                
                // Create match session in database
                const response = await fetch(`/api/matches`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        opponent_id: opponentId,
                        game: matchData.game,
                        result: matchData.result,
                        score: matchData.score,
                        played_at: match.playedAt
                    })
                });

                if (!response.ok) {
                    console.warn('Failed to save match to database');
                }
            } catch (error) {
                console.warn('Error saving match to database:', error.message);
            }
        }
        
        return { success: true, user };
    }
    
    /**
     * Get user match history
     */
    async getMatchHistory() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        // If database is connected, try to get latest from DB
        if (this.isDbConnected && this.currentUser.id) {
            try {
                const response = await fetch(`/api/users/${this.currentUser.id}/match-history`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('Error fetching match history from database:', error.message);
            }
        }
        
        // Fallback to localStorage
        return this.currentUser.matchHistory || [];
    }
    
    /**
     * Get user stats
     */
    async getUserStats() {
        if (!this.isAuthenticated()) {
            return {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        // If database is connected, try to get latest stats from DB
        if (this.isDbConnected && this.currentUser.id) {
            try {
                const response = await fetch(`/api/users/${this.currentUser.id}/stats`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('Error fetching user stats from database:', error.message);
            }
        }
        
        // Fallback to localStorage
        return this.currentUser.stats || {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            byGame: {}
        };
    }

    /**
     * Get user achievements
     */
    async getUserAchievements() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        // If database is connected, try to get achievements from DB
        if (this.isDbConnected && this.currentUser.id) {
            try {
                const response = await fetch(`/api/users/${this.currentUser.id}/achievements`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('Error fetching achievements from database:', error.message);
            }
        }
        
        // Fallback to localStorage (basic achievements based on stats)
        const achievements = [];
        const stats = this.currentUser.stats || {};
        
        if (stats.wins && stats.wins > 0) {
            achievements.push({ 
                name: 'First Win',
                description: 'Win your first game',
                icon: 'trophy.png'
            });
        }
        
        if (stats.totalMatches && stats.totalMatches >= 50) {
            achievements.push({
                name: 'Veteran',
                description: 'Play 50 games total',
                icon: 'medal.png'
            });
        }
        
        if (stats.byGame && Object.keys(stats.byGame).length >= 3) {
            achievements.push({
                name: 'Quick Learner',
                description: 'Play all available games',
                icon: 'star.png'
            });
        }
        
        return achievements;
    }

    /**
     * Add friend to user's friends list
     */
    async addFriend(friendId) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize friends list if it doesn't exist
        if (!user.friends) {
            user.friends = [];
        }

        // Check if already friends
        if (user.friends.includes(friendId)) {
            throw new Error('Already friends with this user');
        }

        // Add friend locally
        user.friends.push(friendId);
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        // Try to sync with database
        if (this.isDbConnected && user.id) {
            try {
                const response = await fetch(`/api/friends/request`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        friend_id: friendId
                    })
                });

                if (!response.ok) {
                    console.warn('Failed to send friend request in database');
                }
            } catch (error) {
                console.warn('Error sending friend request to database:', error.message);
            }
        }
        
        return { success: true, user };
    }

    /**
     * Remove friend from user's friends list
     */
    async removeFriend(friendId) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.friends) {
            user.friends = [];
        }

        // Remove friend locally
        user.friends = user.friends.filter(id => id !== friendId);
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        // Try to sync with database
        if (this.isDbConnected && user.id) {
            try {
                const response = await fetch(`/api/friends/${friendId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    console.warn('Failed to remove friend in database');
                }
            } catch (error) {
                console.warn('Error removing friend in database:', error.message);
            }
        }
        
        return { success: true, user };
    }

    /**
     * Get user's friends list
     */
    async getFriends() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        // If database is connected, try to get latest from DB
        if (this.isDbConnected && this.currentUser.id) {
            try {
                const response = await fetch(`/api/friends/${this.currentUser.id}`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('Error fetching friends from database:', error.message);
            }
        }

        // Fallback to localStorage
        const user = this.users[this.currentUser.username];
        if (!user || !user.friends) {
            return [];
        }

        return user.friends.map(friendId => {
            const friend = this.users[friendId];
            return {
                id: friendId,
                username: friend.username,
                displayName: friend.displayName || friend.username,
                avatar: friend.avatar
            };
        });
    }

    /**
     * Get pending friend requests
     */
    async getPendingRequests() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        // If database is connected, try to get from DB
        if (this.isDbConnected && this.currentUser.id) {
            try {
                const response = await fetch(`/api/friends/pending/${this.currentUser.id}`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('Error fetching pending requests from database:', error.message);
            }
        }

        // Fallback to localStorage
        const user = this.users[this.currentUser.username];
        if (!user || !user.pendingRequests) {
            return [];
        }

        return user.pendingRequests.map(requesterId => {
            const requester = this.users[requesterId];
            return {
                id: requesterId,
                username: requester.username,
                displayName: requester.displayName || requester.username,
                avatar: requester.avatar
            };
        });
    }
    
    /**
     * Sync user data with database
     */
    async syncWithDatabase() {
        if (!this.isAuthenticated()) {
            return { success: false, message: 'Not authenticated' };
        }
        
        try {
            // Import DataMigrationService
            const { default: dataMigrationService } = await import('./DataMigrationService.js');
            
            // Migrate current user's data
            const userData = this.users[this.currentUser.username];
            await dataMigrationService.migrateUserData(userData);
            
            this.isDbConnected = true;
            return { success: true, message: 'Data synchronized with database' };
        } catch (error) {
            console.error('Error syncing with database:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Check database connection status
     */
    isDatabaseConnected() {
        return this.isDbConnected;
    }
    
    /**
     * Try to establish database connection
     */
    async checkDatabaseConnection() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const data = await response.json();
                this.isDbConnected = data.status === 'healthy';
                return this.isDbConnected;
            }
            this.isDbConnected = false;
            return false;
        } catch (error) {
            console.warn('Database connection check failed:', error);
            this.isDbConnected = false;
            return false;
        }
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService;