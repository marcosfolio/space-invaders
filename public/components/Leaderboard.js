export class Leaderboard {
    constructor() {
        this.maxEntries = 10;
        this.leaderboard = [];
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        const storedLeaderboard = localStorage.getItem('spaceInvadersLeaderboard');
        if (storedLeaderboard) {
            this.leaderboard = JSON.parse(storedLeaderboard);
        }
    }

    saveLeaderboard() {
        localStorage.setItem('spaceInvadersLeaderboard', JSON.stringify(this.leaderboard));
    }

    updateDisplay() {
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = `
            <div class="leaderboard-header">
                <div class="trophy"></div>
                <h2>Top 10 Scores</h2>
            </div>
        `;
        this.leaderboard.forEach((entry, index) => {
            leaderboardElement.innerHTML += `<p>${index + 1}. ${entry.name}: ${entry.score}</p>`;
        });
    }

    addHighScore(name, score) {
        this.leaderboard.push({ name, score });
        this.leaderboard.sort((a, b) => b.score - a.score);
        if (this.leaderboard.length > this.maxEntries) {
            this.leaderboard.pop();
        }
        this.saveLeaderboard();
        this.updateDisplay();
    }

    isHighScore(score) {
        return this.leaderboard.length < this.maxEntries || score > this.leaderboard[this.leaderboard.length - 1].score;
    }
} 