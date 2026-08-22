// ============================================================
// HELPERS
// ============================================================
const $ = (selector) => document.querySelector(selector);

// ============================================================
// STATE
// ============================================================
const output = $('#terminalOutput');
const input = $('#commandInput');
const cacheKey = 'vlm326-github-cache';
const startedAt = Date.now();
const fallbackRepos = [
  {
    name: 'LocalScript',
    language: 'Rust',
    stargazers_count: 0,
    size: 420,
    pushed_at: '2026-06-01',
    html_url: 'https://github.com/Vlm326/LocalScript',
    description: 'SAFE SCRIPT EXECUTION WITH AST ANALYSIS, SANDBOXING, AND LLM-AWARE LIMITS.'
  },
  {
    name: 'NetAnalysys',
    language: 'Rust',
    stargazers_count: 0,
    size: 510,
    pushed_at: '2026-05-15',
    html_url: 'https://github.com/Vlm326/NetAnalysys',
    description: 'HIGH-PERFORMANCE GRAPH ANALYSIS WITH BFS, SCC, LANDMARK INDEXING, AND RAYON.'
  },
  {
    name: 'Rusthon',
    language: 'Rust',
    stargazers_count: 0,
    size: 300,
    pushed_at: '2026-04-20',
    html_url: 'https://github.com/Vlm326/Rusthon',
    description: 'PYTHON-INSPIRED LANGUAGE IMPLEMENTED IN RUST.'
  }
];

let history = [];
let historyIndex = 0;
let github = { repos: fallbackRepos, user: null, events: [] };
let activeSort = 'stars';
let hostInfo = {};

// ============================================================
// TERMINAL COMMANDS
// ============================================================
const commands = {
  help: () => [
    'AVAILABLE COMMANDS',
    '  about         print system profile',
    '  projects      list project registry',
    '  research      list research tree',
    '  achievements  show milestones',
    '  skills        show language matrix',
    '  github        open remote profile',
    '  contact       show communication links',
    '  clear         clear terminal buffer',
    '  whoami        identify current user',
    '  pwd           print working directory',
    '  ls            list directory',
    '  cat           read about.txt',
    '  neofetch      display system summary',
    '  history       show command history',
    '  date          print local time',
    '  uptime        print session uptime',
    '  social        show social handles',
    '  repo NAME     open repository',
    '  theme         display monitor profile',
    '  exit          close session (visual only)'
  ],

about: () => [
    'NAME: VLADISLAV MOROZ',
    'USER: VLM326',
    'ROLE: RUST DEVELOPER / RESEARCHER',
    'FOCUS: SYSTEMS SOFTWARE, STORAGE, LANGUAGE TOOLS'
  ],

  projects: () => {
    if (!github.repos.length) {
      return [
        'LOCAL_SCRIPT  ::  RUST / PYTHON / LUA',
        'NETANALYSIS   ::  RUST / RAYON',
        'RUSTHON       ::  RUST / PARSERS'
      ];
    }
    return sortRepos().slice(0, 6).map((repo) =>
      `${repo.name.toUpperCase()}  ::  ${repo.language || 'MISC'}  ::  ${repo.stargazers_count || 0} STARS  ::  ${locEstimate(repo)} LOC EST.`
    );
  },

  research: () => [
    'papers/',
    '├─ storage-deduplication.md',
    '├─ parallel-indexing.md',
    'algorithms/',
    'benchmarks/',
    'notes/'
  ],

  achievements: () => [
    'ICPC :: QUARTERFINAL STAGE / FIRST YEAR',
    'RUST ANALYZER :: OPEN SOURCE CONTRIBUTOR',
    'SPBU SUMMER SCHOOL :: 3RD PLACE / MARLINE'
  ],

  skills: () => [
    'RUST       ██████████ 95%',
    'LINUX      █████████░ 90%',
    'ALGORITHMS ████████░░ 85%',
    'C          ███████░░░ 75%',
    'PARSERS    ███████░░░ 75%'
  ],

  github: () => {
    window.open('https://github.com/Vlm326', '_blank', 'noopener');
    return ['OPENING HTTPS://GITHUB.COM/VLM326'];
  },

  contact: () => [
    'EMAIL:    morozvv75@gmail.com',
    'TELEGRAM: @VLM326',
    'GITHUB:   github.com/VLM326'
  ],

  whoami: () => ['vlm326'],

  pwd: () => ['/home/vlm326/portfolio'],

  ls: () => [
    'about.txt  projects/  research/  achievements.log  skills.txt  contact.txt'
  ],

  cat: () => [
    'VLADISLAV MOROZ (VLM326) IS A SOFTWARE ENGINEERING STUDENT BUILDING SYSTEMS SOFTWARE WITH RUST.',
    'SEE /research AND /achievements.log FOR CURRENT WORK.'
  ],

  neofetch: () => [
    '        .--.       VLM326@portfolio',
    '       |o_o |      -----------------',
    '       |:_/ |      OS: ' + (hostInfo.os || 'Fedora Linux'),
    '      //   \\ \\     KERNEL: ' + (hostInfo.kernel || '6.x'),
    '     (|     | )    HOST: ' + (hostInfo.hostname || 'portfolio'),
    '     /\\_   _/\\     SHELL: zsh',
    '     \\___)=(___/    MEM: ' + (hostInfo.mem || '--') + '   UPTIME: ' + uptime()
  ],

  history: () => {
    return history.map((command, index) =>
      ` ${String(index + 1).padStart(2, '0')}  ${command}`
    );
  },

  date: () => [new Date().toString()],

  uptime: () => [uptime()],

  social: () => [
    'GITHUB   github.com/VLM326',
    'TELEGRAM t.me/VLM326',
    'MAIL     morozvv75@gmail.com'
  ],

  theme: (arg) => {
    const theme = arg && themes.includes(arg)
      ? arg
      : themes[(themes.indexOf(currentTheme()) + 1) % themes.length];
    applyTheme(theme);
    return [
      `DISPLAY: ${theme.toUpperCase()} PHOSPHOR`,
      'SCANLINES: ENABLED',
      'REFRESH: 60HZ',
      'PROFILE: VT100 / CRT'
    ];
  },

  exit: () => [
    'SESSION CANNOT BE CLOSED FROM REMOTE TTY.',
    'TYPE `help` TO CONTINUE.'
  ]
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const themes = ['green', 'amber', 'white'];

function applyTheme(name) {
  const theme = themes.includes(name) ? name : 'green';
  document.documentElement.classList.remove('theme-amber', 'theme-white');
  if (theme === 'amber') document.documentElement.classList.add('theme-amber');
  if (theme === 'white') document.documentElement.classList.add('theme-white');
  localStorage.setItem('vlm326-theme', theme);
  return theme;
}

function currentTheme() {
  const saved = localStorage.getItem('vlm326-theme');
  return themes.includes(saved) ? saved : 'green';
}

function uptime() {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `000:${h}:${m}:${s}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function locEstimate(repo) {
  return Math.max(1, Math.round((repo.loc_estimate || repo.size * 100 || 0) / 40));
}

function relativeTime(date) {
  if (!date) return '--';
  const hours = Math.max(1, Math.floor((Date.now() - new Date(date)) / 3600000));
  return hours < 24
    ? `${hours}H AGO`
    : `${Math.floor(hours / 24)}D AGO`;
}

function sortRepos() {
  return [...github.repos].sort((a, b) => {
    if (activeSort === 'updated') {
      return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
    }
    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
  });
}

// ============================================================
// TERMINAL I/O
// ============================================================
function print(lines, command = '') {
  if (command) {
    output.insertAdjacentHTML('beforeend',
      `<div class="terminal-separator" aria-hidden="true"></div>` +
      `<p class="terminal-command">` +
        `<span class="dim">VLM326@portfolio:~$</span> ${escapeHtml(command)}` +
      `</p>`
    );
  }

  lines.forEach((line) => {
    const highlighted = escapeHtml(line)
      .replace(/(ONLINE|ACTIVE|STABLE|BUILDING)/g,
        '<span class="live-value">$1</span>');
    output.insertAdjacentHTML('beforeend', `<p>${highlighted}</p>`);
  });

  output.scrollTop = output.scrollHeight;
}

function runCommand(raw) {
  const command = raw.trim().toLowerCase();
  if (!command) return;

  history.push(raw.trim());
  historyIndex = history.length;

  const [name, argument] = command.split(/\s+/, 2);

  if (name === 'clear') {
    output.innerHTML = '';
    return;
  }

  if (name === 'repo' && argument) {
    const repo = github.repos.find(
      (item) => item.name.toLowerCase() === argument
    );
    if (repo) {
      print([`OPENING ${repo.html_url}`], raw);
      window.open(repo.html_url, '_blank', 'noopener');
    } else {
      print([`REPOSITORY NOT FOUND: ${argument}`], raw);
    }
    return;
  }

  if (commands[name]) {
    print(commands[name](argument), raw);
  } else {
    print([
      `command not found: ${name}`,
      "type 'help' for available commands"
    ], raw);
  }
}

// ============================================================
// EVENT LISTENERS — TERMINAL INPUT
// ============================================================
$('#terminalForm').addEventListener('submit', (event) => {
  event.preventDefault();
  runCommand(input.value);
  input.value = '';
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex] || '';
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    input.value = history[historyIndex] || '';
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    const match = Object.keys(commands).find(
      (command) => command.startsWith(input.value.toLowerCase())
    );
    if (match) input.value = match;
  }
});

$('#terminal').addEventListener('click', () => input.focus());

const fakeCursor = $('.fake-cursor');

function updateCursor() {
  fakeCursor.style.left = `calc(${input.offsetLeft}px + ${input.value.length + 0.5}ch)`;
}

input.addEventListener('input', updateCursor);
input.addEventListener('keyup', updateCursor);
updateCursor();

// ============================================================
// EVENT LISTENERS — UI CONTROLS
// ============================================================
document.querySelectorAll('.tree-row--folder').forEach((folder) => {
  folder.addEventListener('click', () => {
    const expanded = folder.getAttribute('aria-expanded') === 'true';
    folder.setAttribute('aria-expanded', String(!expanded));
    folder.textContent = folder.textContent.replace(
      /^[−+]/, expanded ? '+' : '−'
    );
  });
});

document.querySelectorAll('.sort-button').forEach((button) => {
  button.addEventListener('click', () => {
    activeSort = button.dataset.sort;
    document.querySelectorAll('.sort-button').forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });
    renderProjects();
  });
});

// ============================================================
// CLOCKS & UPTIME
// ============================================================
function updateClocks() {
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('en-GB', { timeZone: 'Europe/Moscow' });
  $('#clockUtc').textContent = now.toLocaleTimeString('en-GB', { timeZone: 'UTC' });
  $('#clockTokyo').textContent = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Tokyo' });
  $('#uptime').textContent = uptime();
  $('#footerUptime').textContent = uptime().slice(4);
}

setInterval(updateClocks, 1000);
updateClocks();

// ============================================================
// GITHUB API — FETCH & CACHE
// ============================================================
async function fetchGithub() {
  // Try cached data first (15 min TTL)
  try {
    const stored = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (stored && Date.now() - stored.timestamp < 15 * 60 * 1000) {
      github = stored.data;
      renderGithub();
      fetchEvents();
      return;
    }
  } catch {
    /* stale cache is disposable */
  }

  // Try our own backend API
  try {
    const [userResponse, reposResponse] = await Promise.all([
      fetch('/api/main').then((r) => r.ok ? r.json() : Promise.reject()),
      fetch('/api/repos').then((r) => r.ok ? r.json() : Promise.reject())
    ]);

    github = {
      user: userResponse,
      repos: reposResponse.sort(
        (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)
      ),
      events: []
    };

    localStorage.setItem(cacheKey,
      JSON.stringify({ timestamp: Date.now(), data: github })
    );
    renderGithub();
    fetchEvents();
    return;
  } catch {
    /* backend unavailable, try fallback */
  }

  // Fallback: hit GitHub API directly
  try {
    const [user, repos] = await Promise.all([
      fetch('https://api.github.com/users/Vlm326').then((r) => r.json()),
      fetch('https://api.github.com/users/Vlm326/repos?sort=pushed')
        .then((r) => r.json())
    ]);
    github = { user, repos, events: [] };
    renderGithub();
    fetchEvents();
  } catch {
    $('#apiState').textContent = 'OFFLINE / LOCAL';
  }
}

// ============================================================
// GITHUB API — EVENTS
// ============================================================
async function fetchEvents() {
  try {
    const response = await fetch('/api/events');
    github.events = response.ok ? await response.json() : [];
    $('#contributions').textContent = github.events.length
      ? `${github.events.length} EVENTS`
      : 'PUBLIC FEED';
    $('#monitorActivity').textContent = github.events.length
      ? 'ACTIVE'
      : 'QUIET';
    renderActivity();
  } catch {
    $('#contributions').textContent = 'PUBLIC FEED';
  }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderGithub() {
  if (!github.user) return;

  $('#repoCount').textContent = github.user.public_repos ?? github.repos.length;
  $('#projectCount').textContent = github.repos.length;
  $('#followers').textContent = github.user.followers ?? '--';
  $('#gists').textContent = github.user.public_gists ?? '--';
  $('#apiState').textContent = 'CACHED / LIVE';
  $('#monitorRepos').textContent = github.user.public_repos ?? github.repos.length;
  $('#monitorCache').textContent = 'CACHED / LIVE';
  $('#monitorSync').textContent = new Date().toLocaleTimeString('en-GB');

  const latest = [...github.repos]
    .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))[0];

  $('#lastCommit').textContent = latest
    ? `${latest.name.toUpperCase().slice(0, 14)} ${relativeTime(latest.pushed_at)}`
    : '--';

  renderProjects();
}

function renderProjects() {
  const grid = $('#projectGrid');
  if (!github.repos.length) return;

  grid.innerHTML = sortRepos().slice(0, 6).map((repo) => `
    <article class="project-card">
      <div class="project-card__top">
        <span>${escapeHtml(repo.name.toUpperCase())}</span>
        <span class="live-value">${repo.stargazers_count || 0}★</span>
      </div>
      <p>${escapeHtml(
        (repo.description || 'PUBLIC REPOSITORY / SOURCE AVAILABLE ON GITHUB.').toUpperCase()
      )}</p>
      <div class="project-card__tags">
        ${escapeHtml(repo.language || 'MISC')} ·
        ${repo.stargazers_count || 0} STARS ·
        ${locEstimate(repo)} LOC EST.
      </div>
      <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
        [ OPEN REPO ↗ ]
      </a>
    </article>
  `).join('');
}

function renderActivity() {
  if (!github.events?.length) return;

  $('#activityFeed').innerHTML = github.events.slice(0, 4).map((event) => `
    <p>
      <time>[ ${relativeTime(event.created_at)} ]</time>
      ${escapeHtml(
        (event.type || 'EVENT')
          .replace('Event', '')
          .replace(/([A-Z])/g, ' $1')
          .toUpperCase()
      )}
      <b>${escapeHtml(event.repo?.name || 'GITHUB')}</b>
    </p>
  `).join('');
}

// ============================================================
// SYSTEM INFO — HOST PANEL
// ============================================================
function formatBytes(bytes) {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 10 ? `${Math.round(gb)}GB` : `${gb.toFixed(1)}GB`;
}

async function fetchSystemInfo() {
  const sync = $('#hostSync');
  try {
    const response = await fetch('/api/system_info');
    if (!response.ok) throw new Error('bad status');
    const info = await response.json();

    const total = Number(info.total_memory) || 0;
    const used = Number(info.used_memory) || 0;
    const totalSwap = Number(info.total_swap) || 0;
    const usedSwap = Number(info.used_swap) || 0;

    hostInfo = {
      os: [info.os_name, info.os_version].filter(Boolean).join(' ') || 'Linux',
      kernel: info.kernel_version || 'unknown',
      hostname: info.hostname || 'portfolio',
      mem: total ? `${formatBytes(used)} / ${formatBytes(total)}` : '--'
    };

    $('#hostOs').textContent = hostInfo.os;
    $('#hostKernel').textContent = hostInfo.kernel;
    $('#hostName').textContent = hostInfo.hostname;
    $('#hostMem').textContent = hostInfo.mem;
    $('#hostSwap').textContent = totalSwap ? `${formatBytes(usedSwap)} / ${formatBytes(totalSwap)}` : '--';
    $('#memBar').style.width = total ? `${Math.min(100, (used / total) * 100)}%` : '0%';

    sync.classList.remove('dim');
    sync.classList.add('live-value');
    sync.textContent = 'LINKED';
  } catch {
    hostInfo = {};
    sync.classList.add('dim');
    sync.classList.remove('live-value');
    sync.textContent = 'OFFLINE';
    $('#hostOs').textContent = '--';
    $('#hostKernel').textContent = '--';
    $('#hostName').textContent = '--';
    $('#hostMem').textContent = '--';
    $('#hostSwap').textContent = '--';
  }
}

// ============================================================
// SCROLL REVEAL
// ============================================================
if (
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(
    '.hero, .menu, .dashboard-grid, .section-block, .terminal-window, .footer'
  ).forEach((target) => {
    target.classList.add('reveal');
    observer.observe(target);
  });
}

// ============================================================
// INIT
// ============================================================
renderProjects();
fetchGithub();
fetchSystemInfo();
setInterval(fetchSystemInfo, 60000);
applyTheme(currentTheme());

// ============================================================
// BOOT SEQUENCE
// ============================================================
setTimeout(() => {
  $('#bootLine').textContent = 'SIGNAL LOCKED // SYSTEM READY';
  setTimeout(() => {
    $('#boot').classList.add('is-hidden');
  }, 500);
}, 2100);
