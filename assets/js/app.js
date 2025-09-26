// Web3 Marketing Terms for Bingo
const WEB3_MARKETING_TERMS = [
    // Core Web3
    "NFT","DeFi","DAO","Smart Contract","Blockchain","Token","Metaverso","Web3","Cripto","Wallet","Mining","Staking","Yield","Liquidity","DEX","CEX",
    // Marketing Web3 Specific
    "Community Building","Token Gating","Whitelist Marketing","Influencer NFTs","Creator Economy","Social Tokens","Fan Tokens","Loyalty Rewards","Gamification","Play-to-Earn","Engagement Mining","Creator Coins","Branded NFTs","Virtual Events","Metaverse Marketing",
    // DeFi Marketing
    "Yield Farming","Liquidity Mining","Staking Rewards","Protocol Incentives","Governance Tokens","Tokenomics Design","Airdrop Campaign","Retroactive Rewards","Fee Sharing","Revenue Share",
    // NFT Marketing
    "Utility NFTs","PFP Project","Roadmap","Mint Strategy","Reveal Marketing","Floor Price","Trait Rarity","Collection Launch","Exclusive Access","Holder Benefits","Secondary Sales",
    // Community & Social
    "Discord Marketing","Twitter Spaces","Telegram Groups","Ambassador Program","Referral Program","Content Creation","Meme Marketing","Viral Campaigns","KOL Marketing","Community Rewards",
    // Technology Terms
    "Layer 1","Layer 2","Cross-chain","Interoperability","Scalability","Gas Optimization","Smart Contract Audit","Security Tokens","Compliance","KYC/AML","Regulatory Framework",
    // Trading & Finance
    "Market Making","AMM","Order Book","Slippage","Impermanent Loss","APR","APY","TVL","Volume","Market Cap","Fully Diluted Value","Circulating Supply","Token Distribution",
    // Trends & Culture
    "HODL","FOMO","FUD","Diamond Hands","Paper Hands","Whale","Retail Investor","Institutional","Bull Market","Bear Market","ATH","ATL","Pump","Dump","Moon","Rekt"
  ];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Global State
  let currentUser = null;
  let currentRoom = null;
  let participants = [];
  let gameState = { started: false, terms: [], calledTerms: [], currentIndex: 0 };
  let currentParticipant = null;
  let roomsListener = null;
  let participantsListener = null;
  let gameStateListener = null;
  
  // Garantiza una única sesión anónima por pestaña
  let anonSignInPromise = null;
  async function ensureAnonymous() {
    const auth = window.firebaseAuth;
    if (auth.currentUser) return auth.currentUser;
    if (!anonSignInPromise) {
      anonSignInPromise = window.firebaseSignInAnonymously(auth).then(() => auth.currentUser);
    }
    return anonSignInPromise;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utils
  function fisherYates(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Route Management
  function getCurrentRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#/play/')) return { type: 'play', roomId: hash.replace('#/play/','') };
    if (hash.startsWith('#/moderator/')) return { type: 'moderator-room', roomId: hash.replace('#/moderator/','') };
    if (hash === '#/moderator') return { type: 'moderator' };
    return { type: 'landing' };
  }
  function navigateTo(route) {
    if (route.type === 'play') window.location.hash = `#/play/${route.roomId}`;
    else if (route.type === 'moderator-room') window.location.hash = `#/moderator/${route.roomId}`;
    else if (route.type === 'moderator') window.location.hash = '#/moderator';
    else window.location.hash = '';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // UI Management
  function showSection(sectionId) {
    document.querySelectorAll('.moderator-section, .content, #landing-page').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId)?.classList.remove('hidden');
  }
  function hideModeratorUI() { document.querySelectorAll('#moderator-login, #moderator-dashboard').forEach(el => el.classList.add('hidden')); }
  function showModeratorLogin() { showSection('moderator-login'); }
  function showModeratorDashboard() { showSection('moderator-dashboard'); loadMyRooms(); }
  function showParticipantMode() { showSection('participant-mode'); hideModeratorUI(); }
  function showLandingPage() { showSection('landing-page'); hideModeratorUI(); }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Firebase Initialization (usa los globals inyectados por index.html)
  async function initializeFirebase() {
    try {
      while (!window.firebaseAuth) { await new Promise(r => setTimeout(r, 100)); }
      console.log('Firebase initialized');
      window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
        currentUser = user;
        console.log('Auth state changed:', user ? (user.isAnonymous ? 'Anon' : user.email) : 'No user');
        handleRouteChange(getCurrentRoute());
      });
    } catch (e) {
      console.error('Error initializing Firebase:', e);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Route Handling
  function handleRouteChange(route) {
    console.log('Handling route:', route);
    if (route.type === 'play') { showParticipantMode(); joinRoomAsParticipant(route.roomId); }
    else if (route.type === 'moderator-room') { (currentUser && !currentUser.isAnonymous) ? (showModeratorDashboard(), openRoomManagement(route.roomId)) : showModeratorLogin(); }
    else if (route.type === 'moderator') { (currentUser && !currentUser.isAnonymous) ? showModeratorDashboard() : showModeratorLogin(); }
    else { (currentUser && !currentUser.isAnonymous) ? showModeratorDashboard() : showLandingPage(); }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Authentication
  async function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await window.firebaseSignInWithEmailAndPassword(window.firebaseAuth, email, password);
      console.log('Login successful');
    } catch (e) {
      console.error('Login error:', e);
      alert('Error al iniciar sesión: ' + e.message);
    }
  }
  async function registerWithEmail() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    if (password !== confirmPassword) { alert('Las contraseñas no coinciden'); return; }
    try {
      await window.firebaseCreateUserWithEmailAndPassword(window.firebaseAuth, email, password);
      console.log('Registration successful');
    } catch (e) {
      console.error('Registration error:', e);
      alert('Error al registrarse: ' + e.message);
    }
  }
  async function logoutModerator() {
    try { await window.firebaseSignOut(window.firebaseAuth); console.log('Logout successful'); }
    catch (e) { console.error('Logout error:', e); }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Room Management
  async function createRoom() {
    if (!currentUser || currentUser.isAnonymous) { alert('Debes iniciar sesión para crear una sala'); return; }
    try {
      const roomData = {
        createdBy: currentUser.uid,
        moderators: [currentUser.uid],
        status: 'lobby',
        createdAt: window.firebaseServerTimestamp(),
        termsSeed: crypto.randomUUID(),
        shareUrl: ''
      };
      const roomRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'rooms'), roomData);
      const shareUrl = `${window.location.origin}${window.location.pathname}#/play/${roomRef.id}`;
      await window.firebaseUpdateDoc(roomRef, { shareUrl });
      console.log('Room created:', roomRef.id);
      navigateTo({ type: 'moderator-room', roomId: roomRef.id });
    } catch (e) {
      console.error('Error creating room:', e);
      alert('Error al crear la sala: ' + e.message);
    }
  }
  async function loadMyRooms() {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
      const roomsQuery = window.firebaseQuery(
        window.firebaseCollection(window.firebaseDb, 'rooms'),
        window.firebaseWhere('createdBy','==', currentUser.uid),
        window.firebaseOrderBy('createdAt','desc')
      );
      const qs = await window.firebaseGetDocs(roomsQuery);
      const rooms = [];
      qs.forEach(d => rooms.push({ id: d.id, ...d.data() }));
      displayMyRooms(rooms);
    } catch (e) {
      console.error('Error loading rooms:', e);
    }
  }
  function displayMyRooms(rooms) {
    const roomsList = document.getElementById('roomsList');
    if (rooms.length === 0) { roomsList.innerHTML = '<p class="no-rooms">No tienes salas creadas</p>'; return; }
    roomsList.innerHTML = rooms.map(room => `
      <div class="room-item">
        <div class="room-info">
          <h4>Sala ${room.id}</h4>
          <p>Estado: <span class="status-badge ${room.status}">${room.status}</span></p>
          <p>Creada: ${room.createdAt?.toDate ? new Date(room.createdAt.toDate()).toLocaleString() : '—'}</p>
        </div>
        <div class="room-actions">
          <button class="btn btn-small" onclick="openRoomManagement('${room.id}')">Abrir</button>
          <button class="btn btn-small danger" onclick="deleteRoom('${room.id}')">Eliminar</button>
        </div>
      </div>
    `).join('');
  }
  async function openRoomManagement(roomId) {
    currentRoom = roomId;
    document.getElementById('currentRoomCode').textContent = roomId;
    document.getElementById('my-rooms-section').classList.add('hidden');
    document.getElementById('room-management').classList.remove('hidden');
    const shareUrl = `${window.location.origin}${window.location.pathname}#/play/${roomId}`;
    document.getElementById('shareLink').value = shareUrl;
    setupRoomListeners(roomId);
  }
  function setupRoomListeners(roomId) {
    if (participantsListener) participantsListener();
    if (gameStateListener) gameStateListener();
    const participantsRef = window.firebaseCollection(window.firebaseDb, `rooms/${roomId}/participants`);
    participantsListener = window.firebaseOnSnapshot(participantsRef, (snap) => {
      participants = [];
      snap.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));
      updateParticipantsList();
    });
    const gameStateRef = window.firebaseDoc(window.firebaseDb, `rooms/${roomId}/state/current`);
    gameStateListener = window.firebaseOnSnapshot(gameStateRef, (snap) => {
      if (snap.exists()) { gameState = snap.data(); updateGameDisplay(); }
    });
  }
  function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    const countSpan = document.getElementById('participantCount');
    countSpan.textContent = participants.length;
    if (participants.length === 0) { container.innerHTML = '<p class="no-participants">No hay participantes registrados</p>'; return; }
    container.innerHTML = participants.map(p => `
      <div class="participant-item">
        <span class="participant-name">${p.name ?? '—'}</span>
        <span class="participant-status ${p.status}">${p.status}</span>
      </div>
    `).join('');
  }
  function updateGameDisplay() {
    document.getElementById('currentTerm').textContent = gameState.started
      ? (gameState.calledTerms.length ? `🎯 "${gameState.calledTerms.at(-1)}"` : '🎮 Juego iniciado')
      : 'Registra participantes y asigna cartillas para comenzar';
    document.getElementById('termsCalledCount').textContent = gameState.calledTerms.length;
    document.getElementById('termsRemainingCount').textContent = WEB3_MARKETING_TERMS.length - gameState.calledTerms.length;
    document.getElementById('calledTermsList').innerHTML = gameState.calledTerms.map(t => `<div class="called-term">${t}</div>`).join('');
  }
  async function deleteRoom(roomId) {
    if (!confirm('¿Estás seguro de eliminar esta sala? Esta acción no se puede deshacer.')) return;
    try {
      await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseDb, `rooms/${roomId}`));
      if (participantsListener) participantsListener();
      if (gameStateListener) gameStateListener();
      console.log('Room deleted:', roomId);
      document.getElementById('room-management').classList.add('hidden');
      document.getElementById('my-rooms-section').classList.remove('hidden');
      loadMyRooms();
    } catch (e) {
      console.error('Error deleting room:', e);
      alert('Error al eliminar la sala: ' + e.message);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Participant Functions
  async function joinRoomAsParticipant(roomId) {
    try {
      // Garantiza auth anónima con UID estable
      currentUser = await ensureAnonymous();
      if (!currentUser) throw new Error('AUTH_NOT_READY');
  
      const participantRef = window.firebaseDoc(window.firebaseDb, `rooms/${roomId}/participants/${currentUser.uid}`);
      const participantSnap = await window.firebaseGetDoc(participantRef);
  
      if (participantSnap.exists()) {
        const data = participantSnap.data();
        currentParticipant = { id: currentUser.uid, ...data };
        document.getElementById('registeredName').textContent = data.name ?? '';
        if (data.cardId) {
          showPlayerCard();
        } else {
          document.getElementById('registration-section').classList.add('hidden');
          document.getElementById('waiting-section').classList.remove('hidden');
        }
      } else {
        // mostrar form de registro
        document.getElementById('registration-section').classList.remove('hidden');
        document.getElementById('waiting-section').classList.add('hidden');
        document.getElementById('playing-section').classList.add('hidden');
      }
    } catch (e) {
      console.error('Error joining room:', e);
    }
  }
  
  async function registerParticipant() {
    const rawName = document.getElementById('participantName').value;
    const route = getCurrentRoute();
    if (route.type !== 'play') { alert('No estás en una sala válida'); return; }
  
    try {
      const auth = window.firebaseAuth;
      const db = window.firebaseDb;

      // UID congelado: una sola sesión anónima
      const user = await ensureAnonymous();
      const uid = user.uid;
  
      const name = (rawName ?? "").trim().slice(0, 40);
      if (!name) { alert('El nombre no puede estar vacío'); return; }
  
      const pRef = window.firebaseDoc(db, `rooms/${route.roomId}/participants/${uid}`);
      const snap = await window.firebaseGetDoc(pRef);
  
      console.log("JOIN ->", { path: `rooms/${route.roomId}/participants/${uid}`, payload: { uid, name, status: "waiting", cardId: null } });
  
      if (!snap.exists()) {
        await window.firebaseSetDoc(pRef, {
          uid, name,
          joinedAt: window.firebaseServerTimestamp(),
          status: "waiting",
          cardId: null
        }, { merge: false });
      } else {
        const data = snap.data();
        if (data.cardId != null) {
          currentParticipant = { id: uid, ...data };
          document.getElementById('registeredName').textContent = data.name ?? '';
          document.getElementById('registration-section').classList.add('hidden');
          if (data.cardId) { showPlayerCard(); } else { document.getElementById('waiting-section').classList.remove('hidden'); }
          return;
        }
        await window.firebaseUpdateDoc(pRef, {
          name,
          joinedAt: window.firebaseServerTimestamp(),
          status: "waiting"
        });
      }
  
      currentParticipant = { id: uid, name, status: "waiting", cardId: null };
      document.getElementById('registeredName').textContent = name;
      document.getElementById('registration-section').classList.add('hidden');
      document.getElementById('waiting-section').classList.remove('hidden');
      console.log('Participant registered successfully:', name);
  
    } catch (e) {
      console.error('JOIN_FAIL', { roomId: route.roomId, uid: currentUser?.uid, err: e });
      alert(`No pudimos registrarte: ${e.code || e.message}`);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Game Management
  async function assignCards() {
    if (!currentRoom || participants.length === 0) { alert('No hay participantes registrados'); return; }
    try {
      for (const participant of participants) {
        if (!participant.cardId) {
          const card = generateUniqueCard();
          const cardData = { participantId: participant.id, cells: card, createdAt: window.firebaseServerTimestamp() };
          const cardRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, `rooms/${currentRoom}/cards`), cardData);
          await window.firebaseUpdateDoc(window.firebaseDoc(window.firebaseDb, `rooms/${currentRoom}/participants/${participant.id}`), { cardId: cardRef.id, status: 'assigned' });
        }
      }
      alert(`✅ Se asignaron cartillas a ${participants.length} participantes`);
    } catch (e) {
      console.error('Error assigning cards:', e);
      alert('Error al asignar cartillas: ' + e.message);
    }
  }
  function generateUniqueCard() {
    const shuffled = fisherYates(WEB3_MARKETING_TERMS);
    const cardTerms = shuffled.slice(0, 24);
    cardTerms.splice(12, 0, 'FREE');
    return cardTerms;
  }
  async function startGame() {
    if (!currentRoom || participants.length === 0) { alert('No hay participantes registrados'); return; }
    try {
      const gameData = { started: true, terms: fisherYates(WEB3_MARKETING_TERMS), calledTerms: [], currentIndex: 0, startedAt: window.firebaseServerTimestamp() };
      await window.firebaseSetDoc(window.firebaseDoc(window.firebaseDb, `rooms/${currentRoom}/state/current`), gameData);
      await window.firebaseUpdateDoc(window.firebaseDoc(window.firebaseDb, `rooms/${currentRoom}`), { status: 'live' });
      console.log('Game started');
    } catch (e) {
      console.error('Error starting game:', e);
      alert('Error al iniciar el juego: ' + e.message);
    }
  }
  async function callNextTerm() {
    if (!currentRoom || !gameState.started) { alert('Primero inicia el juego'); return; }
    if (gameState.currentIndex >= gameState.terms.length) { alert('Todos los términos han sido cantados'); return; }
    try {
      const nextTerm = gameState.terms[gameState.currentIndex];
      const updatedCalledTerms = [...gameState.calledTerms, nextTerm];
      const updatedIndex = gameState.currentIndex + 1;
      await window.firebaseUpdateDoc(window.firebaseDoc(window.firebaseDb, `rooms/${currentRoom}/state/current`), { calledTerms: updatedCalledTerms, currentIndex: updatedIndex });
      console.log('Term called:', nextTerm);
    } catch (e) {
      console.error('Error calling next term:', e);
      alert('Error al llamar el siguiente término: ' + e.message);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Participant Card Display
  function showPlayerCard() {
    if (!currentParticipant || !currentParticipant.cardId) return;
    const cardRef = window.firebaseDoc(window.firebaseDb, `rooms/${getCurrentRoute().roomId}/cards/${currentParticipant.cardId}`);
    window.firebaseGetDoc(cardRef).then((snap) => {
      if (snap.exists()) displayPlayerCard(snap.data().cells);
    });
  }
  function displayPlayerCard(cardTerms) {
    document.getElementById('waiting-section').classList.add('hidden');
    document.getElementById('playing-section').classList.remove('hidden');
    const cardContainer = document.getElementById('playerCard');
    cardContainer.innerHTML = `
      <div class="card-header"><h3>${currentParticipant.name ?? ''}</h3></div>
      <div class="card-grid">
        ${cardTerms.map(term => `
          <div class="card-cell" onclick="toggleCell(this, '${term.replace(/'/g,"\\'")}')">${term}</div>
        `).join('')}
      </div>
    `;
  }
  function toggleCell(cell, term) {
    if (term === 'FREE') return;
    if (!gameState.calledTerms.includes(term)) { alert('⚠️ Este término aún no ha sido cantado'); return; }
    cell.classList.toggle('marked');
    if (navigator.vibrate) navigator.vibrate(50);
  }
  function claimBingo() {
    if (!currentParticipant) return;
    alert(`¡${currentParticipant.name ?? 'Jugador'} ha cantado BINGO! 🎉`);
    createCelebrationEffect();
  }
  function createCelebrationEffect() {
    const colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff'];
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const c = document.createElement('div');
        c.style.cssText = `position:fixed;top:-10px;left:${Math.random()*100}%;width:10px;height:10px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:50%;animation:fall 3s linear forwards;z-index:1000;pointer-events:none;`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
      }, i*100);
    }
    if (!document.getElementById('confetti-style')) {
      const s = document.createElement('style'); s.id='confetti-style'; s.textContent='@keyframes fall{to{transform:translateY(100vh) rotate(360deg)}}'; document.head.appendChild(s);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // UI Event Handlers
  function openModeratorLogin() { navigateTo({ type: 'moderator' }); }
  function backToRooms() {
    document.getElementById('room-management').classList.add('hidden');
    document.getElementById('my-rooms-section').classList.remove('hidden');
    if (participantsListener) participantsListener();
    if (gameStateListener) gameStateListener();
    currentRoom = null;
  }
  function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    alert('Enlace copiado al portapapeles');
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Initialize App
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('App starting...');
    await initializeFirebase();
  
    document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); loginWithEmail(); });
    document.getElementById('registerForm').addEventListener('submit', (e) => { e.preventDefault(); registerWithEmail(); });
    document.getElementById('showRegister').addEventListener('click', () => { document.getElementById('loginForm').classList.add('hidden'); document.getElementById('registerForm').classList.remove('hidden'); });
    document.getElementById('showLogin').addEventListener('click', () => { document.getElementById('registerForm').classList.add('hidden'); document.getElementById('loginForm').classList.remove('hidden'); });
  
    document.getElementById('logoutBtn').addEventListener('click', logoutModerator);
    document.getElementById('createRoomBtn').addEventListener('click', createRoom);
    document.getElementById('refreshRoomsBtn').addEventListener('click', loadMyRooms);
    document.getElementById('backToRoomsBtn').addEventListener('click', backToRooms);
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);
    document.getElementById('assignCardsBtn').addEventListener('click', assignCards);
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('nextTermBtn').addEventListener('click', callNextTerm);
    document.getElementById('deleteRoomBtn').addEventListener('click', () => deleteRoom(currentRoom));
  
    window.addEventListener('hashchange', () => handleRouteChange(getCurrentRoute()));
    handleRouteChange(getCurrentRoute());
    console.log('App initialized');
  });
  