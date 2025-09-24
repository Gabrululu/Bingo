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

// Storage configuration
const STORAGE_VERSION = 'v2';
const STORAGE_KEY = `mkt_bingo_${STORAGE_VERSION}`;

// Global State
let participants = [];
let currentParticipant = null;
let gameState = {
    started: false,
    terms: [],
    calledTerms: [],
    currentIndex: 0
};

// Storage management with versioning
function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { participants: [], current: null };
    
    try {
        const data = JSON.parse(raw);
        return {
            participants: data.participants || [],
            current: data.current || null
        };
    } catch (error) {
        console.warn('Error loading state, using defaults:', error);
        return { participants: [], current: null };
    }
}

function saveState() {
    const state = {
        participants: participants,
        current: currentParticipant,
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Migrate old storage format if needed
function migrateStorage() {
    const oldParticipants = localStorage.getItem('mkt_bingo_participants');
    const oldCurrent = localStorage.getItem('mkt_current_participant');
    
    if (oldParticipants || oldCurrent) {
        console.log('Migrating from old storage format...');
        
        if (oldParticipants) {
            try {
                const oldData = JSON.parse(oldParticipants);
                participants = oldData.map(p => ({
                    ...p,
                    id: p.id || uid() // Ensure all have proper IDs
                }));
            } catch (error) {
                console.warn('Error migrating participants:', error);
            }
        }
        
        if (oldCurrent) {
            try {
                currentParticipant = JSON.parse(oldCurrent);
                if (currentParticipant && !currentParticipant.id) {
                    currentParticipant.id = uid();
                }
            } catch (error) {
                console.warn('Error migrating current participant:', error);
            }
        }
        
        saveState();
        
        // Clean up old keys
        localStorage.removeItem('mkt_bingo_participants');
        localStorage.removeItem('mkt_current_participant');
        
        console.log('Migration completed');
    }
}

// Generate secure unique ID
function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

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
        id: uid(),
        name: name,
        card: null,
        registered: new Date()
    };
    participants.push(participant);
    currentParticipant = participant;
    document.getElementById('registeredName').textContent = name;
    document.getElementById('registration-section').classList.add('hidden');
    document.getElementById('waiting-section').classList.remove('hidden');
    saveState();
}

// Fisher-Yates shuffle algorithm (unbiased)
function shuffle(array) {
    const shuffled = array.slice(); // Create a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate unique bingo card
function generateUniqueCard() {
    const shuffled = shuffle(WEB3_MARKETING_TERMS);
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
    saveState();
    updateParticipantsList();
    if (currentParticipant) {
        const updatedParticipant = participants.find(p => p.id === currentParticipant.id);
        if (updatedParticipant && updatedParticipant.card) {
            currentParticipant = updatedParticipant;
            saveState();
            showPlayerCard();
        }
    }
    showMobileAlert(`✅ Se asignaron cartillas a ${participants.length} participantes`);
}

// Show player's card - Using DOM API for safety
function showPlayerCard() {
    if (!currentParticipant || !currentParticipant.card) return;
    document.getElementById('waiting-section').classList.add('hidden');
    document.getElementById('playing-section').classList.remove('hidden');
    
    const cardContainer = document.getElementById('playerCard');
    cardContainer.innerHTML = ''; // Clear first
    
    // Create card header
    const header = document.createElement('div');
    header.className = 'card-header';
    header.textContent = currentParticipant.name;
    cardContainer.appendChild(header);
    
    // Create bingo grid
    const grid = document.createElement('div');
    grid.className = 'bingo-grid';
    
    currentParticipant.card.forEach((term) => {
        const cell = document.createElement('button');
        cell.className = 'bingo-cell';
        cell.setAttribute('data-term', term);
        cell.setAttribute('title', term);
        
        // Handle FREE space
        if (term === 'FREE') {
            cell.classList.add('free');
            cell.disabled = true;
            cell.textContent = 'FREE';
        } else {
            // Optimize text for mobile display
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
            cell.textContent = displayTerm;
            cell.addEventListener('click', () => toggleCell(cell, term));
        }
        
        grid.appendChild(cell);
    });
    
    cardContainer.appendChild(grid);
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

// Toggle cell marking
function toggleCell(cell, term) {
    if (term === 'FREE') return;
    if (!gameState.calledTerms.includes(term)) {
        showMobileAlert('⚠️ Este término aún no ha sido cantado');
        return;
    }
    cell.classList.toggle('marked');
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    cell.style.transform = 'scale(0.9)';
    setTimeout(() => {
        cell.style.transform = '';
    }, 150);
}

// Mobile-friendly alert system
function showMobileAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'mobile-alert';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => { alertDiv.remove(); }, 2000);
}

// Update participants list - Using DOM API for safety
function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    const countSpan = document.getElementById('participantCount');
    countSpan.textContent = participants.length;
    
    // Clear container
    container.innerHTML = '';
    
    if (participants.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#7f8c8d';
        emptyMsg.textContent = 'No hay participantes registrados';
        container.appendChild(emptyMsg);
        return;
    }
    
    participants.forEach(participant => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        if (participant.card) {
            item.classList.add('assigned');
        }
        
        // Left side - name and time
        const leftDiv = document.createElement('div');
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'participant-name';
        nameDiv.textContent = participant.name;
        leftDiv.appendChild(nameDiv);
        
        const timeSmall = document.createElement('small');
        timeSmall.style.color = '#7f8c8d';
        timeSmall.textContent = 'Registrado: ' + new Date(participant.registered).toLocaleTimeString();
        leftDiv.appendChild(timeSmall);
        
        // Right side - status badge
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'participant-status-badge';
        if (participant.card) {
            badgeDiv.classList.add('status-assigned');
            badgeDiv.textContent = 'Cartilla Asignada';
        } else {
            badgeDiv.classList.add('status-waiting');
            badgeDiv.textContent = 'Esperando';
        }
        
        item.appendChild(leftDiv);
        item.appendChild(badgeDiv);
        container.appendChild(item);
    });
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
    gameState.terms = shuffle(WEB3_MARKETING_TERMS);
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
    document.getElementById('currentTerm').innerHTML = `🎯 "${nextTerm}"`;
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
    localStorage.removeItem(STORAGE_KEY);
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

// Create celebration effect
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
    // Migrate old storage first
    migrateStorage();
    
    // Load current state
    const state = loadState();
    participants = state.participants;
    currentParticipant = state.current;
    
    // Load game state
    const savedGameState = localStorage.getItem('mkt_bingo_gamestate');
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
    
    if (currentParticipant) {
        document.getElementById('registeredName').textContent = currentParticipant.name || '';
        if (currentParticipant.card) {
            showPlayerCard();
        } else {
            document.getElementById('registration-section').classList.add('hidden');
            document.getElementById('waiting-section').classList.remove('hidden');
        }
    }
    updateGameStats();
    updateParticipantsList();
});