let move_speed = 5, gravity = 0.5;
let bird_dy = 0;
let total_pipes_created = 0;

const bird = document.querySelector('.bird');
const img = document.getElementById('bird-1');
const score_val = document.querySelector('.score_val');
const message = document.getElementById('game-message');
const score_box = document.getElementById('score-box');
const authBox = document.getElementById('auth-box');
const playSection = document.getElementById('play-section');
const score_history = document.getElementById('score-history');
const last_scores_ul = document.getElementById('last-scores');

const sound_point = new Audio('sounds effect/point.mp3');
const sound_die = new Audio('sounds effect/die.mp3');
const sound_win = new Audio('sounds effect/win.mp3');
sound_win.load();
sound_point.load();
sound_die.load();

let game_state = 'Start';
let currentUser = null;
let bird_props, background;

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function updateUserScore(user, score) {
  const users = getUsers();
  if (!users[user].scores) users[user].scores = [];
  users[user].scores.unshift(score);
  users[user].scores = users[user].scores.slice(0, 3);
  setUsers(users);
}

function displayScoreHistory() {
  const scores = getUsers()[currentUser]?.scores || [];
  last_scores_ul.innerHTML = scores.map(s => `<li>${s}</li>`).join('');
  score_history.style.display = 'block';
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const users = getUsers();

  if (!users[username] || users[username].password !== password) {
    document.getElementById('auth-error').innerText = 'Invalid credentials.';
    return;
  }

  currentUser = username;
  afterLogin();
}

function signup() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const users = getUsers();

  if (users[username]) {
    document.getElementById('auth-error').innerText = 'Username already exists.';
    return;
  }

  users[username] = { password, scores: [] };
  setUsers(users);
  currentUser = username;
  afterLogin();
}

function afterLogin() {
  authBox.style.display = 'none';
  playSection.style.display = 'block';
  score_box.style.display = 'block';
  displayScoreHistory();
}

function showGameStartMessage() {
  if (game_state === 'End') {
    document.querySelectorAll('.pipe_sprite').forEach(p => p.remove());
    bird.style.top = '40vh';
    bird_dy = 0;
    total_pipes_created = 0;
    score_val.innerHTML = '0';
    img.style.display = 'none';
  }

  game_state = 'Ready';
  message.innerHTML = `Press <b>Enter</b> to Start Game<br>Use <span style="color:red;">↑ Arrow</span> or Space to Fly`;
  message.style.display = 'block';
}

document.addEventListener('keydown', e => {
  if (game_state === 'Play' && (e.key === 'ArrowUp' || e.key === ' ')) {
    bird_dy = -7.6;
  }

  if ((game_state === 'Ready' || game_state === 'End') && e.key === 'Enter' && currentUser) {
    document.querySelectorAll('.pipe_sprite').forEach(p => p.remove());
    bird.style.top = '40vh';
    bird_dy = 0;
    total_pipes_created = 0;
    score_val.innerHTML = '0';

    message.style.display = 'none';
    playSection.style.display = 'none';

    img.style.display = 'block';
    game_state = 'Play';
    bird_props = bird.getBoundingClientRect();
    background = document.querySelector('.background').getBoundingClientRect();

    // Pre-trigger audio (for browser permissions)
    sound_point.play().catch(() => {});
    sound_point.pause();
    sound_point.currentTime = 0;

    play();
  }
});

function play() {
  let pipe_seperation = 0;
  let pipe_gap = 35;

  function move() {
    if (game_state !== 'Play') return;

    document.querySelectorAll('.pipe_sprite').forEach(el => {
      let pipe_props = el.getBoundingClientRect();
      bird_props = bird.getBoundingClientRect();

      if (pipe_props.right <= 0) {
        el.remove();
      } else {
        if (
          bird_props.left < pipe_props.left + pipe_props.width &&
          bird_props.left + bird_props.width > pipe_props.left &&
          bird_props.top < pipe_props.top + pipe_props.height &&
          bird_props.top + bird_props.height > pipe_props.top
        ) {
          endGame();
          return;
        } else if (
          pipe_props.right < bird_props.left &&
          pipe_props.right + move_speed >= bird_props.left &&
          el.increase_score === '1'
        ) {
          let score = +score_val.innerHTML + 1;
          score_val.innerHTML = score;
          el.increase_score = '0';
          sound_point.play().catch(() => {});
          if (score >= 10) endGame(true);
        }
        el.style.left = pipe_props.left - move_speed + 'px';
      }
    });

    requestAnimationFrame(move);
  }

  function apply_gravity() {
    if (game_state !== 'Play') return;
    bird_dy += gravity;
    bird.style.top = bird_props.top + bird_dy + 'px';
    bird_props = bird.getBoundingClientRect();

    if (bird_props.top <= 0 || bird_props.bottom >= background.bottom) {
      endGame();
    } else {
      requestAnimationFrame(apply_gravity);
    }
  }

  function create_pipe() {
    if (game_state !== 'Play') return;
    if (pipe_seperation > 115) {
      pipe_seperation = 0;
      total_pipes_created++;

      let pipe_posi = Math.floor(Math.random() * 43) + 8;

      let topPipe = document.createElement('div');
      topPipe.className = 'pipe_sprite';
      topPipe.style.top = pipe_posi - 70 + 'vh';
      topPipe.style.left = '100vw';
      topPipe.style.backgroundColor = 'green'; // Change pipe color
      document.body.appendChild(topPipe);

      let bottomPipe = document.createElement('div');
      bottomPipe.className = 'pipe_sprite';
      bottomPipe.style.top = pipe_posi + pipe_gap + 'vh';
      bottomPipe.style.left = '100vw';
      bottomPipe.style.backgroundColor = 'orange'; // Change pipe color
      bottomPipe.increase_score = '1';
      document.body.appendChild(bottomPipe);
    }
    pipe_seperation++;
    requestAnimationFrame(create_pipe);
  }

  move();
  apply_gravity();
  create_pipe();
}

function endGame(win = false) {
  game_state = 'End';
  img.style.display = 'none';

  let finalScore = +score_val.innerHTML;
  if (currentUser) updateUserScore(currentUser, finalScore);
  displayScoreHistory();

  function showFireworks() {
    const container = document.createElement('div');
    container.className = 'fireworks';
    document.body.appendChild(container);
  
    for (let i = 0; i < 30; i++) {
      const firework = document.createElement('div');
      firework.className = 'firework';
      firework.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
      firework.style.left = Math.random() * window.innerWidth + 'px';
      firework.style.top = Math.random() * window.innerHeight + 'px';
      container.appendChild(firework);
    }
  
    // Remove fireworks after animation
    setTimeout(() => {
      container.remove();
    }, 1500);
  }

  if (win) {
    sound_win.play().catch(() => {});
    showFireworks();  // 🎆 Show crackers when win
  } else {
    sound_die.play().catch(() => {});
  }

  message.innerHTML = win
    ? '<b>🏆You Win!</b><br>Press <b>Enter to play again</b>'
    : '<b>💥 Game Over</b><br>Press <b>Enter to restart</b>';

  message.style.display = 'block';
  playSection.style.display = 'block';
}
