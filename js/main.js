// Função para adicionar um ponto ao jogador 1
const scoreManager = (function() {
  // Variáveis do jogo
  let p1Points = 0;
  let p2Points = 0;
  let p1Sets = 0;
  let p2Sets = 0;
  let gameHistory = [];
  let gameFinished = false;
  const pointsToWinSet = 11;
  const minDifference = 2;

  // Elementos DOM
  const p1Card = document.getElementById('p1-card');
  const p2Card = document.getElementById('p2-card');
  const pointHistoryElement = document.getElementById('point-history');
  const pointButtons = document.querySelectorAll('.player-card button');

  // Inicializa o placar
  function init() {
    document.getElementById('player1-name').addEventListener('input', updateNames);
    document.getElementById('player2-name').addEventListener('input', updateNames);
    updateDisplay();
    updateNames();
    addToHistory("Jogo iniciado. Boa partida!");
  }

  // Atualiza a exibição na tela
  function updateDisplay() {
    document.getElementById("p1-points").textContent = p1Points;
    document.getElementById("p2-points").textContent = p2Points;
    document.getElementById("p1-sets").textContent = p1Sets;
    document.getElementById("p2-sets").textContent = p2Sets;
    
    checkMatchWinner();
  }

  // Atualiza os nomes dos jogadores
  function updateNames() {
    const name1 = document.getElementById("player1-name").value || "Jogador 1";
    const name2 = document.getElementById("player2-name").value || "Jogador 2";
    document.getElementById("p1-name-display").textContent = name1;
    document.getElementById("p2-name-display").textContent = name2;
  }

  // Adiciona ponto para um jogador
  function addPoint(player) {
    if (gameFinished) return;
    
    const p1Name = document.getElementById("p1-name-display").textContent;
    const p2Name = document.getElementById("p2-name-display").textContent;
    const pointTime = new Date().toLocaleTimeString();
    
    if (player === 1) {
      p1Points++;
      gameHistory.push({
        player: 1,
        point: p1Points,
        opponentPoint: p2Points,
        time: pointTime,
        set: p1Sets + p2Sets + 1
      });
      addToHistory(`${pointTime} - ${p1Name} marcou ponto (${p1Points} × ${p2Points})`);
    } else {
      p2Points++;
      gameHistory.push({
        player: 2,
        point: p2Points,
        opponentPoint: p1Points,
        time: pointTime,
        set: p1Sets + p2Sets + 1
      });
      addToHistory(`${pointTime} - ${p2Name} marcou ponto (${p1Points} × ${p2Points})`);
    }
    
    checkSetWinner();
    updateDisplay();
  }

  // Verifica se há vencedor do set
  function checkSetWinner() {
    if (p1Points >= pointsToWinSet || p2Points >= pointsToWinSet) {
      const pointsDiff = Math.abs(p1Points - p2Points);
      
      if (pointsDiff >= minDifference) {
        const p1Name = document.getElementById("p1-name-display").textContent;
        const p2Name = document.getElementById("p2-name-display").textContent;
        
        if (p1Points > p2Points) {
          p1Sets++;
          addToHistory(`🏆 ${p1Name} venceu o set ${p1Sets + p2Sets} por ${p1Points} a ${p2Points}!`);
        } else {
          p2Sets++;
          addToHistory(`🏆 ${p2Name} venceu o set ${p1Sets + p2Sets} por ${p2Points} a ${p1Points}!`);
        }
        
        p1Points = 0;
        p2Points = 0;
      }
    }
  }

  // Verifica se há vencedor da partida
  function checkMatchWinner() {
    const maxSets = parseInt(document.getElementById('max-sets').value);
    const setsToWin = Math.ceil(maxSets / 2);
    const p1Name = document.getElementById("p1-name-display").textContent;
    const p2Name = document.getElementById("p2-name-display").textContent;
    
    if (p1Sets >= setsToWin) {
      gameFinished = true;
      p1Card.classList.add('winner-glow');
      addToHistory(`🎉🎉 ${p1Name} VENCEU A PARTIDA! 🎉🎉 (${p1Sets} sets a ${p2Sets})`);
      disablePointButtons();
    } else if (p2Sets >= setsToWin) {
      gameFinished = true;
      p2Card.classList.add('winner-glow');
      addToHistory(`🎉🎉 ${p2Name} VENCEU A PARTIDA! 🎉🎉 (${p2Sets} sets a ${p1Sets})`);
      disablePointButtons();
    }
  }

  // Desativa os botões de ponto
  function disablePointButtons() {
    pointButtons.forEach(btn => {
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.disabled = true;
    });
  }

  // Ativa os botões de ponto
  function enablePointButtons() {
    pointButtons.forEach(btn => {
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.disabled = false;
    });
  }

  // Adiciona mensagem ao histórico
  function addToHistory(message) {
    const historyElement = document.createElement('div');
    historyElement.textContent = message;
    historyElement.className = 'py-1 border-b border-gray-200 last:border-0';
    pointHistoryElement.prepend(historyElement);
    
    if (pointHistoryElement.children.length > 20) {
      pointHistoryElement.removeChild(pointHistoryElement.lastChild);
    }
  }

  // Desfaz o último ponto
  function undoLastPoint() {
    if (gameHistory.length === 0) return;
    
    const lastPoint = gameHistory.pop();
    
    if (lastPoint.player === 1) {
      p1Points = lastPoint.point - 1;
    } else {
      p2Points = lastPoint.point - 1;
    }
    
    const currentSet = p1Sets + p2Sets + 1;
    if (currentSet < lastPoint.set) {
      if (lastPoint.player === 1) {
        p1Sets--;
      } else {
        p2Sets--;
      }
    }
    
    gameFinished = false;
    p1Card.classList.remove('winner-glow');
    p2Card.classList.remove('winner-glow');
    enablePointButtons();
    
    pointHistoryElement.removeChild(pointHistoryElement.firstChild);
    if (pointHistoryElement.children.length === 0) {
      addToHistory("Último ponto desfeito. Jogo em andamento.");
    }
    
    updateDisplay();
  }

  // Reinicia o jogo
  function resetGame() {
    p1Points = 0;
    p2Points = 0;
    p1Sets = 0;
    p2Sets = 0;
    gameHistory = [];
    gameFinished = false;
    
    p1Card.classList.remove('winner-glow');
    p2Card.classList.remove('winner-glow');
    enablePointButtons();
    
    updateDisplay();
    pointHistoryElement.innerHTML = '';
    addToHistory("Jogo reiniciado. Boa partida!");
  }

  // Expõe métodos públicos
  return {
    init,
    addPoint,
    undoLastPoint,
    resetGame,
    updateNames
  };
})();

// Inicializa o placar quando a página carrega
document.addEventListener('DOMContentLoaded', scoreManager.init);
