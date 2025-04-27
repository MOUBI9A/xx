import AbstractView from './AbstractView.js';

export default class Games extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Games');
    }

    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Game Library</h1>
                <div class="row mb-4">
                    <div class="col-lg-4 col-md-6 mb-3 mb-md-0">
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="Search games..." id="gameSearch">
                            <button class="btn btn-outline-primary" type="button"><i class="bi bi-search"></i></button>
                        </div>
                    </div>
                    <div class="col-lg-8 col-md-6">
                        <div class="btn-group float-md-end d-flex flex-wrap justify-content-center justify-content-md-end" role="group">
                            <button type="button" class="btn btn-outline-primary active">All</button>
                            <button type="button" class="btn btn-outline-primary">Puzzle</button>
                            <button type="button" class="btn btn-outline-primary">Arcade</button>
                        </div>
                    </div>
                </div>
                
                <div class="row g-4">
                    <!-- Game items -->
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <div class="card game-card h-100">
                            <div class="position-relative">
                                <span class="position-absolute top-0 end-0 badge bg-success m-2">New</span>
                                <div class="game-card-icon d-flex align-items-center justify-content-center p-4 text-center" style="height: 180px; background-color: #e9ecef;">
                                    <i class="bi bi-grid-3x3 text-primary" style="font-size: 6rem;"></i>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Tic Tac Toe</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="text-warning me-1">
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star"></i>
                                    </div>
                                    <small class="text-muted ms-1">(36)</small>
                                </div>
                                <p class="card-text">Classic Tic Tac Toe game with 1P vs AI and 2P modes.</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">Puzzle</span>
                                    <a href="/games/tictactoe" class="btn btn-primary" data-link><i class="bi bi-controller"></i> Play</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <div class="card game-card h-100">
                            <div class="position-relative">
                                <span class="position-absolute top-0 end-0 badge bg-success m-2">New</span>
                                <div class="game-card-icon d-flex align-items-center justify-content-center p-4 text-center" style="height: 180px; background-color: #e9ecef;">
                                    <i class="bi bi-scissors text-danger mx-2" style="font-size: 3rem;"></i>
                                    <i class="bi bi-file text-primary mx-2" style="font-size: 3rem;"></i>
                                    <i class="bi bi-circle text-success mx-2" style="font-size: 3rem;"></i>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Rock Paper Scissors</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="text-warning me-1">
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star"></i>
                                    </div>
                                    <small class="text-muted ms-1">(42)</small>
                                </div>
                                <p class="card-text">Play Rock Paper Scissors against AI or a friend in best of 5 rounds.</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">Casual</span>
                                    <a href="/games/rockpaperscissors" class="btn btn-primary" data-link><i class="bi bi-controller"></i> Play</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <div class="card game-card h-100">
                            <div class="position-relative">
                                <span class="position-absolute top-0 end-0 badge bg-primary m-2">Popular</span>
                                <div class="game-card-icon d-flex align-items-center justify-content-center p-4 text-center" style="height: 180px; background-color: #e9ecef;">
                                    <i class="bi bi-circle-fill text-dark mx-2" style="font-size: 3rem;"></i>
                                    <i class="bi bi-dash-lg text-dark mx-2" style="font-size: 3rem; transform: rotate(90deg);"></i>
                                    <i class="bi bi-circle text-dark mx-2" style="font-size: 3rem;"></i>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Pong</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="text-warning me-1">
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-half"></i>
                                    </div>
                                    <small class="text-muted ms-1">(48)</small>
                                </div>
                                <p class="card-text">Classic arcade Pong game with 1P and 2P modes.</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">Arcade</span>
                                    <a href="/games/pong" class="btn btn-primary" data-link><i class="bi bi-controller"></i> Play</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <div class="card game-card h-100">
                            <div class="position-relative">
                                <span class="position-absolute top-0 end-0 badge bg-warning m-2">Tournament</span>
                                <div class="game-card-icon d-flex align-items-center justify-content-center p-4 text-center" style="height: 180px; background-color: #e9ecef;">
                                    <i class="bi bi-trophy text-warning" style="font-size: 5rem;"></i>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Pong Tournament</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="text-warning me-1">
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                    </div>
                                    <small class="text-muted ms-1">(23)</small>
                                </div>
                                <p class="card-text">Play an offline Pong tournament with friends (2-8 players).</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">Tournament</span>
                                    <a href="/games/pong/tournament" class="btn btn-primary" data-link><i class="bi bi-trophy"></i> Play</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- New Snake Game Card -->
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <div class="card game-card h-100">
                            <div class="position-relative">
                                <span class="position-absolute top-0 end-0 badge bg-danger m-2">Hot</span>
                                <div class="game-card-icon d-flex align-items-center justify-content-center p-4 text-center" style="height: 180px; background-color: #e9ecef;">
                                    <svg width="80" height="80" viewBox="0 0 24 24" style="fill: #32CD32;">
                                        <path d="M20 10h-2V8h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v2H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2h2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zm-6 0h-4V6h4v4z"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Snake</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="text-warning me-1">
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                        <i class="bi bi-star-fill"></i>
                                    </div>
                                    <small class="text-muted ms-1">(54)</small>
                                </div>
                                <p class="card-text">Classic Snake with customizable maps, power-ups, and matchmaking!</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">Arcade</span>
                                    <a href="/games/snake" class="btn btn-primary" data-link><i class="bi bi-controller"></i> Play</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Add event listeners for filter buttons
        document.querySelectorAll('.btn-group .btn-outline-primary').forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                document.querySelectorAll('.btn-group .btn-outline-primary').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get the filter value
                const filterValue = this.textContent.trim().toLowerCase();
                
                // Filter games
                filterGames(filterValue);
            });
        });

        // Add event listener for search
        const searchInput = document.getElementById('gameSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchValue = this.value.toLowerCase();
                searchGames(searchValue);
            });
        }

        // Function to filter games by category
        function filterGames(category) {
            const gameCards = document.querySelectorAll('.game-card');
            gameCards.forEach(card => {
                const cardCategory = card.querySelector('.badge').textContent.toLowerCase();
                const cardContainer = card.closest('.col-xl-3');
                
                if (category === 'all' || cardCategory.includes(category)) {
                    cardContainer.style.display = 'block';
                } else {
                    cardContainer.style.display = 'none';
                }
            });
        }

        // Function to search games by title or description
        function searchGames(searchText) {
            const gameCards = document.querySelectorAll('.game-card');
            gameCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const description = card.querySelector('.card-text').textContent.toLowerCase();
                const cardContainer = card.closest('.col-xl-3');
                
                if (title.includes(searchText) || description.includes(searchText)) {
                    cardContainer.style.display = 'block';
                } else {
                    cardContainer.style.display = 'none';
                }
            });
        }
    }
}