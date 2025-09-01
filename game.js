const root = document.getElementById('game-root');

// Utils
const shuffle = arr => arr.map(a => [Math.random(), a]).sort((a,b) => a[0]-b[0]).map(a => a[1]);
const CATEGORIES = [
  { key: 'peticiones', label: 'Peticiones', color: 'peticiones' },
  { key: 'quejas', label: 'Quejas', color: 'quejas' },
  { key: 'reclamos', label: 'Reclamos', color: 'reclamos' },
  { key: 'sugerencias', label: 'Sugerencias', color: 'sugerencias' }
];
let state = {};

function renderWelcome() {
  state = {};
  root.innerHTML = `
    <div class="screen">
      <img src="inboxiarect.png" alt="InboxIA Logo" style="margin-top:1.6em; border-radius: 50px; width:200px;">
      <h1 style="margin-top:0.6em;">AI Challenge</h1>
      <p style="margin-top:0.7em; text-align:center;">¿Te animás a competir contra la IA <br>clasificando correos?</p>
      <button id="start-btn" style="margin-top:2.2em;">Desafiar</button>
      <footer style="margin-top:40px;padding-bottom:1.5em;font-size:0.97em;color:var(--text-light);text-align:center;">
        Sponsored by <a href="https://piconsulting.com.ar" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none;font-weight:600;">Pi Consulting SAS</a>
      </footer>
    </div>
  `;
  document.getElementById('start-btn').onclick = renderRules;
}
function renderRules() {
  root.innerHTML = `
    <div class="screen">
      <h2>Reglas del juego</h2>
      <div class="result-box" style="margin-top:1em;">
        <ul style="list-style:none;padding-left:0;line-height:1.5em;font-size:1.04em;color:var(--text-light);margin:0;">
          <li>• Tenés 30 segundos para clasificar la mayor cantidad de correos posibles.</li>
          <li>• Leé cada correo y tocá el botón de la categoría que creas correcta.</li>
          <li>• ¡Cada respuesta te lleva al siguiente correo!</li>
          <li>• Los correos son breves y pueden referirse a: Peticiones, Quejas, Reclamos o Sugerencias.</li>
        </ul>
      </div>
      <button id="go-btn" style="margin-top:2.2em;">¡Comenzar!</button>
    </div>
  `;
  document.getElementById('go-btn').onclick = renderCountdown;
}
function renderCountdown() {
  root.innerHTML = `
    <div class="screen">
      <div class="countdown" id="countdown">3</div>
      <h2>Prepárate...</h2>
    </div>
  `;
  let count = 3;
  const cd = document.getElementById('countdown');
  const next = () => {
    if (count > 1) {
      count--;
      cd.textContent = count;
      setTimeout(next, 800);
    } else {
      cd.textContent = '¡Ya!';
      setTimeout(() => renderGame(), 800);
    }
  };
  setTimeout(next, 800);
}
function renderGame() {
  // Partida: shuffle de 100 correos
  const emails = shuffle([...window.EMAILS]);
  state = {
    emails,
    current: 0,
    correct: 0,
    answered: 0,
    time: 30,
    running: true,
    answers: [],
    timerInterval: null,
    startTime: Date.now()
  };

  // Render the whole game interface ONCE
  root.innerHTML = `
    <div class="screen" style="justify-content: flex-start;">
      <div class="game-center">
        <div style="width:100%;text-align:center"><span class="timer" id="timer">${state.time}</span></div>
        <div class="email-box" id="email-box"></div>
        <div class="category-row" id="cat-row">
          ${CATEGORIES.map(cat =>
            `<button class="category-btn ${cat.color}" data-cat="${cat.key}">${cat.label}</button>`
          ).join('')}
        </div>
      </div>
    </div>
  `;
  renderEmailBox();

  // Timer
  state.timerInterval = setInterval(() => {
    state.time--;
    if (state.time >= 0) document.getElementById('timer').textContent = state.time;
    if (state.time <= 0) finishGame();
  }, 1000);

  // Button handlers
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = (e) => handleCategoryClick(btn);
  });
}

function renderEmailBox(animDir) {
  const email = state.emails[state.current];
  const box = document.getElementById('email-box');
  box.innerHTML = `
    <div class="email-title">${email.title}</div>
    <div class="email-body">${email.body}</div>
  `;
  if (animDir) {
    box.style.transition = '';
    box.style.opacity = 1;
    box.style.transform = '';
    // Small delay to allow transition to be re-applied if needed
    setTimeout(() => {
      box.style.transition = 'transform 0.22s, opacity 0.18s';
      box.style.transform = 'none';
      box.style.opacity = 1;
    }, 10);
  }
}

function handleCategoryClick(btn) {
  const selected = btn.getAttribute('data-cat');
  btn.classList.add('selected');
  state.answered++;
  const email = state.emails[state.current];
  state.answers.push({
    email: state.current,
    answer: selected,
    correct: selected === email.category
  });
  if (selected === email.category) state.correct++;
  // Disable buttons until next email
  document.querySelectorAll('.category-btn').forEach(b => b.disabled = true);

  // Animate ONLY the email-box
  const box = document.getElementById('email-box');
  box.style.transition = 'transform 0.22s, opacity 0.18s';
  box.style.transform = `translateX(80px) scale(0.98)`;
  box.style.opacity = 0.2;
  setTimeout(() => {
    state.current++;
    if (state.current >= state.emails.length) {
      state.emails = shuffle([...window.EMAILS]);
      state.current = 0;
    }
    // Reset animation
    box.style.transition = '';
    box.style.transform = '';
    box.style.opacity = 1;
    // Render new email
    renderEmailBox(-1);
    // Re-enable buttons
    document.querySelectorAll('.category-btn').forEach(b => {
      b.classList.remove('selected');
      b.disabled = false;
    });
  }, 210);
}
function finishGame() {
  clearInterval(state.timerInterval);
  root.innerHTML += `<div class="end-animation" id="end-anim">¡Tiempo!</div>`;
  setTimeout(() => renderResults(), 1100);
}
function renderResults() {
  // IA: correos entre 52-61 (2 por segundo 26-30, pero lo pediste más bajo)
  const iaEmails = Math.floor(Math.random() * (61 - 52 + 1) + 52);
  const iaAccuracy = Math.floor(Math.random() * (89 - 83 + 1) + 83);
  const iaCorrect = Math.round(iaEmails * iaAccuracy / 100);

  // Usuario
  const userTotal = state.answered;
  const userCorrect = state.correct;
  const userAccuracy = userTotal > 0 ? Math.round(userCorrect / userTotal * 100) : 0;

  // Mensaje de resultado
  const userWin = userTotal > iaEmails && userAccuracy > iaAccuracy;
  let resultMsg = userWin
    ? `<div class="success-message">¡Superaste a la IA! ¡Increíble desempeño!<br>¡Sos más rápido y preciso que un robot! 🚀</div>`
    : `<div class="fail-message">Esta vez la IA 🤖 fue superior, <br>¿será que practicando podes superarla?</div>`;

root.innerHTML = `
  <div class="screen" style="justify-content: center;">
    <h2 style="margin-top:1.5em;">Resultados</h2>
    <div class="result-box">
      <div style="font-size:1.25em;margin-bottom:0.7em;">
        <b>Correos clasificados:</b> ${userTotal}<br>
        <b>Aciertos:</b> ${userCorrect} <span style="color:var(--text-light);font-size:0.97em;">(${userAccuracy}%)</span>
      </div>
      <div class="ia-result">
        Resultados de la IA:<b><br>Correos clasificados: ${iaEmails}<br>Aciertos: ${iaCorrect} (${iaAccuracy}%)</b>
      </div>
    </div>
    ${resultMsg}
    <div class="bottom-msg">Imaginate hacer esto con 10.000 correos diarios...<br><b>¡Acercate a nuestro stand para ver si tu resultado tiene premio!</b> </div>
    <div style="margin:1.8em 0 0.3em 0; text-align:center;">
      <span style="color:var(--primary);font-weight:500;">¿Querés saber más de InboxIA?</span><br>
      <a href="https://piconsulting.com.ar/home/aplicaciones/inboxia/"
         target="_blank"
         rel="noopener"
         style="color:var(--accent);text-decoration:underline;font-size:1.08em;font-weight:600;">
        Visitá nuestro sitio web.
      </a>
    </div>
    <button id="restart-btn" style="margin-bottom:1.8em;margin-top:1em;">Reiniciar</button>
  </div>
`;
  document.getElementById('restart-btn').onclick = renderWelcome;
}

// INICIO
renderWelcome();