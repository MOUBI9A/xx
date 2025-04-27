import statsService from '../services/StatsService.js';

export default class GameDashboard {
    constructor(gameType, userId) {
        this.gameType = gameType;
        this.userId = userId;
        this.stats = null;
        this.charts = {};
    }

    async initialize() {
        try {
            this.stats = await statsService.getGameStats(this.gameType, this.userId);
            await this.render();
            this.initializeCharts();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            throw error;
        }
    }

    async render() {
        const dashboard = document.createElement('div');
        dashboard.className = 'game-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h2>${this.gameType} Statistics</h2>
                <div class="dashboard-controls">
                    <button class="btn btn-outline-primary btn-sm" id="refreshStats">
                        <i class="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Key Metrics -->
                <div class="stat-card">
                    <h3>Total Games</h3>
                    <div class="stat-value">${this.stats.totalGames}</div>
                    <div class="stat-trend ${this.getTrendClass(this.stats.totalGames, this.stats.previousTotalGames)}">
                        ${this.calculateTrendPercentage(this.stats.totalGames, this.stats.previousTotalGames)}
                    </div>
                </div>

                <div class="stat-card">
                    <h3>Win Rate</h3>
                    <div class="stat-value">${(this.stats.winRate * 100).toFixed(1)}%</div>
                    <div class="stat-trend ${this.getTrendClass(this.stats.winRate, this.stats.previousWinRate)}">
                        ${this.calculateTrendPercentage(this.stats.winRate, this.stats.previousWinRate)}
                    </div>
                </div>

                <div class="stat-card">
                    <h3>High Score</h3>
                    <div class="stat-value">${this.stats.highScore}</div>
                    <div class="stat-trend ${this.getTrendClass(this.stats.highScore, this.stats.previousHighScore)}">
                        ${this.calculateTrendPercentage(this.stats.highScore, this.stats.previousHighScore)}
                    </div>
                </div>

                <div class="stat-card">
                    <h3>Avg. Duration</h3>
                    <div class="stat-value">${this.formatDuration(this.stats.averageDuration)}</div>
                </div>
            </div>

            <!-- Charts -->
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3>Performance History</h3>
                    <canvas id="performanceChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <h3>Win Rate Distribution</h3>
                    <canvas id="winRateChart"></canvas>
                </div>
            </div>

            <!-- Recent Games -->
            <div class="recent-games">
                <h3>Recent Games</h3>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Score</th>
                                <th>Result</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderRecentGames()}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Leaderboard -->
            <div class="leaderboard">
                <h3>Top Players</h3>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>High Score</th>
                                <th>Win Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderLeaderboard()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const container = document.querySelector('.game-stats-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(dashboard);
        }

        this.attachEventListeners();
    }

    initializeCharts() {
        // Performance History Chart
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(perfCtx, {
            type: 'line',
            data: this.getPerformanceChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Win Rate Distribution Chart
        const winRateCtx = document.getElementById('winRateChart').getContext('2d');
        this.charts.winRate = new Chart(winRateCtx, {
            type: 'doughnut',
            data: this.getWinRateChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    getPerformanceChartData() {
        const data = this.stats.performanceHistory.slice().reverse();
        return {
            labels: data.map(game => new Date(game.date).toLocaleDateString()),
            datasets: [{
                label: 'Score',
                data: data.map(game => game.score),
                borderColor: '#007bff',
                tension: 0.1
            }]
        };
    }

    getWinRateChartData() {
        const wins = this.stats.totalGames * this.stats.winRate;
        const losses = this.stats.totalGames - wins;
        return {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        };
    }

    renderRecentGames() {
        return this.stats.recentGames.map(game => `
            <tr>
                <td>${new Date(game.date).toLocaleDateString()}</td>
                <td>${game.score}</td>
                <td>
                    <span class="badge ${game.metadata.winner === this.userId ? 'bg-success' : 'bg-danger'}">
                        ${game.metadata.winner === this.userId ? 'Won' : 'Lost'}
                    </span>
                </td>
                <td>${this.formatDuration(game.metadata.duration)}</td>
            </tr>
        `).join('');
    }

    renderLeaderboard() {
        return this.stats.leaderboard.map((player, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${player.username}</td>
                <td>${player.high_score}</td>
                <td>${(player.win_rate * 100).toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    getTrendClass(current, previous) {
        if (!previous) return '';
        return current > previous ? 'trend-up' : current < previous ? 'trend-down' : 'trend-neutral';
    }

    calculateTrendPercentage(current, previous) {
        if (!previous) return 'N/A';
        const change = ((current - previous) / previous) * 100;
        const icon = change > 0 ? '↑' : change < 0 ? '↓' : '→';
        return `${icon} ${Math.abs(change).toFixed(1)}%`;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('refreshStats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.initialize());
        }
    }
}