// Expanded Web3 Marketing Terms
const WEB3_MARKETING_TERMS = [
    // Core Web3
    "NFT", "DeFi", "DAO", "Smart Contract", "Blockchain", "Token", "Metaverso", "Web3",
    "Cripto", "Wallet", "Mining", "Staking", "Yield", "Liquidity", "DEX", "CEX",
    
    // Marketing Web3 Specific
    "Community Building", "Token Gating", "Whitelist Marketing", "Influencer NFTs", "Creator Economy",
    "Social Tokens", "Fan Tokens", "Loyalty Rewards", "Gamification", "Play-to-Earn",
    "Engagement Mining", "Creator Coins", "Branded NFTs", "Virtual Events", "Metaverse Marketing",
    
    // DeFi Marketing
    "Yield Farming", "Liquidity Mining", "Staking Rewards", "Protocol Incentives", "Governance Tokens",
    "Tokenomics Design", "Airdrop Campaign", "Retroactive Rewards", "Fee Sharing", "Revenue Share",
    
    // NFT Marketing
    "Utility NFTs", "PFP Project", "Roadmap", "Mint Strategy", "Reveal Marketing", "Floor Price",
    "Trait Rarity", "Collection Launch", "Exclusive Access", "Holder Benefits", "Secondary Sales",
    
    // Community & Social
    "Discord Marketing", "Twitter Spaces", "Telegram Groups", "Ambassador Program", "Referral Program",
    "Content Creation", "Meme Marketing", "Viral Campaigns", "KOL Marketing", "Community Rewards",
    
    // Technology Terms
    "Layer 1", "Layer 2", "Cross-chain", "Interoperability", "Scalability", "Gas Optimization",
    "Smart Contract Audit", "Security Tokens", "Compliance", "KYC/AML", "Regulatory Framework",
    
    // Trading & Finance
    "Market Making", "AMM", "Order Book", "Slippage", "Impermanent Loss", "APR", "APY", "TVL",
    "Volume", "Market Cap", "Fully Diluted Value", "Circulating Supply", "Token Distribution",
    
    // Trends & Culture
    "HODL", "FOMO", "FUD", "Diamond Hands", "Paper Hands", "Whale", "Retail Investor", "Institutional",
    "Bull Market", "Bear Market", "ATH", "ATL", "Pump", "Dump", "Moon", "Rekt"
];

// Global State
let participants = [];
let gameState = {
    started: false,
    terms: [],
    calledTerms: [],
    currentIndex: 0
};
let currentParticipant = null;

// Mode Switching
function switchMode(event, mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    document.getElementById('participant-mode').classList.toggle('hidden', mode !== 'participant');
    document.getElementById('moderator-mode').classList.toggle('hidden', mode !== 'moderator');
    if (mode === 'moderator') {
        updateParticipantsList();
    }
}

// Participant Registration
function registerParticipant() {
    const name = document.getElementById('participantName').value.trim();
    if (!name) {
        showMobileAlert('Por favor ingresa tu nombre');
        return;
    }
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showMobileAlert('Este nombre ya está registrado. Usa otro nombre.');
        return;
    }
    const participant = {
        id: Date.now(),
        name: name,
        card: null,
        registered: new Date()
    };
    participants.push(participant);
    currentParticipant = participant;
    document.getElementById('registeredName').textContent = name;
    document.getElementById('registration-section').classList.add('hidden');
    document.getElementById('waiting-section').classList.remove('hidden');
    localStorage.setItem('mkt_bingo_participants', JSON.stringify(participants));
    localStorage.setItem('mkt_current_participant', JSON.stringify(currentParticipant));
}

// Generate unique bingo card
function generateUniqueCard() {
    const shuffled = [...WEB3_MARKETING_TERMS].sort(() => Math.random() - 0.5);
    const cardTerms = shuffled.slice(0, 24);
    cardTerms.splice(12, 0, 'FREE');
    return cardTerms;
}

// Assign cards to all participants
function assignCards() {
    if (participants.length === 0) {
        showMobileAlert('No hay participantes registrados');
        return;
    }
    participants.forEach(participant => {
        if (!participant.card) {
            participant.card = generateUniqueCard();
        }
    });
    localStorage.setItem('mkt_bingo_participants', JSON.stringify(participants));
    updateParticipantsList();
    if (currentParticipant) {
        const updatedParticipant = participants.find(p => p.id === currentParticipant.id);
        if (updatedParticipant && updatedParticipant.card) {
            currentParticipant = updatedParticipant;
            localStorage.setItem('mkt_current_participant', JSON.stringify(currentParticipant));
            showPlayerCard();
        }
    }
    showMobileAlert(`✅ Se asignaron cartillas a ${participants.length} participantes`);
}

// Show player's card
function showPlayerCard() {
    if (!currentParticipant || !currentParticipant.card) return;
    document.getElementById('waiting-section').classList.add('hidden');
    document.getElementById('playing-section').classList.remove('hidden');
    const cardContainer = document.getElementById('playerCard');
    
    // Build card HTML safely
    let cardHTML = '<div class="card-header">' + currentParticipant.name + '</div>';
    cardHTML += '<div class="bingo-grid">';
    
    currentParticipant.card.forEach((term) => {
        let displayTerm = term;
        if (term.length > 12 && window.innerWidth < 480) {
            const abbreviations = {
                'Smart Contract': 'Smart C.',
                'Community Building': 'Community',
                'Token Gating': 'Token Gate',
                'Whitelist Marketing': 'Whitelist',
                'Influencer NFTs': 'Influencer',
                'Creator Economy': 'Creator Eco',
                'Engagement Mining': 'Engagement',
                'Metaverse Marketing': 'Metaverse',
                'Protocol Incentives': 'Protocol Inc',
                'Governance Tokens': 'Governance'
            };
            displayTerm = abbreviations[term] || term;
        }
        
        const isFree = term === 'FREE';
        const disabled = isFree ? 'disabled' : '';
        const freeClass = isFree ? 'free' : '';
        
        cardHTML += '<button class="bingo-cell ' + freeClass + '" onclick="toggleCell(this, \'' + term + '\')" ' + disabled + ' data-term="' + term + '" title="' + term + '">' + displayTerm + '</button>';
    });
    
    cardHTML += '</div>';
    cardContainer.innerHTML = cardHTML;
    
    addSwipeDetection(cardContainer);
}

// Add swipe detection
function addSwipeDetection(element) {
    let startY = 0;
    let startX = 0;
    element.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
    }, { passive: true });
    element.addEventListener('touchend', function(e) {
        if (!startY || !startX) return;
        let endY = e.changedTouches[0].clientY;
        let endX = e.changedTouches[0].clientX;
        let diffY = startY - endY;
        let diffX = startX - endX;
        if (Math.abs(diffY) > Math.abs(diffX)) {
            if (diffY > 50) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            } else if (diffY < -50) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
        startY = 0;
        startX = 0;
    }, { passive: true });
}

// Toggle cell
function toggleCell(cell, term) {
    if (term === 'FREE') return;
    if (!gameState.calledTerms.includes(term)) {
        showMobileAlert('⚠️ Este término aún no ha sido cantado');
        return;
    }
    cell.classList.toggle('marked');
    if (navigator.vibrate) navigator.vibrate(50);
    cell.style.transform = 'scale(0.9)';
    setTimeout(() => { cell.style.transform = ''; }, 150);
}

// Mobile alert
function showMobileAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        max-width: 80%;
        text-align: center;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => { alertDiv.remove(); }, 2000);
}

// Update participants list
function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    const countSpan = document.getElementById('participantCount');
    countSpan.textContent = participants.length;
    if (participants.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No hay participantes registrados</p>';
        return;
    }
    
    let participantsHTML = '';
    participants.forEach(participant => {
        const assignedClass = participant.card ? 'assigned' : '';
        const statusClass = participant.card ? 'status-assigned' : 'status-waiting';
        const statusText = participant.card ? 'Cartilla Asignada' : 'Esperando';
        const registeredTime = new Date(participant.registered).toLocaleTimeString();
        
        participantsHTML += '<div class="participant-item ' + assignedClass + '">';
        participantsHTML += '<div>';
        participantsHTML += '<div class="participant-name">' + participant.name + '</div>';
        participantsHTML += '<small style="color: #7f8c8d;">Registrado: ' + registeredTime + '</small>';
        participantsHTML += '</div>';
        participantsHTML += '<div class="participant-status-badge ' + statusClass + '">';
        participantsHTML += statusText;
        participantsHTML += '</div>';
        participantsHTML += '</div>';
    });
    
    container.innerHTML = participantsHTML;
}

// Game Management
function startGame() {
    if (participants.length === 0) {
        showMobileAlert('No hay participantes registrados');
        return;
    }
    if (!participants.every(p => p.card)) {
        showMobileAlert('Primero asigna cartillas a todos los participantes');
        return;
    }
    gameState.terms = [...WEB3_MARKETING_TERMS].sort(() => Math.random() - 0.5);
    gameState.calledTerms = [];
    gameState.currentIndex = 0;
    gameState.started = true;
    document.getElementById('currentTerm').textContent = '🎮 Juego iniciado - Presiona "Siguiente Término"';
    updateGameStats();
    localStorage.setItem('mkt_bingo_gamestate', JSON.stringify(gameState));
}

function callNextTerm() {
    if (!gameState.started) {
        showMobileAlert('Primero inicia el juego');
        return;
    }
    if (gameState.currentIndex >= gameState.terms.length) {
        document.getElementById('currentTerm').textContent = '🎯 ¡Todos los términos han sido cantados!';
        return;
    }
    const nextTerm = gameState.terms[gameState.currentIndex];
    gameState.calledTerms.push(nextTerm);
    gameState.currentIndex++;
    document.getElementById('currentTerm').innerHTML = `🎯 <strong>"${nextTerm}"</strong>`;
    const calledContainer = document.getElementById('calledTermsList');
    const termDiv = document.createElement('div');
    termDiv.className = 'called-term';
    termDiv.textContent = nextTerm;
    calledContainer.appendChild(termDiv);
    updateGameStats();
    localStorage.setItem('mkt_bingo_gamestate', JSON.stringify(gameState));
}

function updateGameStats() {
    document.getElementById('termsCalledCount').textContent = gameState.calledTerms.length;
    document.getElementById('termsRemainingCount').textContent = gameState.terms.length - gameState.currentIndex;
}

function resetGame() {
    const confirmed = confirm('¿Estás seguro de reiniciar el juego? Se perderán todos los datos.');
    if (!confirmed) return;
    participants = [];
    gameState = { started: false, terms: [], calledTerms: [], currentIndex: 0 };
    currentParticipant = null;
    localStorage.removeItem('mkt_bingo_participants');
    localStorage.removeItem('mkt_current_participant');
    localStorage.removeItem('mkt_bingo_gamestate');
    document.getElementById('calledTermsList').innerHTML = '';
    document.getElementById('currentTerm').textContent = 'Registra participantes y asigna cartillas para comenzar';
    updateParticipantsList();
    updateGameStats();
    document.getElementById('registration-section').classList.remove('hidden');
    document.getElementById('waiting-section').classList.add('hidden');
    document.getElementById('playing-section').classList.add('hidden');
    document.getElementById('participantName').value = '';
}

function claimBingo() {
    if (!currentParticipant) return;
    const playerName = currentParticipant.name;
    showMobileAlert(`¡${playerName} ha cantado BINGO! 🎉`);
    createCelebrationEffect();
}

// Celebration effect
function createCelebrationEffect() {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                top: -10px;
                left: ${Math.random() * 100}%;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                animation: fall 3s linear forwards;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 100);
    }
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
    const savedParticipants = localStorage.getItem('mkt_bingo_participants');
    const savedCurrentParticipant = localStorage.getItem('mkt_current_participant');
    const savedGameState = localStorage.getItem('mkt_bingo_gamestate');
    if (savedParticipants) {
        try {
            participants = JSON.parse(savedParticipants);
        } catch (_) { participants = []; }
    }
    if (savedCurrentParticipant) {
        try {
            currentParticipant = JSON.parse(savedCurrentParticipant);
            const updatedParticipant = participants.find(p => p.id === (currentParticipant && currentParticipant.id));
            if (updatedParticipant) currentParticipant = updatedParticipant;
            if (currentParticipant) {
                document.getElementById('registeredName').textContent = currentParticipant.name || '';
                if (currentParticipant.card) {
                    showPlayerCard();
                } else {
                    document.getElementById('registration-section').classList.add('hidden');
                    document.getElementById('waiting-section').classList.remove('hidden');
                }
            }
        } catch (_) { currentParticipant = null; }
    }
    if (savedGameState) {
        try {
            gameState = JSON.parse(savedGameState);
            if (gameState.calledTerms && gameState.calledTerms.length > 0) {
                const calledContainer = document.getElementById('calledTermsList');
                calledContainer.innerHTML = '';
                gameState.calledTerms.forEach(term => {
                    const termDiv = document.createElement('div');
                    termDiv.className = 'called-term';
                    termDiv.textContent = term;
                    calledContainer.appendChild(termDiv);
                });
                if (gameState.started) {
                    document.getElementById('currentTerm').textContent = '🎮 Juego en progreso - Continúa cantando términos';
                }
            }
        } catch (_) {
            gameState = { started: false, terms: [], calledTerms: [], currentIndex: 0 };
        }
    }
    updateGameStats();
    updateParticipantsList();
});


