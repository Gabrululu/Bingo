// Web3 Marketing Terms for Bingo
const WEB3_MARKETING_TERMS = [
    // Core Web3
    "NFT","DeFi","DAO","Smart Contract","Blockchain","Token","Metaverso","Web3","Cripto","Wallet","Minar","Staking","Yield","Nodo","DEX","CEX",
    // Marketing Web3 Specific
    "Community Building","Grown Marketing","Storytelling","Influencer","Creator Economy","Branding","Fan Tokens","Funnel","Gaming","Play-to-Earn","Engagement","Creator Coins","Trending","Virtual Events","Comunidad",
    // DeFi Marketing
    "Lending","Liquidez","Whitelist","Protocol Incentives","Governance Tokens","Tokenomics","Airdrop Campaign","Security","Fee","Revenue",
    // NFT Marketing
    "Utility NFTs","PFP","Roadmap","Metadatos","Marketplace","Floor Price","DApps","Blue Chip","Exclusive Access","Holder","CC0",
    // Community & Social
    "Discord","X Spaces","Telegram Voice","Ambassador","Referral Program","Content Creation","Meme","Viral Campaigns","KOL","Identidad Digital",
    // Technology Terms
    "Layer 1","Layer 2","Cross-chain","Interoperability","Scalability","Immutable","Smart Contract Audit","Security Tokens","Compliance","KYC","Oracle",
    // Trading & Finance
    "Swaps","Bridge","Order Book","Slippage","Impermanent Loss","APR","APY","TVL","Volumen","Market Cap","Spread","Circulating Supply","Scalping",
    // Trends & Culture
    "HODL","FOMO","FUD","DYOR","GM","Whale","Rug Pull","Fork","Bull Market","Bear Market","ATH","OG","Pump","Dump","To The Moon","Rekt"
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
let calledTermsSet = new Set();
let _unsubParticipantState = null;
  
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
  
// Normaliza términos para comparar de forma robusta
function normTerm(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
    if (route.type === 'play' && currentParticipant?.name) {
      setParticipantView(currentParticipant.cardId ? 'playing' : 'waiting', { name: currentParticipant.name });
    }
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
    if (participantsListener) participantsListener();
    const participantsRef = window.firebaseCollection(window.firebaseDb, `rooms/${roomId}/participants`);
    participantsListener = window.firebaseOnSnapshot(participantsRef, (snap) => {
      participants = [];
      snap.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));
      updateParticipantsList();
    });
    subscribeRoomState(roomId);
  }
function subscribeRoomState(roomId){
  if (gameStateListener) gameStateListener();
  const ref = window.firebaseDoc(window.firebaseDb, `rooms/${roomId}/state/current`);
  gameStateListener = window.firebaseOnSnapshot(ref, (snap)=>{
    if (!snap.exists()) return;
    gameState = snap.data();

    calledTermsSet = new Set((gameState.calledTerms ?? []).map(normTerm));

    const isModeratorUI = !!document.getElementById('calledTermsList');
    if (isModeratorUI) updateGameDisplay();
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
  calledTermsSet = new Set((gameState?.calledTerms ?? []).map(normTerm));
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Participant View State Helper
  function setParticipantView(state, data = {}) {
    const form = document.getElementById('registration-section');
    const waiting = document.getElementById('waiting-section');
    const playing = document.getElementById('playing-section');
    const banner = document.querySelector('.player-banner');
    const tip = document.querySelector('.player-tip');
    const cta = document.querySelector('.player-cta');

    form?.classList.add('hidden');
    waiting?.classList.add('hidden');
    playing?.classList.add('hidden');

    if (state === 'form') {
      form?.classList.remove('hidden');
      waiting?.classList.add('hidden');
      playing?.classList.add('hidden');
    } else if (state === 'waiting') {
      waiting?.classList.remove('hidden');
      if (data.name) {
        const rn = document.getElementById('registeredName');
        if (rn) rn.textContent = data.name;
      }
    } else if (state === 'playing') {
      playing?.classList.remove('hidden');
      banner?.classList?.remove('hidden');
      tip?.classList?.remove('hidden');
      cta?.classList?.remove('hidden');
    }
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
      // 1) Garantiza sesión anónima única
      currentUser = await ensureAnonymous();
      if (!currentUser) throw new Error('AUTH_NOT_READY');

      // 2) Suscripción del PARTICIPANTE al estado del juego
      if (_unsubParticipantState) { _unsubParticipantState(); _unsubParticipantState = null; }
      const gsRef = window.firebaseDoc(window.firebaseDb, `rooms/${roomId}/state/current`);
      _unsubParticipantState = window.firebaseOnSnapshot(gsRef, (snap) => {
        if (snap.exists()) {
          gameState = snap.data();          
          calledTermsSet = new Set((gameState.calledTerms ?? []).map(normTerm));
        } else {
          calledTermsSet = new Set();
        }
      });

      // 3) Lee/crea el documento del participante y ajusta la vista
      const pRef = window.firebaseDoc(window.firebaseDb, `rooms/${roomId}/participants/${currentUser.uid}`);
      const snap = await window.firebaseGetDoc(pRef);

      if (snap.exists()) {
        const data = snap.data();
        currentParticipant = { id: currentUser.uid, ...data };
        if (data.cardId) {
          setParticipantView('playing', { name: data.name });
          showPlayerCard();
        } else {
          setParticipantView('waiting', { name: data.name });
        }
      } else {
        setParticipantView('form');
      }
      subscribeRoomState(roomId);
    } catch (e) {
      console.error('Error joining room:', e);
      setParticipantView('form');
    }
  }
  
  async function registerParticipant() {
    const registerBtn = document.querySelector('.register-btn');
    if (registerBtn) registerBtn.disabled = true;

    const rawName = document.getElementById('participantName').value;
    const route = getCurrentRoute();
    if (route.type !== 'play') { alert('No estás en una sala válida'); return; }

    try {
      const auth = window.firebaseAuth;
      const db = window.firebaseDb;

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
      setParticipantView('waiting', { name });
      console.log('Participant registered successfully:', name);

    } catch (e) {
      console.error('JOIN_FAIL', { roomId: route.roomId, uid: currentUser?.uid, err: e });
      alert(`No pudimos registrarte: ${e.code || e.message}`);
    } finally {
      if (registerBtn) registerBtn.disabled = false;
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
    try {
    const terms = gameState.terms ?? [];
    let idx = gameState.currentIndex ?? 0;
    while (idx < terms.length && calledTermsSet.has(normTerm(terms[idx]))) { idx++; }
    if (idx >= terms.length) { alert('Todos los términos han sido mostrados'); return; }
    const nextTerm = terms[idx];
    const updatedCalledTerms = [...(gameState.calledTerms ?? []), nextTerm];
    await window.firebaseUpdateDoc(
      window.firebaseDoc(window.firebaseDb, `rooms/${currentRoom}/state/current`),
      { calledTerms: updatedCalledTerms, currentIndex: idx + 1 }
    );
      console.log('Term called:', nextTerm);
    } catch (e) {
      console.error('Error calling next term:', e);
      alert('Error al mostrar el siguiente término: ' + e.message);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Participant Card Display
  function fitCellText(el, { min = 9, max = 16 } = {}) {
    const parent = el.parentElement;
    const text = el.textContent;
    
    // Si tiene guión, intentar mantener en una línea
    if (text.includes('-')) {
      el.style.whiteSpace = 'nowrap';
      el.style.fontSize = max + 'px';
      
      let size = max;
      while (size > min && el.scrollWidth > parent.clientWidth - 16) {
        size -= 0.5;
        el.style.fontSize = size + 'px';
      }
      
      // Si no cabe, permitir wrap
      if (size <= min) {
        el.style.whiteSpace = 'normal';
        el.style.fontSize = min + 'px';
      }
    } else {
      // Texto normal
      el.style.whiteSpace = 'normal';
      el.style.fontSize = max + 'px';
      
      let size = max;
      while (size > min && el.scrollHeight > parent.clientHeight - 16) {
        size -= 0.5;
        el.style.fontSize = size + 'px';
      }
    }
  }

  function fitAllCardTexts() {
    document.querySelectorAll('#playerCard .cell-text').forEach((el) => fitCellText(el));
  }

  let playerCardRO;
  function observePlayerCardResize() {
    const grid = document.getElementById('playerCard');
    if (!grid) return;
    if (playerCardRO) playerCardRO.disconnect();
    playerCardRO = new ResizeObserver(() => fitAllCardTexts());
    playerCardRO.observe(grid);
  }
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
  const grid = document.getElementById('playerCard');
  grid.innerHTML = cardTerms.map(term => {
    const isFree = term === 'FREE';
    const singleWord = !/\s/.test(String(term));
    const safeText = String(term).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const dataAttr = String(term).replace(/"/g,'&quot;');
    return `
      <button
        class="card-cell${isFree ? ' cell-free' : ''}"
        data-term="${dataAttr}"
        ${isFree ? 'disabled' : ''}
        onclick="toggleCell(this)"
        aria-pressed="false"
        role="gridcell"
        title="${safeText}"
      >
        <span class="cell-text${singleWord ? ' no-wrap' : ''}">${safeText}</span>
      </button>
    `;
  }).join('');
  requestAnimationFrame(() => {
    fitAllCardTexts();
    observePlayerCardResize();
  });
  
  checkBingoStatus();
}
  function toggleCell(cell) {
    const term = cell.dataset.term || '';
    if (term === 'FREE') return;
    if (!calledTermsSet.has(normTerm(term))) {
      alert('⚠️ Este término aún no ha sido mostrado');
      return;
    }
    cell.classList.toggle('marked');
    cell.setAttribute('aria-pressed', cell.classList.contains('marked') ? 'true' : 'false');
    if (navigator.vibrate) navigator.vibrate(40);
    
    checkBingoStatus();
  }
  function claimBingo() {
    if (!currentParticipant) return;
    
    if (!checkBingoStatus()) {
      alert('⚠️ No tienes una línea completa para cantar BINGO');
      return;
    }
    
    alert(`¡${currentParticipant.name ?? 'Jugador'} hizo BINGO! 🎉`);
    createCelebrationEffect();
  }
  function checkBingoStatus() {
    const cells = document.querySelectorAll('#playerCard .card-cell');
    if (cells.length !== 25) return false;
    
    const markedCells = Array.from(cells).map(cell => cell.classList.contains('marked'));
    
    for (let i = 0; i < 5; i++) {
      let rowComplete = true;
      let colComplete = true;
      
      for (let j = 0; j < 5; j++) {
        if (!markedCells[i * 5 + j]) rowComplete = false;
        if (!markedCells[j * 5 + i]) colComplete = false;
      }
      
      if (rowComplete || colComplete) return true;
    }
    
    let diag1Complete = true;
    let diag2Complete = true;
    
    for (let i = 0; i < 5; i++) {
      if (!markedCells[i * 5 + i]) diag1Complete = false;
      if (!markedCells[i * 5 + (4 - i)]) diag2Complete = false;
    }
    
    return diag1Complete || diag2Complete;
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
  // UI-only Reset (no toca Firestore)
  function resetGameUIOnly() {
    // Estado UI del moderador
    gameState.calledTerms = [];
    gameState.currentIndex = 0;
    const current = document.getElementById('currentTerm');
    if (current) current.textContent = 'Registra participantes y asigna cartillas para comenzar';
    const called = document.getElementById('calledTermsList');
    if (called) called.innerHTML = '';
    const calledCount = document.getElementById('termsCalledCount');
    if (calledCount) calledCount.textContent = '0';
    const remainCount = document.getElementById('termsRemainingCount');
    if (remainCount) remainCount.textContent = String(WEB3_MARKETING_TERMS.length);

    // Estado UI del participante
    const playing = document.getElementById('playing-section');
    const waiting = document.getElementById('waiting-section');
    if (playing && waiting && !(currentParticipant && currentParticipant.cardId)) {
      playing.classList.add('hidden');
      waiting.classList.remove('hidden');
    }

    try { if (window.showToast) window.showToast('🔄 Interfaz reiniciada. (Los datos permanecen sin cambios)'); } catch(_) {}
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
    document.getElementById('resetGameBtn')?.addEventListener('click', resetGameUIOnly);
  
    window.addEventListener('hashchange', () => handleRouteChange(getCurrentRoute()));
    handleRouteChange(getCurrentRoute());
    
    /* ====== Ajustes ligeros sin tocar la lógica ====== */
    
    /* 1) Pre-autenticar lo antes posible para evitar latencia al registrarse */
    ensureAnonymous().catch(() => { /* no bloquear la UI si falla */ });
    
    /* 2) Asegurar que los textos NO se fuercen a minúsculas por algún estilo global */
    (function fixTextTransform() {
      const targets = [
        '.player-banner', '.player-tip', '.bingo-card', '.bingo-card .cell-text',
        '#waiting-section', '#participantsList .no-participants'
      ];
      targets.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.style.textTransform = 'none');
      });
    })();
    
    /* 3) Si alguna hoja antigua pisa colores/contraste, re-aplícalos al entrar en "playing" */
    const _oldDisplayPlayerCard = displayPlayerCard;
    displayPlayerCard = function(cardTerms) {
      _oldDisplayPlayerCard(cardTerms);      
      document.querySelectorAll('.card-cell').forEach(el => {
        el.style.background = ''; 
        el.style.color = '';
        el.style.borderColor = '';
      });
    };
    
    console.log('App initialized');
  });
  