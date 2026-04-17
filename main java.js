let quests = JSON.parse(localStorage.getItem('savedQuests')) || [];
let adminPin = localStorage.getItem('adminPin') || null;

window.onload = () => {
    if (!adminPin) {
        document.getElementById('pin-setup-modal').style.display = 'flex';
    }
    renderQuests();
};

function saveToStorage() {
    localStorage.setItem('savedQuests', JSON.stringify(quests));
}

function setInitialPin() {
    const val = document.getElementById('new-pin').value;
    if (val.length < 4) return alert("Pin must be at least 4 digits");
    adminPin = val;
    localStorage.setItem('adminPin', val);
    document.getElementById('pin-setup-modal').style.display = 'none';
}

function requestAccess(action, id = null) {
    if (action === 'start') {
        const userName = prompt("Enter your name to claim this quest:");
        if (userName && userName.trim() !== "") {
            startTimer(id, userName);
        }
    } else {
        const check = prompt("Enter Admin Pin to proceed:");
        if (check === adminPin) {
            if (action === 'post') toggleModal(true);
            if (action === 'delete') deleteQuest(id);
        } else {
            alert("Incorrect Pin!");
        }
    }
}

function toggleModal(show) {
    document.getElementById('modal').style.display = show ? 'flex' : 'none';
}

function addQuest() {
    const name = document.getElementById('quest-name').value;
    const instructions = document.getElementById('quest-instructions').value;
    const reward = document.getElementById('quest-reward').value;
    
    const h = parseInt(document.getElementById('quest-hours').value) || 0;
    const m = parseInt(document.getElementById('quest-mins').value) || 0;
    const s = parseInt(document.getElementById('quest-secs').value) || 0;

    const totalSecs = (h * 3600) + (m * 60) + s;

    if (!name || totalSecs <= 0) return alert("Please provide a name and a time limit");

    const newQuest = {
        id: Date.now(),
        name,
        instructions,
        reward,
        totalDuration: totalSecs, // Original time set
        startTime: null,          // This will hold the exact start date/time
        isRunning: false,
        completed: false,
        claimedBy: null
    };

    quests.push(newQuest);
    saveToStorage();
    renderQuests();
    toggleModal(false);
}

function startTimer(id, userName) {
    const quest = quests.find(q => q.id === id);
    if (quest) {
        quest.isRunning = true;
        quest.claimedBy = userName;
        // Save the exact timestamp when started
        quest.startTime = Date.now(); 
        saveToStorage();
    }
    renderQuests();
}

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}h | ${m.toString().padStart(2, '0')}m | ${s.toString().padStart(2, '0')}s`;
}

// Background Clock Logic
setInterval(() => {
    renderQuests();
}, 1000);

function deleteQuest(id) {
    quests = quests.filter(q => q.id !== id);
    saveToStorage();
    renderQuests();
}

function toggleComplete(id) {
    const quest = quests.find(q => q.id === id);
    if (quest) {
        quest.completed = !quest.completed;
        saveToStorage();
        renderQuests();
    }
}

function renderQuests() {
    const container = document.getElementById('quest-container');
    container.innerHTML = '';
    
    let active = 0;
    let done = 0;

    quests.forEach(q => {
        if (q.completed) done++; else active++;

        // Calculate current remaining time
        let currentRemaining;
        if (q.isRunning && q.startTime && !q.completed) {
            const elapsedMs = Date.now() - q.startTime;
            const elapsedSec = Math.floor(elapsedMs / 1000);
            currentRemaining = q.totalDuration - elapsedSec;
        } else {
            currentRemaining = q.totalDuration;
        }

        const isExpired = currentRemaining <= 0;
        const card = document.createElement('article');
        card.className = `quest-card ${q.completed ? 'finished' : ''} ${isExpired ? 'expired' : ''}`;
        
        card.innerHTML = `
            <h3 class="card-title">${q.name}</h3>
            ${q.claimedBy ? `<div class="claimed-badge">Claimed by: ${q.claimedBy}</div>` : ''}
            <p class="card-description">${q.instructions}</p>
            <div class="timer-display">
                ${isExpired ? "TIME EXPIRED" : formatTime(currentRemaining)}
            </div>
            ${(!q.isRunning && !q.completed) ? `<button class="start-timer-btn" onclick="requestAccess('start', ${q.id})">Claim Quest</button>` : ''}
            <div class="reward-group"><span>🎁 ${q.reward}</span></div>
            <div class="card-actions">
                <button class="action-btn" onclick="toggleComplete(${q.id})">✅</button>
                <button class="action-btn trash-btn" onclick="requestAccess('delete', ${q.id})">🗑️</button>
            </div>
        `;
        container.appendChild(card);
    });

    document.getElementById('active-count').innerText = active;
    document.getElementById('completed-count').innerText = done;
}