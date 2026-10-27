const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function navigate(route, updateHash = true) {
  const target = document.getElementById(route) || $('#experience');
  $$('.view').forEach(view => {
    const active = view === target;
    view.hidden = !active;
    view.classList.toggle('active', active);
  });
  $$('.nav-link').forEach(link => {
    const active = link.dataset.route === route;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (updateHash) history.pushState(null, '', `#${route}`);
  document.title = `${route === 'experience' ? 'L’Odyssée des Éclipses' : target.querySelector('h2')?.textContent || 'L’Odyssée'} — 2027`;
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  target.querySelector('h1, h2')?.focus({ preventScroll: true });
}

$$('[data-route]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  navigate(link.dataset.route);
}));
$$('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
window.addEventListener('popstate', () => navigate(location.hash.slice(1) || 'experience', false));
navigate(location.hash.slice(1) || 'experience', false);

const canvas = $('#sky');
const context = canvas.getContext('2d');
const stage = $('#stage');
const sun = $('#sun-handle');
const performer = $('#performer');
const acts = [
  { number: 'ACTE I', name: 'L’ÉVEIL', color: '#edbb68', stars: 70 },
  { number: 'ACTE II', name: 'L’ENVOL', color: '#9ecbc6', stars: 105 },
  { number: 'ACTE III', name: 'LA RENCONTRE', color: '#d7b0c8', stars: 130 }
];
let currentAct = 0;
let currentForce = 'light';
let sunPosition = { x: .63, y: .23 };
let width = 0;
let height = 0;
let dragging = false;
let animationFrame;
let time = 0;
const stars = Array.from({ length: 130 }, (_, index) => ({
  x: ((index * 47) % 131) / 131,
  y: ((index * 83) % 137) / 137,
  size: .3 + (index % 4) * .28,
  phase: index * .7
}));

function resizeCanvas() {
  const box = stage.getBoundingClientRect();
  width = box.width;
  height = box.height;
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawSky();
}

function drawSky() {
  context.clearRect(0, 0, width, height);
  const act = acts[currentAct];
  const sx = sunPosition.x * width;
  const sy = sunPosition.y * height;
  const glow = context.createRadialGradient(sx, sy, 10, sx, sy, width * .58);
  glow.addColorStop(0, `${act.color}24`);
  glow.addColorStop(.45, `${act.color}0b`);
  glow.addColorStop(1, 'transparent');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  stars.slice(0, act.stars).forEach(star => {
    const alpha = .18 + (Math.sin(time * .001 + star.phase) + 1) * .14;
    context.beginPath();
    context.fillStyle = `rgba(224,232,218,${alpha})`;
    context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
    context.fill();
  });
  if (currentForce === 'light') {
    context.strokeStyle = `${act.color}18`;
    for (let index = 0; index < 9; index++) {
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo((index / 8) * width, height);
      context.stroke();
    }
  }
}

function animateSky(timestamp) {
  time = timestamp;
  drawSky();
  animationFrame = requestAnimationFrame(animateSky);
}

function moveSun(x, y) {
  sunPosition.x = Math.max(.08, Math.min(.92, x));
  sunPosition.y = Math.max(.12, Math.min(.75, y));
  sun.style.left = `${sunPosition.x * 100}%`;
  sun.style.top = `${sunPosition.y * 100}%`;
  if (currentForce === 'gravity') {
    performer.style.top = `${42 + sunPosition.y * 17}%`;
    performer.style.left = `${35 + sunPosition.x * 24}%`;
  } else {
    performer.style.top = '';
    performer.style.left = '';
  }
  if (reducedMotion) drawSky();
}

function pointerPosition(event) {
  const box = stage.getBoundingClientRect();
  moveSun((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
}
sun.addEventListener('pointerdown', event => {
  dragging = true;
  sun.setPointerCapture(event.pointerId);
});
sun.addEventListener('pointermove', event => { if (dragging) pointerPosition(event); });
sun.addEventListener('pointerup', () => { dragging = false; });
sun.addEventListener('pointercancel', () => { dragging = false; });
sun.addEventListener('keydown', event => {
  const step = event.shiftKey ? .08 : .025;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[event.key]) {
    event.preventDefault();
    moveSun(sunPosition.x + moves[event.key][0], sunPosition.y + moves[event.key][1]);
  }
});

function awaken() {
  performer.classList.add('awake');
  $('#awaken').innerHTML = 'La scène est à vous <span aria-hidden="true">✦</span>';
  sun.animate([{ boxShadow: '0 0 20px #edbb6800' }, { boxShadow: '0 0 120px #edbb68aa' }, { boxShadow: '' }], { duration: reducedMotion ? 1 : 1400 });
}
$('#awaken').addEventListener('click', awaken);

$$('.act').forEach(button => button.addEventListener('click', () => {
  currentAct = Number(button.dataset.act);
  $('#act-number').textContent = acts[currentAct].number;
  $('#act-name').textContent = acts[currentAct].name;
  $$('.act').forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  document.documentElement.style.setProperty('--gold', acts[currentAct].color);
  awaken();
  if (reducedMotion) drawSky();
}));

$$('[data-force]').forEach(button => button.addEventListener('click', () => {
  currentForce = button.dataset.force;
  performer.classList.toggle('gravity', currentForce === 'gravity');
  performer.classList.toggle('motion', currentForce === 'motion');
  $$('[data-force]').forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  moveSun(sunPosition.x, sunPosition.y);
  if (reducedMotion) drawSky();
}));

new ResizeObserver(resizeCanvas).observe(stage);
resizeCanvas();
if (!reducedMotion) animationFrame = requestAnimationFrame(animateSky);
document.addEventListener('visibilitychange', () => {
  if (reducedMotion) return;
  cancelAnimationFrame(animationFrame);
  if (!document.hidden) animationFrame = requestAnimationFrame(animateSky);
});

const chapters = [
  {
    label: 'CHAPITRE I — LE SEUIL', question: 'Le rideau respire. Par où entrez-vous ?',
    quote: '« Avant le premier geste, il y a un silence qui appartient à tout le monde. »', symbol: '✦',
    choices: [
      ['Par une faille de lumière', 'Vous suivez une lueur timide. Elle reconnaît votre pas et dessine un chemin suspendu.', 'La lueur'],
      ['Par la coulisse des vents', 'Un vent familier vous pousse doucement. Les toiles s’écartent comme des voiles.', 'Le vent'],
      ['Par la porte des murmures', 'Vous écoutez. Mille histoires inaudibles deviennent une seule invitation.', 'Le murmure']
    ]
  },
  {
    label: 'CHAPITRE II — L’IMPULSION', question: 'Une funambule vous tend la main. Que lui offrez-vous ?',
    quote: '« La confiance est le seul fil qui ne se voit jamais. »', symbol: '◯',
    choices: [
      ['Votre souffle', 'Votre souffle devient une seconde corde. Ensemble, vous traversez sans regarder le vide.', 'L’élan'],
      ['Votre silence', 'Dans ce silence partagé, chaque mouvement devient évident. Le vide n’est plus un danger.', 'Le silence'],
      ['Votre rire', 'Votre rire la soulève. Pendant un instant, vous ne savez plus qui porte qui.', 'La joie']
    ]
  },
  {
    label: 'CHAPITRE III — L’ÉCLIPSE', question: 'Le soleil s’éteint. Que laissez-vous derrière vous ?',
    quote: '« Une constellation n’est qu’une histoire que le ciel n’a pas oubliée. »', symbol: '☼',
    choices: [
      ['Une étincelle', 'Votre étincelle rejoint les autres. La nuit n’est plus vide : elle vous ressemble.', 'L’étincelle'],
      ['Un serment', 'Vous promettez de revenir. Quelque part, une lumière répond à votre promesse.', 'La promesse'],
      ['Un dernier geste', 'Vous saluez le ciel. Et dans un mouvement immense, c’est le ciel qui vous répond.', 'Le geste']
    ]
  }
];
let storyStep = 0;
let storyPath = [];

function renderStory() {
  if (storyStep >= chapters.length) {
    $('#story-chapter').textContent = 'VOTRE CONSTELLATION EST NÉE';
    $('#story-question').textContent = storyPath.join(' · ');
    $('#story-choices').innerHTML = `<p class="story-result">Votre récit est unique, mais il ne vous appartient plus tout à fait. Il flotte maintenant parmi les autres échos de l’Odyssée.</p>`;
    $('#echo-number').textContent = 'VOTRE ÉCHO · 2027';
    $('#story-quote').textContent = '« L’émerveillement commence quand on accepte de ne pas tout comprendre. »';
    $('#echo-symbol').textContent = '✧';
    $('#story-reset').hidden = false;
    $$('.story-progress i').forEach(item => item.classList.add('active'));
    return;
  }
  const chapter = chapters[storyStep];
  $('#story-chapter').textContent = chapter.label;
  $('#story-question').textContent = chapter.question;
  $('#story-quote').textContent = chapter.quote;
  $('#echo-symbol').textContent = chapter.symbol;
  $('#echo-number').textContent = `ÉCHO 0${storyStep + 1} / 03`;
  $('#story-choices').innerHTML = chapter.choices.map((choice, index) => `<button class="story-choice" data-choice="${index}"><span>0${index + 1}</span>${choice[0]}<span>↗</span></button>`).join('');
  $$('.story-choice').forEach(button => button.addEventListener('click', () => {
    const choice = chapter.choices[Number(button.dataset.choice)];
    $$('.story-choice').forEach(item => { item.disabled = true; });
    storyPath.push(choice[2]);
    $('#story-quote').textContent = `« ${choice[1]} »`;
    storyStep++;
    setTimeout(renderStory, reducedMotion ? 0 : 500);
  }));
  $$('.story-progress i').forEach((item, index) => item.classList.toggle('active', index <= storyStep));
}
$('#story-reset').addEventListener('click', () => {
  storyStep = 0;
  storyPath = [];
  $('#story-reset').hidden = true;
  renderStory();
});
renderStory();

let audioContext;
let audioGain;
let soundOn = false;
$('#sound-toggle').addEventListener('click', async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioGain = audioContext.createGain();
    audioGain.gain.value = 0;
    audioGain.connect(audioContext.destination);
    [130.81, 196, 261.63].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 3;
      gain.gain.value = .025;
      oscillator.connect(gain).connect(audioGain);
      oscillator.start();
    });
  }
  await audioContext.resume();
  soundOn = !soundOn;
  audioGain.gain.setTargetAtTime(soundOn ? .5 : 0, audioContext.currentTime, .5);
  $('#sound-toggle').setAttribute('aria-pressed', String(soundOn));
  $('#sound-toggle').setAttribute('aria-label', soundOn ? 'Couper l’ambiance sonore' : 'Activer l’ambiance sonore');
  $('#sound-toggle span').textContent = `Son ${soundOn ? 'on' : 'off'}`;
});

const dialog = $('#booking-dialog');
$$('.book-button').forEach(button => button.addEventListener('click', () => {
  $('#booking-city').textContent = `${button.dataset.show} · Édition fictive 2027`;
  $('#booking-result').innerHTML = '';
  $('#simulate-booking').hidden = false;
  dialog.showModal();
}));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
$('#simulate-booking').addEventListener('click', () => {
  const count = $('#ticket-count').value;
  const city = $('#booking-city').textContent.split(' · ')[0];
  const code = `FICTION-${city.slice(0, 3).toUpperCase()}-2027`;
  $('#booking-result').innerHTML = `<div class="booking-success"><strong>Simulation terminée.</strong><br>${count} place${count > 1 ? 's' : ''} imaginaire${count > 1 ? 's' : ''} · ${city}<br>Référence de démonstration : ${code}<br>Aucun billet n’a été émis.</div>`;
  $('#simulate-booking').hidden = true;
});
