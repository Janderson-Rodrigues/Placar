// Variáveis do jogo
let p1Points = 0;
let p2Points = 0;
let p1Sets = 0;
let p2Sets = 0;
let gameHistory = [];
let gameFinished = false;
let timeouts = { p1: 1, p2: 1 };
let timeoutTimers = { p1: null, p2: null };
let disciplinaryActions = {
  p1: { yellows: 0, reds: 0 },
  p2: { yellows: 0, reds: 0 }
};

// Variáveis para controle de saque
let serveCount = 0;
let currentServer = 1;
let deuceMode = false;

// Funções principais
function updateDisplay() {
  document.getElementById("p1-points").textContent = p1Points;
  document.getElementById("p2-points").textContent = p2Points;
  document.getElementById("p1-sets").textContent = p1Sets;
  document.getElementById("p2-sets").textContent = p2Sets;
  document.getElementById("timeouts-p1").textContent = timeouts.p1;
  document.getElementById("timeouts-p2").textContent = timeouts.p2;
  document.getElementById("fouls-p1").textContent = disciplinaryActions.p1.yellows + disciplinaryActions.p1.reds;
  document.getElementById("fouls-p2").textContent = disciplinaryActions.p2.yellows + disciplinaryActions.p2.reds;
  
  checkMatchWinner();
}

function updateNames() {
  const name1 = document.getElementById("player1-name").value || "Jogador 1";
  const name2 = document.getElementById("player2-name").value || "Jogador 2";
  document.getElementById("p1-name-display").textContent = name1;
  document.getElementById("p2-name-display").textContent = name2;
  updateServeIndicator();
}

function addPoint(player) {
  if (gameFinished) return;
  
  playSound("pointSound");
  checkDeuceMode();
  
  const p1Name = document.getElementById("p1-name-display").textContent;
  const p2Name = document.getElementById("p2-name-display").textContent;
  
  if (player === 1) p1Points++;
  else p2Points++;
  
  gameHistory.push({ action: 'point', player, p1Points, p2Points });
  addToHistory(`${new Date().toLocaleTimeString()} - Jogador ${player} marcou (${p1Points} × ${p2Points})`);
  checkSetWinner();
  changeServe();
  updateDisplay();
}

function checkSetWinner() {
  if ((p1Points >= 11 && p1Points - p2Points >= 2) || 
      (p2Points >= 11 && p2Points - p1Points >= 2)) {
    playSound("setSound");
    const winner = p1Points > p2Points ? 1 : 2;
    if (winner === 1) p1Sets++; else p2Sets++;
    
    const p1Name = document.getElementById("p1-name-display").textContent;
    const p2Name = document.getElementById("p2-name-display").textContent;
    const winnerName = winner === 1 ? p1Name : p2Name;
    
    addToHistory(`🏆 ${winnerName} venceu o set! (${p1Points} × ${p2Points})`);
    p1Points = p2Points = 0;
    serveCount = 0;
  }
}

function checkMatchWinner() {
  const maxSets = parseInt(document.getElementById('max-sets').value);
  const setsToWin = Math.ceil(maxSets / 2);
  
  if (p1Sets >= setsToWin || p2Sets >= setsToWin) {
    gameFinished = true;
    playSound("matchSound");
    const winner = p1Sets > p2Sets ? 1 : 2;
    document.getElementById(`p${winner}-card`).classList.add("winner-glow");
    
    const p1Name = document.getElementById("p1-name-display").textContent;
    const p2Name = document.getElementById("p2-name-display").textContent;
    const winnerName = winner === 1 ? p1Name : p2Name;
    
    addToHistory(`🎉 ${winnerName} VENCEU A PARTIDA!`);
  }
}

// Timeouts
function requestTimeout(player) {
  const playerKey = `p${player}`;
  
  if (timeouts[playerKey] <= 0) {
    addToHistory(`Jogador ${player} não tem mais timeouts!`);
    return;
  }

  timeouts[playerKey]--;
  updateDisplay();
  
  document.getElementById(`timeout-p${player}`).disabled = true;
  document.querySelectorAll('.player-card button').forEach(btn => btn.disabled = true);
  
  const timerElement = document.getElementById(`timer-p${player}`);
  timerElement.classList.remove('hidden');
  
  let seconds = 60;
  timerElement.querySelector('span').textContent = "1:00";
  
  timeoutTimers[playerKey] = setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerElement.querySelector('span').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    
    if (seconds <= 0) {
      clearInterval(timeoutTimers[playerKey]);
      endTimeout(player);
    }
  }, 1000);
  
  addToHistory(`⏱️ Jogador ${player} solicitou timeout`);
}

function endTimeout(player) {
  document.getElementById(`timer-p${player}`).classList.add('hidden');
  document.querySelectorAll('.player-card button').forEach(btn => btn.disabled = false);
  addToHistory(`✅ Timeout do Jogador ${player} encerrado`);
}

// Sistema Disciplinar
function addCard(player, cardType) {
  if (gameFinished) return;
  
  const playerKey = `p${player}`;
  const opponent = player === 1 ? 2 : 1;
  
  if (cardType === 'yellow') {
    disciplinaryActions[playerKey].yellows++;
    addToHistory(`🟨 Cartão amarelo para Jogador ${player} (Infração ${disciplinaryActions[playerKey].yellows})`);
    
    if (disciplinaryActions[playerKey].yellows >= 2) {
      addRedCard(player);
    }
  } 
  else if (cardType === 'red') {
    addRedCard(player);
  }
  
  updateCardsDisplay();
}

function addRedCard(player) {
  const playerKey = `p${player}`;
  const opponent = player === 1 ? 2 : 1;
  
  disciplinaryActions[playerKey].reds++;
  disciplinaryActions[playerKey].yellows = 0;
  
  addToHistory(`🟥 Cartão vermelho para Jogador ${player}`);
  
  if (player === 1) p2Points++; else p1Points++;
  addToHistory(`➕ Ponto de penalidade para Jogador ${opponent}`);
  
  if (disciplinaryActions[playerKey].reds >= 2) {
    disqualifyPlayer(player);
  } else {
    updateDisplay();
  }
}

function disqualifyPlayer(player) {
  const opponent = player === 1 ? 2 : 1;
  gameFinished = true;
  
  if (opponent === 1) {
    p1Sets = Math.ceil(document.getElementById('max-sets').value / 2);
  } else {
    p2Sets = Math.ceil(document.getElementById('max-sets').value / 2);
  }
  
  document.getElementById(`p${player}-card`).classList.add('disqualified');
  document.getElementById(`p${opponent}-card`).classList.add('winner-glow');
  
  addToHistory(`❌ Jogador ${player} desqualificado!`);
  addToHistory(`🏆 Jogador ${opponent} vence por desqualificação`);
  
  updateDisplay();
  document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

function updateCardsDisplay() {
  document.getElementById('cards-p1').innerHTML = 
    '🟨'.repeat(disciplinaryActions.p1.yellows) + 
    '🟥'.repeat(disciplinaryActions.p1.reds);
    
  document.getElementById('cards-p2').innerHTML = 
    '🟨'.repeat(disciplinaryActions.p2.yellows) + 
    '🟥'.repeat(disciplinaryActions.p2.reds);
    
  updateDisplay();
}

// Funções para melhorias
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      addToHistory(`Erro ao entrar em tela cheia: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function playSound(soundId) {
  const sound = document.getElementById(soundId);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Autoplay prevented:", e));
  }
}

function updateServeIndicator() {
  const p1Name = document.getElementById("p1-name-display").textContent;
  const p2Name = document.getElementById("p2-name-display").textContent;
  const serverName = currentServer === 1 ? p1Name : p2Name;
  document.getElementById("serve-indicator").textContent = `Saque: ${serverName}`;
  
  document.getElementById(`p${currentServer}-card`).classList.add('serve-glow');
  document.getElementById(`p${currentServer === 1 ? 2 : 1}-card`).classList.remove('serve-glow');
}

function changeServe() {
  if (deuceMode) {
    currentServer = currentServer === 1 ? 2 : 1;
  } else {
    serveCount++;
    if (serveCount >= 2) {
      currentServer = currentServer === 1 ? 2 : 1;
      serveCount = 0;
    }
  }
  
  updateServeIndicator();
}

function checkDeuceMode() {
  if (p1Points >= 10 && p2Points >= 10 && !deuceMode) {
    deuceMode = true;
    serveCount = 0;
    addToHistory("🔔 Modo 10x10 ativado - Saque alternado");
  } else if ((p1Points < 10 || p2Points < 10) && deuceMode) {
    deuceMode = false;
    addToHistory("🔔 Modo 10x10 desativado");
  }
}

// Funções utilitárias
function addToHistory(message) {
  const entry = document.createElement('div');
  entry.className = 'py-1 border-b border-gray-200';
  entry.textContent = message;
  document.getElementById('point-history').prepend(entry);
}

function undoLastPoint() {
  if (gameHistory.length > 0) {
    const last = gameHistory.pop();
    if (last.action === 'point') {
      if (last.player === 1) p1Points--; else p2Points--;
      updateDisplay();
      addToHistory(`↩️ Ponto desfeito para Jogador ${last.player}`);
    }
  }
}

function resetGame() {
  p1Points = p2Points = 0;
  p1Sets = p2Sets = 0;
  gameFinished = false;
  timeouts = { p1: 1, p2: 1 };
  disciplinaryActions = { p1: { yellows: 0, reds: 0 }, p2: { yellows: 0, reds: 0 } };
  gameHistory = [];
  serveCount = 0;
  currentServer = 1;
  deuceMode = false;
  
  clearTimeout(timeoutTimers.p1);
  clearTimeout(timeoutTimers.p2);
  
  document.getElementById('p1-card').classList.remove("winner-glow", "disqualified", "serve-glow");
  document.getElementById('p2-card').classList.remove("winner-glow", "disqualified", "serve-glow");
  document.getElementById('timer-p1').classList.add('hidden');
  document.getElementById('timer-p2').classList.add('hidden');
  
  document.querySelectorAll('button').forEach(btn => btn.disabled = false);
  
  updateDisplay();
  updateCardsDisplay();
  updateServeIndicator();
  document.getElementById('point-history').innerHTML = '';
  addToHistory('🔄 Jogo reiniciado');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  updateDisplay();
  updateNames();
  updateServeIndicator();
  addToHistory('⏳ Jogo iniciado');
});