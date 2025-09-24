// Web3 Marketing Terms
const WEB3_MARKETING_TERMS = [
    "NFT", "DeFi", "DAO", "Smart Contract", "Blockchain", "Token", "Metaverso", "Web3",
    "Cripto", "Wallet", "Mining", "Staking", "Yield", "Liquidity", "DEX", "CEX",
    "Community Building", "Faucet", "Whitelist", "Ethereum", "Creator Economy",
    "Social Tokens", "Fan Tokens", "Loyalty Rewards", "Gaming", "Play-to-Earn",
    "Swap", "Creator Coins", "Build", "Virtual Events", "Growth Marketing",
    "P2P", "Bridge", "Cold Wallet", "Protocol Incentives", "Governance Tokens",
    "Tokenomics", "Airdrop Campaign", "Retroactive Rewards", "Farming", "LFG",
    "Utility NFTs", "Gas", "Roadmap", "Mint Strategy", "Reveal Marketing", "Floor Price",
    "Privacidad", "Collection Launch", "Exclusive Access", "Holder Benefits", "Secondary Sales",
    "Discord Channels", "X Spaces", "Telegram Voice", "Ambassador Program", "Referral Program",
    "Content Creation", "Meme", "IA", "KOL Marketing", "Community Rewards",
    "Layer 1", "Layer 2", "Cross-chain", "Interoperability", "Scalability", "DApps",
    "Smart Contract Audit", "Security Tokens", "Compliance", "KYC", "Regulatory Framework",
    "Market Making", "Hash", "Order Book", "Slippage", "Impermanent Loss", "APR", "APY", "TVL",
    "Volumen", "Market Cap", "POAP", "Circulating Supply", "Token Distribution",
    "HODL", "FOMO", "FUD", "Comunidad", "Bitcoin", "Whale", "Nodos", "Descentralización",
    "Bull Market", "Bear Market", "ATH", "Tecnología", "Pump", "Dump", "Moon", "Rekt"
];

// Global State
let participants = [];
let currentParticipant = null;
let gameState = { started: false, terms: [], calledTerms: [], currentIndex: 0 };

// Room Management
let roomId = null;
let isModerator = false;
let roomParticipants = [];

// Generate unique ID
function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Generate room code
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Mode Switching
function switchMode(event, mode) {
    // Only allow mode switching for moderators
    if (!isModerator && roomId) {
        showMobileAlert('⚠️ Solo el moderador puede cambiar de modo');
        return;
    }
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    document.getElementById('participant-mode').classList.toggle('hidden', mode !== 'participant');
    document.getElementById('moderator-mode').classList.toggle('hidden', mode !== 'moderator');
    document.getElementById('share-section').classList.toggle('hidden', mode !== 'moderator');
    
    if (mode === 'moderator') {
        isModerator = true;
        updateParticipantsList();
        if (!roomId) {
            document.getElementById('generateRoomBtn').classList.remove('hidden');
        }
    } else {
        isModerator = false;
    }
}

// Room Management Functions
function generateRoom() {
    roomId = generateRoomCode();
    isModerator = true; // Creator is always moderator
    
    const shareUrl = window.location.origin + window.location.pathname + '?room=' + roomId;
    
    document.getElementById('roomCode').textContent = roomId;
    document.getElementById('shareLink').value = shareUrl;
    document.getElementById('roomInfo').classList.remove('hidden');
    document.getElementById('generateRoomBtn').classList.add('hidden');
    document.getElementById('shareBtn').classList.remove('hidden');
    
    // Save room info with moderator flag
    localStorage.setItem('mkt_bingo_room', JSON.stringify({
        id: roomId,
        url: shareUrl,
        created: new Date(),
        moderator: true
    }));
    
    // Initialize room participants storage
    localStorage.setItem('mkt_bingo_room_' + roomId, JSON.stringify({
        id: roomId,
        participants: [],
        lastUpdated: new Date()
    }));
    
    // Ensure moderator controls are visible
    showModeratorControls();
    
    showMobileAlert('🎮 Sala creada: ' + roomId + ' (Eres el moderador)');
}

function shareGame() {
    const shareUrl = document.getElementById('shareLink').value;
    
    if (navigator.share) {
        navigator.share({
            title: 'Bingo Web3 - MKT Community',
            text: '¡Únete a mi juego de Bingo Web3! Código: ' + roomId,
            url: shareUrl
        }).catch(err => console.log('Error sharing:', err));
    } else {
        copyShareLink();
    }
}

function copyRoomCode() {
    const roomCode = document.getElementById('roomCode').textContent;
    navigator.clipboard.writeText(roomCode).then(() => {
        showMobileAlert('📋 Código copiado: ' + roomCode);
    }).catch(() => {
        showMobileAlert('❌ No se pudo copiar el código');
    });
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showMobileAlert('📋 Enlace copiado al portapapeles');
    } catch (err) {
        navigator.clipboard.writeText(shareLink.value).then(() => {
            showMobileAlert('📋 Enlace copiado');
        }).catch(() => {
            showMobileAlert('❌ No se pudo copiar el enlace');
        });
    }
}

function generateQRCode(text) {
    // QR Code functionality removed - using simple link sharing instead
    return;
}

function joinRoom(roomCode) {
    if (!roomCode) return false;
    
    roomId = roomCode;
    isModerator = false;
    
    // Hide moderator controls for participants
    hideModeratorControls();
    
    // Load room participants
    loadRoomParticipants();
    
    showMobileAlert('🎮 Te uniste a la sala: ' + roomCode);
    return true;
}

function hideModeratorControls() {
    // Hide mode selector for participants
    const modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        modeSelector.style.display = 'none';
    }
    
    // Hide share section for participants
    const shareSection = document.getElementById('share-section');
    if (shareSection) {
        shareSection.style.display = 'none';
    }
    
    // Force participant mode
    document.getElementById('participant-mode').classList.remove('hidden');
    document.getElementById('moderator-mode').classList.add('hidden');
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.mode-btn[onclick*="participant"]').classList.add('active');
    
    // Show participant status
    showRoomStatus('participant', '👤 Participante en sala: ' + roomId);
}

function showModeratorControls() {
    // Show mode selector for moderators
    const modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
    }
    
    // Show share section for moderators
    const shareSection = document.getElementById('share-section');
    if (shareSection) {
        shareSection.style.display = 'block';
    }
    
    // Show moderator status
    showRoomStatus('moderator', '🎯 Moderador de sala: ' + roomId);
}

function showRoomStatus(type, text) {
    const roomStatus = document.getElementById('room-status');
    const roomStatusText = document.getElementById('room-status-text');
    
    if (roomStatus && roomStatusText) {
        roomStatus.classList.remove('hidden', 'moderator', 'participant');
        roomStatus.classList.add(type);
        roomStatusText.textContent = text;
    }
}

function loadRoomParticipants() {
    if (!roomId) return;
    
    const savedRoom = localStorage.getItem('mkt_bingo_room_' + roomId);
    if (savedRoom) {
        try {
            const roomData = JSON.parse(savedRoom);
            roomParticipants = roomData.participants || [];
            
            // If this is the moderator, update the participants list
            if (isModerator) {
                participants = [...roomParticipants];
                updateParticipantsList();
            }
        } catch (e) {
            console.error('Error loading room participants:', e);
        }
    }
}

function saveRoomParticipants() {
    if (!roomId) return;
    
    const roomData = {
        id: roomId,
        participants: participants,
        lastUpdated: new Date()
    };
    
    localStorage.setItem('mkt_bingo_room_' + roomId, JSON.stringify(roomData));
    
    // Trigger update for all participants in the room
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'mkt_bingo_room_' + roomId,
        newValue: JSON.stringify(roomData)
    }));
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
        registered: new Date(),
        roomId: roomId
    };
    participants.push(participant);
    currentParticipant = participant;
    document.getElementById('registeredName').textContent = name;
    document.getElementById('registration-section').classList.add('hidden');
    document.getElementById('waiting-section').classList.remove('hidden');
    
    // Save to storage and sync with room
    saveToStorage();
    if (roomId) {
        // Add participant to room
        addParticipantToRoom(participant);
        // Notify moderator
        notifyModerator('new_participant', participant);
    }
}

function addParticipantToRoom(participant) {
    if (!roomId) return;
    
    // Get current room data
    const roomData = JSON.parse(localStorage.getItem('mkt_bingo_room_' + roomId) || '{"participants": []}');
    
    // Add new participant
    roomData.participants = roomData.participants || [];
    roomData.participants.push(participant);
    roomData.lastUpdated = new Date();
    
    // Save updated room data
    localStorage.setItem('mkt_bingo_room_' + roomId, JSON.stringify(roomData));
    
    // Trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'mkt_bingo_room_' + roomId,
        newValue: JSON.stringify(roomData)
    }));
}

// Fisher-Yates shuffle
function shuffle(array) {
    const shuffled = array.slice();
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
    saveToStorage();
    updateParticipantsList();
    if (currentParticipant) {
        const updatedParticipant = participants.find(p => p.id === currentParticipant.id);
        if (updatedParticipant && updatedParticipant.card) {
            currentParticipant = updatedParticipant;
            saveToStorage();
            showPlayerCard();
        }
    }
    showMobileAlert('✅ Se asignaron cartillas a ' + participants.length + ' participantes');
}

// Show player's card using DOM API
function showPlayerCard() {
    if (!currentParticipant || !currentParticipant.card) return;
    document.getElementById('waiting-section').classList.add('hidden');
    document.getElementById('playing-section').classList.remove('hidden');
    
    const cardContainer = document.getElementById('playerCard');
    cardContainer.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.textContent = currentParticipant.name;
    cardContainer.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'bingo-grid';
    
    currentParticipant.card.forEach((term) => {
        const cell = document.createElement('button');
        cell.className = 'bingo-cell';
        cell.setAttribute('data-term', term);
        cell.setAttribute('title', term);
        
        if (term === 'FREE') {
            cell.classList.add('free');
            cell.disabled = true;
            cell.textContent = 'FREE';
        } else {
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

// Update participants list using DOM API
function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    const countSpan = document.getElementById('participantCount');
    countSpan.textContent = participants.length;
    
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
        
        const leftDiv = document.createElement('div');
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'participant-name';
        nameDiv.textContent = participant.name;
        leftDiv.appendChild(nameDiv);
        
        const timeSmall = document.createElement('small');
        timeSmall.style.color = '#7f8c8d';
        timeSmall.textContent = 'Registrado: ' + new Date(participant.registered).toLocaleTimeString();
        leftDiv.appendChild(timeSmall);
        
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
    document.getElementById('currentTerm').innerHTML = '🎯 "' + nextTerm + '"';
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
    showMobileAlert('¡' + playerName + ' ha cantado BINGO! 🎉');
    createCelebrationEffect();
}

// Create celebration effect
function createCelebrationEffect() {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = 'position: fixed; top: -10px; left: ' + (Math.random() * 100) + '%; width: 10px; height: 10px; background: ' + colors[Math.floor(Math.random() * colors.length)] + '; border-radius: 50%; animation: fall 3s linear forwards; z-index: 1000; pointer-events: none;';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 100);
    }
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = '@keyframes fall { to { transform: translateY(100vh) rotate(360deg); } }';
        document.head.appendChild(style);
    }
}

// Storage functions
function saveToStorage() {
    localStorage.setItem('mkt_bingo_participants', JSON.stringify(participants));
    localStorage.setItem('mkt_current_participant', JSON.stringify(currentParticipant));
}

function loadFromStorage() {
    const savedParticipants = localStorage.getItem('mkt_bingo_participants');
    const savedCurrentParticipant = localStorage.getItem('mkt_current_participant');
    const savedGameState = localStorage.getItem('mkt_bingo_gamestate');
    
    if (savedParticipants) {
        try {
            participants = JSON.parse(savedParticipants);
        } catch (e) {
            participants = [];
        }
    }
    
    if (savedCurrentParticipant) {
        try {
            currentParticipant = JSON.parse(savedCurrentParticipant);
        } catch (e) {
            currentParticipant = null;
        }
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
        } catch (e) {
            gameState = { started: false, terms: [], calledTerms: [], currentIndex: 0 };
        }
    }
}

// Notification and Sync Functions
function notifyModerator(type, data) {
    if (!roomId) return;
    
    const notification = {
        type: type,
        data: data,
        timestamp: new Date(),
        roomId: roomId
    };
    
    // Store notification for moderator to see
    const notifications = JSON.parse(localStorage.getItem('mkt_bingo_notifications_' + roomId) || '[]');
    notifications.push(notification);
    localStorage.setItem('mkt_bingo_notifications_' + roomId, JSON.stringify(notifications));
    
    // Trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'mkt_bingo_notifications_' + roomId,
        newValue: JSON.stringify(notifications)
    }));
}

function checkForNotifications() {
    if (!roomId || !isModerator) return;
    
    const notifications = JSON.parse(localStorage.getItem('mkt_bingo_notifications_' + roomId) || '[]');
    const lastCheck = localStorage.getItem('mkt_bingo_last_check_' + roomId) || 0;
    
    notifications.forEach(notification => {
        if (new Date(notification.timestamp) > new Date(lastCheck)) {
            if (notification.type === 'new_participant') {
                showMobileAlert('👤 Nuevo participante: ' + notification.data.name);
                updateParticipantsList();
            }
        }
    });
    
    localStorage.setItem('mkt_bingo_last_check_' + roomId, new Date().toISOString());
}

function syncRoomData() {
    if (!roomId) return;
    
    // Check for updates every 1 second for better responsiveness
    setInterval(() => {
        if (isModerator) {
            checkForNotifications();
            loadRoomParticipants(); // Refresh participants list
        } else {
            // Participants check for room updates
            loadRoomParticipants();
        }
    }, 1000);
}

function checkURLForRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    
    if (roomCode) {
        // Check if this is the moderator (creator) of the room
        const savedRoom = localStorage.getItem('mkt_bingo_room');
        if (savedRoom) {
            try {
                const roomData = JSON.parse(savedRoom);
                if (roomData.id === roomCode && roomData.moderator) {
                    // This is the moderator, show full controls
                    isModerator = true;
                    roomId = roomCode;
                    showModeratorControls();
                    
                    // Restore room info
                    document.getElementById('roomCode').textContent = roomCode;
                    document.getElementById('shareLink').value = roomData.url;
                    document.getElementById('roomInfo').classList.remove('hidden');
                    document.getElementById('generateRoomBtn').classList.add('hidden');
                    document.getElementById('shareBtn').classList.remove('hidden');
                    
                    showMobileAlert('🎮 Sala cargada: ' + roomCode + ' (Eres el moderador)');
                    return;
                }
            } catch (e) {
                console.error('Error loading room data:', e);
            }
        }
        
        // This is a participant joining the room
        joinRoom(roomCode);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    checkURLForRoom();
    
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
    
    // Start room sync
    syncRoomData();
    
    // Listen for storage events for real-time sync
    window.addEventListener('storage', function(e) {
        if (e.key === 'mkt_bingo_room_' + roomId) {
            // Room participants updated
            loadRoomParticipants();
        } else if (e.key === 'mkt_bingo_notifications_' + roomId) {
            // New notification
            if (isModerator) {
                checkForNotifications();
            }
        }
    });
});
