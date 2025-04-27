import AbstractView from "./AbstractView.js";
import authService from "../services/AuthService.js";

export default class Profile extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Game Hub - Profile");
        this.currentUser = authService.getCurrentUser();
        this.isEditing = false;
    }

    async getHtml() {
        if (!authService.isAuthenticated()) {
            return `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Please <a href="/login" data-link>login</a> to view your profile.
                </div>
            `;
        }

        // Get current avatar or use default
        const avatarSrc = this.currentUser.avatar || "src/assets/images/default-avatar.png";
        const userDisplayName = this.currentUser.displayName || this.currentUser.username;
        const userBio = this.currentUser.bio || "No bio provided";

        return `
            <div class="profile-container">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-body text-center">
                                <div class="avatar-upload">
                                    <div class="avatar-preview">
                                        <img src="${avatarSrc}" alt="Profile Picture" class="profile-avatar rounded-circle mb-3">
                                        <div class="avatar-overlay" id="avatar-overlay">
                                            <i class="bi bi-camera"></i>
                                            <small>Change Avatar</small>
                                        </div>
                                    </div>
                                    <input type="file" id="avatar-input" class="avatar-input" accept="image/*">
                                </div>
                                <h3 class="card-title mb-0">${userDisplayName}</h3>
                                <p class="text-muted">${userBio}</p>
                                <div class="mt-3">
                                    <button id="edit-profile-btn" class="btn btn-primary">
                                        <i class="bi bi-pencil-square"></i> Edit Profile
                                    </button>
                                    <a href="/friends" class="btn btn-outline-primary" data-link>
                                        <i class="bi bi-people-fill"></i> Manage Friends
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title">Account Details</h5>
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between">
                                        <span>Username:</span>
                                        <span class="text-muted">${this.currentUser.username}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between">
                                        <span>Email:</span>
                                        <span class="text-muted">${this.currentUser.email}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between">
                                        <span>Member since:</span>
                                        <span class="text-muted">${new Date(this.currentUser.created).toLocaleDateString()}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-8">
                        <!-- Profile edit form (initially hidden) -->
                        <div id="profile-edit-section" class="card mb-4 d-none">
                            <div class="card-body">
                                <h5 class="card-title">Edit Profile</h5>
                                <form id="profile-edit-form" class="profile-edit-form">
                                    <div class="mb-3">
                                        <label for="display-name" class="form-label">Display Name</label>
                                        <input type="text" class="form-control" id="display-name" value="${userDisplayName}">
                                    </div>
                                    <div class="mb-3">
                                        <label for="bio" class="form-label">Bio</label>
                                        <textarea class="form-control" id="bio" rows="3">${userBio}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Avatar</label>
                                        <div class="d-flex align-items-center">
                                            <img src="${avatarSrc}" alt="Current Avatar" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">
                                            <div>
                                                <button type="button" class="btn btn-outline-primary btn-sm" id="change-avatar-btn">
                                                    <i class="bi bi-camera"></i> Change
                                                </button>
                                                <button type="button" class="btn btn-outline-secondary btn-sm ms-2" id="use-default-avatar-btn">
                                                    <i class="bi bi-arrow-counterclockwise"></i> Use Default
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-end">
                                        <button type="button" class="btn btn-outline-secondary me-2" id="cancel-edit-btn">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title">Game Statistics</h5>
                                <canvas id="gameStatsChart"></canvas>
                            </div>
                        </div>

                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title">Recent Activity</h5>
                                <div class="list-group">
                                    <div class="list-group-item">
                                        <div class="d-flex w-100 justify-content-between">
                                            <h6 class="mb-1">Won Tic Tac Toe match</h6>
                                            <small class="text-muted">3 days ago</small>
                                        </div>
                                        <p class="mb-1">Victory against Player123</p>
                                    </div>
                                    <div class="list-group-item">
                                        <div class="d-flex w-100 justify-content-between">
                                            <h6 class="mb-1">New high score in Pong</h6>
                                            <small class="text-muted">5 days ago</small>
                                        </div>
                                        <p class="mb-1">Scored 150 points</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Achievements</h5>
                                <div class="row g-3">
                                    <div class="col-md-4 col-6">
                                        <div class="achievement">
                                            <i class="bi bi-trophy-fill text-warning"></i>
                                            <span>First Win</span>
                                        </div>
                                    </div>
                                    <div class="col-md-4 col-6">
                                        <div class="achievement">
                                            <i class="bi bi-star-fill text-info"></i>
                                            <span>Speed Champion</span>
                                        </div>
                                    </div>
                                    <div class="col-md-4 col-6">
                                        <div class="achievement">
                                            <i class="bi bi-lightning-fill text-danger"></i>
                                            <span>Quick Learner</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        if (!this.currentUser) return;

        // Initialize game statistics chart
        const ctx = document.getElementById('gameStatsChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Tic Tac Toe', 'Pong', 'Rock Paper Scissors'],
                    datasets: [{
                        label: 'Wins',
                        data: [12, 8, 15],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Losses',
                        data: [8, 5, 10],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Handle edit profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const profileEditSection = document.getElementById('profile-edit-section');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        if (editProfileBtn && profileEditSection) {
            editProfileBtn.addEventListener('click', () => {
                profileEditSection.classList.remove('d-none');
                editProfileBtn.classList.add('d-none');
            });
        }
        
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                profileEditSection.classList.add('d-none');
                editProfileBtn.classList.remove('d-none');
            });
        }
        
        // Handle profile form submission
        const profileForm = document.getElementById('profile-edit-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const displayName = document.getElementById('display-name').value.trim();
                const bio = document.getElementById('bio').value.trim();
                
                try {
                    const updates = {
                        displayName,
                        bio
                    };
                    
                    // If we have a pending avatar update, add it
                    if (this.pendingAvatarData) {
                        updates.avatar = this.pendingAvatarData;
                    }
                    
                    // Update profile using auth service
                    await authService.updateProfile(updates);
                    
                    // Reload the page to show updates
                    window.location.reload();
                } catch (error) {
                    alert(`Error updating profile: ${error.message}`);
                }
            });
        }
        
        // Handle avatar upload
        const avatarInput = document.getElementById('avatar-input');
        const avatarOverlay = document.getElementById('avatar-overlay');
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        
        // Function to handle avatar file selection
        const handleAvatarSelect = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Store the base64 data for submission
                    this.pendingAvatarData = e.target.result;
                    
                    // Update all avatar previews
                    document.querySelectorAll('.profile-avatar, .avatar-preview img').forEach(img => {
                        img.src = e.target.result;
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        
        if (avatarInput) {
            avatarInput.addEventListener('change', handleAvatarSelect);
        }
        
        if (avatarOverlay) {
            avatarOverlay.addEventListener('click', () => {
                avatarInput.click();
            });
        }
        
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                avatarInput.click();
            });
        }
        
        // Handle "Use Default" button
        const useDefaultAvatarBtn = document.getElementById('use-default-avatar-btn');
        if (useDefaultAvatarBtn) {
            useDefaultAvatarBtn.addEventListener('click', () => {
                const defaultAvatarPath = "src/assets/images/default-avatar.png";
                
                // Update all avatar previews
                document.querySelectorAll('.profile-avatar, .avatar-preview img').forEach(img => {
                    img.src = defaultAvatarPath;
                });
                
                // Set pending avatar data to null (will clear the custom avatar)
                this.pendingAvatarData = null;
            });
        }
    }
}