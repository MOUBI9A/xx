import AbstractView from "./AbstractView.js";
import authService from "../services/AuthService.js";

export default class Friends extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Game Hub - Friends");
        this.currentUser = authService.getCurrentUser();
        this.statusMessage = null;
    }

    async getFriends() {
        try {
            // Use authService to get friends if user is authenticated
            if (this.currentUser && this.currentUser.id) {
                return await authService.getFriends();
            }
            return [];
        } catch (error) {
            console.error('Error fetching friends:', error);
            this.statusMessage = 'Failed to load friends list. Please try again.';
            return [];
        }
    }

    async getPendingRequests() {
        try {
            // Use authService to get pending requests if user is authenticated
            if (this.currentUser && this.currentUser.id) {
                return await authService.getPendingRequests();
            }
            return [];
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            this.statusMessage = 'Failed to load friend requests. Please try again.';
            return [];
        }
    }

    async searchUsers(query) {
        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error searching users:', error);
            this.statusMessage = 'Failed to search users. Please try again.';
            return [];
        }
    }

    async getHtml() {
        if (!authService.isAuthenticated()) {
            return `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Please <a href="/login" data-link>login</a> to manage your friends.
                </div>
            `;
        }

        const friends = await this.getFriends();
        const pendingRequests = await this.getPendingRequests();

        return `
            <div class="friends-container">
                <h2 class="mb-4"><i class="bi bi-people-fill"></i> Friends</h2>
                
                ${this.statusMessage ? `<div class="alert alert-info alert-dismissible fade show" role="alert">
                    ${this.statusMessage}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>` : ''}
                
                <!-- Friend Search Section -->
                <div class="card mb-4">
                    <div class="card-body">
                        <h3 class="card-title">Add Friends</h3>
                        <div class="input-group mb-3">
                            <input type="text" id="friendSearch" class="form-control" placeholder="Search users...">
                            <button class="btn btn-outline-primary" type="button" id="searchButton">
                                <i class="bi bi-search"></i> Search
                            </button>
                        </div>
                        <div id="searchResults" class="list-group mt-2">
                            <!-- Search results will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Friend Requests Section -->
                <div class="card mb-4">
                    <div class="card-body">
                        <h3 class="card-title">Friend Requests</h3>
                        <div id="friendRequests" class="list-group">
                            ${pendingRequests.length === 0 ? 
                                '<p class="text-muted">No pending friend requests</p>' :
                                pendingRequests.map(request => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <i class="bi bi-person-fill me-2"></i>
                                            <span>${request.username || request.displayName}</span>
                                        </div>
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-success accept-request" data-id="${request.id}">
                                                <i class="bi bi-check-lg"></i> Accept
                                            </button>
                                            <button class="btn btn-sm btn-danger reject-request" data-id="${request.id}">
                                                <i class="bi bi-x-lg"></i> Reject
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Friends List Section -->
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">My Friends</h3>
                        <div id="friendsList" class="list-group">
                            ${friends.length === 0 ? 
                                '<p class="text-muted">No friends added yet</p>' :
                                friends.map(friend => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <i class="bi bi-person-fill me-2"></i>
                                            <span>${friend.username || friend.displayName}</span>
                                        </div>
                                        <button class="btn btn-sm btn-outline-danger remove-friend" data-id="${friend.id}">
                                            <i class="bi bi-person-x-fill"></i> Remove
                                        </button>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        if (!this.currentUser) return;

        const searchInput = document.getElementById('friendSearch');
        const searchButton = document.getElementById('searchButton');
        const searchResults = document.getElementById('searchResults');

        let searchTimeout;

        const handleSearch = async () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                searchResults.innerHTML = '<p class="text-center"><i class="bi bi-hourglass-split"></i> Searching...</p>';
                const users = await this.searchUsers(query);
                
                if (users.length === 0) {
                    searchResults.innerHTML = '<p class="text-muted">No users found</p>';
                    return;
                }

                // Get current friends to avoid showing them in search results
                const friends = await this.getFriends();
                const friendIds = friends.map(friend => friend.id);
                
                // Get pending requests to show correct button state
                const pendingRequests = await this.getPendingRequests();
                const pendingIds = pendingRequests.map(req => req.id);
                
                searchResults.innerHTML = users
                    .filter(user => user.id !== this.currentUser.id && !friendIds.includes(user.id))
                    .map(user => {
                        const isPending = pendingIds.includes(user.id);
                        return `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="bi bi-person me-2"></i>
                                    <span>${user.username || user.displayName}</span>
                                </div>
                                <button class="btn btn-sm ${isPending ? 'btn-success disabled' : 'btn-primary'} add-friend" 
                                       data-id="${user.id}" ${isPending ? 'disabled' : ''}>
                                    <i class="bi bi-${isPending ? 'check-lg' : 'person-plus-fill'}"></i> 
                                    ${isPending ? 'Request Sent' : 'Add Friend'}
                                </button>
                            </div>
                        `;
                    }).join('') || '<p class="text-muted">No users found</p>';
            } else {
                searchResults.innerHTML = '';
            }
        };

        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(handleSearch, 300);
        });

        searchButton?.addEventListener('click', handleSearch);

        document.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.classList.contains('add-friend')) {
                try {
                    target.disabled = true;
                    target.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';
                    
                    await authService.addFriend(target.dataset.id);
                    
                    target.disabled = true;
                    target.innerHTML = '<i class="bi bi-check-lg"></i> Request Sent';
                    target.classList.replace('btn-primary', 'btn-success');
                    
                    this.statusMessage = 'Friend request sent successfully!';
                    this.refreshView();
                } catch (error) {
                    console.error('Error sending friend request:', error);
                    target.disabled = false;
                    target.innerHTML = '<i class="bi bi-person-plus-fill"></i> Add Friend';
                    this.statusMessage = 'Failed to send friend request. Please try again.';
                    this.refreshView();
                }
            }

            if (target.classList.contains('accept-request') || target.classList.contains('reject-request')) {
                const status = target.classList.contains('accept-request') ? 'accepted' : 'rejected';
                try {
                    target.disabled = true;
                    const parentItem = target.closest('.list-group-item');
                    
                    const response = await fetch(`/api/friends/${target.dataset.id}/respond`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                    
                    if (response.ok) {
                        if (status === 'accepted') {
                            this.statusMessage = 'Friend request accepted!';
                        } else {
                            this.statusMessage = 'Friend request rejected.';
                        }
                        
                        // Remove the request from the UI
                        parentItem.remove();
                        
                        // Refresh the friends list if a request was accepted
                        if (status === 'accepted') {
                            this.refreshView();
                        }
                    } else {
                        throw new Error('Failed to respond to request');
                    }
                } catch (error) {
                    console.error('Error responding to friend request:', error);
                    target.disabled = false;
                    this.statusMessage = 'Failed to process friend request. Please try again.';
                    this.refreshView();
                }
            }

            if (target.classList.contains('remove-friend')) {
                if (confirm('Are you sure you want to remove this friend?')) {
                    try {
                        target.disabled = true;
                        const parentItem = target.closest('.list-group-item');
                        
                        await authService.removeFriend(target.dataset.id);
                        parentItem.remove();
                        
                        this.statusMessage = 'Friend removed successfully.';
                        this.refreshView();
                    } catch (error) {
                        console.error('Error removing friend:', error);
                        target.disabled = false;
                        this.statusMessage = 'Failed to remove friend. Please try again.';
                        this.refreshView();
                    }
                }
            }
        });
    }
    
    refreshView() {
        // Re-render the component to show updated data
        const viewContainer = document.querySelector('.view-container');
        if (viewContainer) {
            this.getHtml().then(html => {
                viewContainer.innerHTML = html;
                this.afterRender();
            });
        }
    }
}