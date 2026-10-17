// ============================================================
// HELPERS
// ============================================================
const $ = (selector) => document.querySelector(selector);
const preferences = {
  getItem(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ }
  }
};

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
    description: 'Lua script validation and execution through a Rust sandbox service.'
  },
  {
    name: 'NetAnalysys',
    language: 'Rust',
    stargazers_count: 0,
    size: 510,
    pushed_at: '2026-05-15',
    html_url: 'https://github.com/Vlm326/NetAnalysys',
    description: 'Graph analysis with BFS, strongly connected components, and landmark indexing.'
  },
  {
    name: 'Rusthon',
    language: 'Rust',
    stargazers_count: 0,
    size: 300,
    pushed_at: '2026-04-20',
    html_url: 'https://github.com/Vlm326/Rusthon',
    description: 'A Python-inspired language implemented in Rust.'
  }
];

let history = [];
let historyIndex = 0;
let github = { repos: fallbackRepos, user: null, events: [] };
let activeSort = 'stars';
let hostInfo = {};
let currentLanguage = 'en';
let githubStatus = 'syncing';
let githubLastChecked = null;

const translations = {
  en: {
    'boot.skip': '[ SKIP INTRO ]',
    'effects.on': '[ EFFECTS: ON ]',
    'effects.off': '[ EFFECTS: OFF ]',
    'effects.label': 'Visual effects',
    'projects.intro': 'Selected projects and open-source contributions. Open a card to learn about the task and implementation.',
    'projects.catalog': 'GitHub repository catalog',
    'projects.selection': 'HAND-PICKED / 04',
    'projects.details': '[ PROJECT DETAILS + ]',
    'project.close': '[ CLOSE × ]',
    'project.task': 'The task',
    'project.work': 'My contribution',
    'project.implementation': 'How it works',
    'project.source': '[ CODE / PR ↗ ]',
    'project.catalogNote': 'This repository is part of my GitHub catalog. The README contains its documentation and implementation details.',

    'page.title': 'Vladislav Moroz (VLM326) — Rust Portfolio',
    'boot.aria': 'System boot sequence', 'boot.loading': 'LOADING...', 'boot.complete': 'SIGNAL LOCKED // SYSTEM READY',
    'topbar.site': 'PERSONAL SITE', 'topbar.online': 'ONLINE', 'topbar.legacy': 'LEGACY VERSION',
    'topbar.legacyFooter': 'LEGACY VERSION ↗', 'topbar.brand': 'Vlm326 portfolio',
    'language.toggleLabel': 'Switch to Russian',
    'hero.eyebrow': '[ ABOUT / USER 326 ]', 'hero.name': 'Vladislav Moroz — VLM326',
    'hero.role': 'SOFTWARE ENGINEERING STUDENT <span>/</span> RUST <span>/</span> SYSTEMS',
    'hero.copy': 'I study software engineering at SPbU and write Rust. My interests include algorithms, data deduplication, hashing, and efficient data structures.',
    'hero.projects': '[ VIEW PROJECTS ]', 'hero.github': '[ GITHUB ↗ ]', 'hero.cv': '[ CV ▾ ]',
    'hero.cvRussian': 'RUSSIAN CV ↗', 'hero.cvEnglish': 'ENGLISH CV ↗',
    'stats.aria': 'GitHub statistics', 'stats.title': 'GITHUB', 'stats.connection': 'CONNECTION',
    'stats.repositories': 'REPOSITORIES', 'stats.followers': 'FOLLOWERS', 'stats.gists': 'PUBLIC GISTS',
    'stats.lastCheck': 'LAST CHECK', 'stats.apiCache': 'API CACHE:',
    'menu.aria': 'Terminal navigation', 'menu.title': 'COMMAND INDEX', 'menu.about': 'ABOUT', 'menu.projects': 'PROJECTS', 'menu.skills': 'SKILLS',
    'menu.activity': 'ACTIVITY', 'menu.host': 'HOST', 'menu.experience': 'EXPERIENCE', 'menu.contact': 'CONTACT', 'menu.terminal': 'TERMINAL',
    'profile.title': '[01] PROFILE', 'profile.hostname': 'HOSTNAME', 'profile.hostnameValue': 'portfolio',
    'profile.user': 'USER', 'profile.shell': 'SHELL', 'profile.os': 'OS', 'profile.editor': 'EDITOR',
    'profile.location': 'LOCATION', 'profile.locationValue': 'Saint Petersburg', 'profile.skills': 'SKILLS / TOOLS',
    'monitor.title': '[02] ACTIVITY', 'monitor.githubActivity': 'GITHUB ACTIVITY', 'monitor.lastCommit': 'LAST PUSH',
    'monitor.contributions': 'CONTRIBUTIONS', 'monitor.uptime': 'UPTIME', 'monitor.remote': 'REMOTE: github.com/Vlm326',
    'about.title': '[03] ABOUT.TXT',
    'about.copy': 'I am Vladislav Moroz, a software engineering student at SPbU. I build Rust tools and contribute to open source. I enjoy understanding how algorithms work and putting them into practice.',
    'about.exploring': 'Currently exploring:', 'about.topic1': 'Operating systems, memory management, and system programming', 'about.topic2': 'Data deduplication, hash functions, and similarity search',
    'projects.title': '[04] SELECTED PROJECTS', 'projects.repositories': 'REPOSITORIES', 'projects.found': 'FOUND',
    'projects.sorting': 'Project sorting',
    'projects.sortStars': '[★ STARS]', 'projects.sortUpdated': '[↻ UPDATED]', 'projects.openRepo': '[ OPEN REPO ↗ ]',
    'projects.descriptionFallback': 'A public repository. Source code and documentation are available on GitHub.',
    'projects.localScript': 'A team project for checking and running Lua scripts in a Rust sandbox service.',
    'projects.netAnalysis': 'Graph analysis in Rust: breadth-first search, strongly connected components, and landmark indexing.',
    'projects.rusthon': 'A Python-inspired language built in Rust, from a lexer and parser to an AST interpreter.',
    'activity.title': '[05] ACTIVITY LOG', 'activity.feed': 'GITHUB FEED',
    'activity.waiting': 'WAITING FOR PUBLIC EVENTS...', 'activity.empty': 'NO PUBLIC EVENTS AVAILABLE.',
    'host.title': '[06] HOST SYSTEM', 'host.os': 'OS', 'host.kernel': 'KERNEL', 'host.hostname': 'HOSTNAME',
    'host.memory': 'MEMORY', 'host.swap': 'SWAP', 'host.info': 'HOST INFO', 'host.memoryUsage': 'Memory usage',
    'experience.title': '[07] MORE WORK & OPEN SOURCE', 'experience.selected': 'SELECTED PROJECTS', 'experience.contributor': '[ CONTRIBUTOR ]',
    'experience.marline': 'Contributed an in-memory posting-list index and Jaccard similarity operations to this Rust deduplication project. The PR was accepted upstream.',
    'experience.merged': '[ MERGED PR ]',
    'experience.rustAnalyzer': 'Added E0121 diagnostics for type-inference placeholders in unsupported contexts, together with tests.',
    'experience.prDetails': '[ PR / DETAILS ↗ ]', 'experience.personalProject': '[ PERSONAL PROJECT ]',
    'experience.corrode': 'A Rust tool that gathers GitHub PR context, runs LLM-assisted reviews, and stores review state in SQLite.',
    'experience.teamProject': '[ TEAM PROJECT ]',
    'experience.localScript': 'Worked on the Rust sandbox service and the pipeline for checking and executing Lua scripts.',
    'experience.openRepo': '[ OPEN REPO ↗ ]',
    'contact.title': '[08] CONTACT', 'contact.response': 'TYPICAL RESPONSE: ~24H', 'contact.telegram': 'TELEGRAM',
    'contact.open': '[ OPEN ↗ ]', 'contact.email': 'EMAIL // DIRECT', 'contact.writeMail': '[ WRITE EMAIL ↗ ]',
    'terminal.title': '[09] TERMINAL', 'terminal.helpHint': "TYPE 'HELP' FOR COMMANDS", 'terminal.welcome': 'VLM326 TERMINAL v1.0.26',
    'terminal.ready': 'TERMINAL READY.', 'terminal.helpPrompt': "TYPE 'HELP' TO LIST AVAILABLE COMMANDS.",
    'terminal.prompt': 'VLM326@portfolio:~$', 'terminal.inputLabel': 'Terminal command',
    'footer.ready': 'SYSTEM READY', 'footer.connected': 'CONNECTED', 'footer.contact': 'CONTACT ↗',
    'status.syncing': 'SYNCING', 'status.publicFeed': 'PUBLIC FEED', 'status.cold': 'COLD', 'status.waiting': 'WAITING',
    'status.linking': 'LINKING ...', 'status.linked': 'LINKED', 'status.offline': 'OFFLINE', 'status.offlineLocal': 'OFFLINE / LOCAL',
    'status.cachedLive': 'CACHED / LIVE', 'status.active': 'ACTIVE', 'status.quiet': 'QUIET',
    'status.eventsCount': '{count} EVENTS',
    'time.hoursAgo': '{value}H AGO', 'time.daysAgo': '{value}D AGO',
    'events.push': 'PUSHED TO', 'events.create': 'CREATED', 'events.pullRequest': 'UPDATED PULL REQUEST IN',
    'events.review': 'REVIEWED PULL REQUEST IN', 'events.issues': 'UPDATED ISSUE IN', 'events.comment': 'COMMENTED IN',
    'events.watch': 'STARRED', 'events.fork': 'FORKED', 'events.release': 'PUBLISHED RELEASE IN',
    'events.delete': 'DELETED CONTENT IN', 'events.public': 'MADE PUBLIC', 'events.generic': 'ACTIVITY IN',
    'command.help': [
      'AVAILABLE COMMANDS', '  help         list commands', '  about        show profile', '  projects     list repositories',
      '  research     list research topics', '  achievements show selected work', '  skills       show skills and tools',
      '  github       open GitHub profile', '  contact      show contact links', '  clear        clear terminal output',
      '  whoami       identify user', '  pwd          print working directory', '  ls           list directory',
      '  cat          show profile summary', '  neofetch     display system summary', '  history      show command history',
      '  date         print local date and time', '  uptime       print session uptime', '  social       show social links',
      '  repo NAME    open a repository', '  theme        cycle display theme', '  exit         close session (visual only)'
    ],
    'command.about': ["I am Vladislav Moroz.", "Software engineering student at SPbU.", "I write Rust and explore algorithms, deduplication, and hashing."],
    'command.projectsEmpty': ['NO REPOSITORIES AVAILABLE.'],
    'command.research': ["Currently exploring:", "  Operating systems, memory management, and system programming", "  Data deduplication and hash functions", "  Similarity search and indexing"],
    'command.achievements': ['MARLINE :: POSTING-LIST INDEX / UPSTREAM PR ACCEPTED', 'RUST-ANALYZER :: E0121 DIAGNOSTIC / PR MERGED', 'CORRODE :: RUST + SQLITE + GITHUB API'],
    'command.skills': ['PROGRAMMING  Rust, C', 'SYSTEMS      Linux, Bash, Docker', 'RUST TOOLS   Cargo, Tokio, async programming', 'DATA         PostgreSQL, Git'],
    'command.github': ['OPENING HTTPS://GITHUB.COM/VLM326'],
    'command.contact': ['EMAIL:    morozvv75@gmail.com', 'TELEGRAM: @VLM326', 'GITHUB:   github.com/VLM326'],
    'command.whoami': ['vlm326'], 'command.pwd': ['/home/vlm326/portfolio'],
    'command.ls': ['about.txt  projects/  research/  achievements.log  skills.txt  contact.txt'],
    'command.cat': ["Vladislav Moroz — software engineering student at SPbU.", "Rust, algorithms, deduplication, hashing, and open source."],
    'command.neofetch': ['        .--.       VLM326@portfolio', '       |o_o |      -----------------', '       |:_/ |      OS: {os}', '      //   \\\\     KERNEL: {kernel}', '     (|     | )    HOST: {hostname}', '     /\\_   _/\\     SHELL: zsh', '     \\___)=(___/    MEM: {mem}   UPTIME: {uptime}'],
    'command.historyEmpty': ['NO COMMANDS IN HISTORY.'], 'command.repoMissing': 'REPOSITORY NOT FOUND: {name}',
    'command.unknown': 'COMMAND NOT FOUND: {name}', 'command.unknownHint': "TYPE 'HELP' FOR AVAILABLE COMMANDS.",
    'command.theme': ['DISPLAY: {theme} PHOSPHOR', 'Motion and scanlines: use the effects toggle.', 'REFRESH: 60HZ', 'PROFILE: VT100 / CRT'],
    'command.exit': ['SESSION CANNOT BE CLOSED FROM REMOTE TTY.', 'TYPE `help` TO CONTINUE.']
  },
  ru: {
    'boot.skip': '[ ПРОПУСТИТЬ ]',
    'effects.on': '[ ЭФФЕКТЫ: ВКЛ. ]',
    'effects.off': '[ ЭФФЕКТЫ: ВЫКЛ. ]',
    'effects.label': 'Визуальные эффекты',
    'projects.intro': 'Избранные проекты и вклад в open source. Нажми на карточку, чтобы узнать о задаче и реализации.',
    'projects.catalog': 'Каталог репозиториев GitHub',
    'projects.selection': 'ВЫБРАНО ВРУЧНУЮ / 04',
    'projects.details': '[ О ПРОЕКТЕ + ]',
    'project.close': '[ ЗАКРЫТЬ × ]',
    'project.task': 'Задача',
    'project.work': 'Мой вклад',
    'project.implementation': 'Как устроено',
    'project.source': '[ КОД / PR ↗ ]',
    'project.catalogNote': 'Этот репозиторий входит в мой GitHub-каталог. Документация и детали реализации находятся в README.',

    'page.title': 'Владислав Мороз (VLM326) — Портфолио на Rust',
    'boot.aria': 'Загрузка системы', 'boot.loading': 'ЗАГРУЗКА...', 'boot.complete': 'СИГНАЛ ЕСТЬ // СИСТЕМА ГОТОВА',
    'topbar.site': 'ЛИЧНЫЙ САЙТ', 'topbar.online': 'В СЕТИ', 'topbar.legacy': 'СТАРАЯ ВЕРСИЯ',
    'topbar.legacyFooter': 'СТАРАЯ ВЕРСИЯ ↗', 'topbar.brand': 'Портфолио Vlm326',
    'language.toggleLabel': 'Переключить на английский',
    'hero.eyebrow': '[ ОБО МНЕ / ПОЛЬЗОВАТЕЛЬ 326 ]', 'hero.name': 'Владислав Мороз — VLM326',
    'hero.role': 'СТУДЕНТ ПРОГРАММНОЙ ИНЖЕНЕРИИ <span>/</span> RUST <span>/</span> СИСТЕМЫ',
    'hero.copy': 'Учусь на программной инженерии в СПбГУ и пишу на Rust. Интересуюсь алгоритмами, дедупликацией данных, хешированием и эффективными структурами данных.',
    'hero.projects': '[ СМОТРЕТЬ ПРОЕКТЫ ]', 'hero.github': '[ GITHUB ↗ ]', 'hero.cv': '[ РЕЗЮМЕ ▾ ]',
    'hero.cvRussian': 'РЕЗЮМЕ НА РУССКОМ ↗', 'hero.cvEnglish': 'РЕЗЮМЕ НА АНГЛИЙСКОМ ↗',
    'stats.aria': 'Статистика GitHub', 'stats.title': 'GITHUB', 'stats.connection': 'СОЕДИНЕНИЕ',
    'stats.repositories': 'РЕПОЗИТОРИИ', 'stats.followers': 'ПОДПИСЧИКИ', 'stats.gists': 'ПУБЛИЧНЫЕ GIST',
    'stats.lastCheck': 'ПОСЛЕДНЯЯ ПРОВЕРКА', 'stats.apiCache': 'КЕШ API:',
    'menu.aria': 'Навигация по терминалу', 'menu.title': 'НАВИГАЦИЯ', 'menu.about': 'ОБО МНЕ', 'menu.projects': 'ПРОЕКТЫ', 'menu.skills': 'НАВЫКИ',
    'menu.activity': 'АКТИВНОСТЬ', 'menu.host': 'СЕРВЕР', 'menu.experience': 'ПРОЕКТЫ И ВКЛАД', 'menu.contact': 'КОНТАКТЫ', 'menu.terminal': 'ТЕРМИНАЛ',
    'profile.title': '[01] ПРОФИЛЬ', 'profile.hostname': 'ИМЯ УЗЛА', 'profile.hostnameValue': 'портфолио',
    'profile.user': 'ПОЛЬЗОВАТЕЛЬ', 'profile.shell': 'ОБОЛОЧКА', 'profile.os': 'ОС', 'profile.editor': 'РЕДАКТОР',
    'profile.location': 'ГОРОД', 'profile.locationValue': 'Санкт-Петербург', 'profile.skills': 'НАВЫКИ / ИНСТРУМЕНТЫ',
    'monitor.title': '[02] АКТИВНОСТЬ', 'monitor.githubActivity': 'АКТИВНОСТЬ GITHUB', 'monitor.lastCommit': 'ПОСЛЕДНИЙ PUSH',
    'monitor.contributions': 'СОБЫТИЯ', 'monitor.uptime': 'ВРЕМЯ РАБОТЫ', 'monitor.remote': 'УДАЛЁННЫЙ УЗЕЛ: github.com/Vlm326',
    'about.title': '[03] ОБО МНЕ.TXT',
    'about.copy': 'Я Владислав Мороз, студент программной инженерии СПбГУ. Разрабатываю инструменты на Rust и участвую в open source. Мне интересно разбираться в устройстве алгоритмов и применять их на практике.',
    'about.exploring': 'Сейчас изучаю:', 'about.topic1': 'Операционные системы, управление памятью и системное программирование', 'about.topic2': 'Дедупликацию данных, хеш-функции и поиск похожих объектов',
    'projects.title': '[04] ИЗБРАННЫЕ ПРОЕКТЫ', 'projects.repositories': 'РЕПОЗИТОРИИ', 'projects.found': 'НАЙДЕНО',
    'projects.sorting': 'Сортировка проектов',
    'projects.sortStars': '[★ ЗВЁЗДЫ]', 'projects.sortUpdated': '[↻ ОБНОВЛЕНИЕ]', 'projects.openRepo': '[ ОТКРЫТЬ РЕПОЗИТОРИЙ ↗ ]',
    'projects.descriptionFallback': 'Публичный репозиторий. Исходный код и документация доступны на GitHub.',
    'projects.localScript': 'Командный проект для проверки и выполнения Lua-скриптов в сервисе-песочнице на Rust.',
    'projects.netAnalysis': 'Анализ графов на Rust: поиск в ширину, сильно связные компоненты и индексация по ориентирам.',
    'projects.rusthon': 'Язык в духе Python, написанный на Rust: от лексера и парсера до интерпретатора AST.',
    'activity.title': '[05] ЛЕНТА АКТИВНОСТИ', 'activity.feed': 'ЛЕНТА GITHUB',
    'activity.waiting': 'ОЖИДАНИЕ ПУБЛИЧНЫХ СОБЫТИЙ...', 'activity.empty': 'НЕТ ПУБЛИЧНЫХ СОБЫТИЙ.',
    'host.title': '[06] СИСТЕМА СЕРВЕРА', 'host.os': 'ОС', 'host.kernel': 'ЯДРО', 'host.hostname': 'ИМЯ УЗЛА',
    'host.memory': 'ПАМЯТЬ', 'host.swap': 'SWAP', 'host.info': 'СВЕДЕНИЯ О СЕРВЕРЕ', 'host.memoryUsage': 'Использование памяти',
    'experience.title': '[07] ДРУГИЕ РАБОТЫ И OPEN SOURCE', 'experience.selected': 'ОСНОВНЫЕ РАБОТЫ', 'experience.contributor': '[ УЧАСТНИК ПРОЕКТА ]',
    'experience.marline': 'Добавил индекс в памяти на основе posting lists и операции сходства Жаккара в Rust-проект по дедупликации. PR принят в основной проект.',
    'experience.merged': '[ PR ВМЕРЖЕН ]',
    'experience.rustAnalyzer': 'Добавил диагностику E0121 для плейсхолдеров вывода типов в недопустимых контекстах и тесты для неё.',
    'experience.prDetails': '[ PR / ПОДРОБНОСТИ ↗ ]', 'experience.personalProject': '[ ЛИЧНЫЙ ПРОЕКТ ]',
    'experience.corrode': 'Инструмент на Rust: собирает контекст GitHub PR, запускает ревью с помощью LLM и хранит состояние в SQLite.',
    'experience.teamProject': '[ КОМАНДНЫЙ ПРОЕКТ ]',
    'experience.localScript': 'Работал над сервисом-песочницей на Rust и конвейером проверки и выполнения Lua-скриптов.',
    'experience.openRepo': '[ ОТКРЫТЬ РЕПОЗИТОРИЙ ↗ ]',
    'contact.title': '[08] КОНТАКТЫ', 'contact.response': 'ОБЫЧНО ОТВЕЧАЮ: ~24 Ч', 'contact.telegram': 'TELEGRAM',
    'contact.open': '[ ОТКРЫТЬ ↗ ]', 'contact.email': 'EMAIL // НАПРЯМУЮ', 'contact.writeMail': '[ НАПИСАТЬ ↗ ]',
    'terminal.title': '[09] ТЕРМИНАЛ', 'terminal.helpHint': "ВВЕДИТЕ 'HELP', ЧТОБЫ УВИДЕТЬ КОМАНДЫ", 'terminal.welcome': 'ТЕРМИНАЛ VLM326 v1.0.26',
    'terminal.ready': 'ТЕРМИНАЛ ГОТОВ.', 'terminal.helpPrompt': "ВВЕДИТЕ 'HELP', ЧТОБЫ УВИДЕТЬ СПИСОК КОМАНД.",
    'terminal.prompt': 'VLM326@portfolio:~$', 'terminal.inputLabel': 'Команда терминала',
    'footer.ready': 'СИСТЕМА ГОТОВА', 'footer.connected': 'СОЕДИНЕНИЕ УСТАНОВЛЕНО', 'footer.contact': 'КОНТАКТЫ ↗',
    'status.syncing': 'СИНХРОНИЗАЦИЯ', 'status.publicFeed': 'ПУБЛИЧНАЯ ЛЕНТА', 'status.cold': 'НЕ ЗАГРУЖЕН', 'status.waiting': 'ОЖИДАНИЕ',
    'status.linking': 'СОЕДИНЕНИЕ ...', 'status.linked': 'ПОДКЛЮЧЕНО', 'status.offline': 'НЕТ СВЯЗИ', 'status.offlineLocal': 'НЕТ СВЯЗИ / ЛОКАЛЬНЫЕ ДАННЫЕ',
    'status.cachedLive': 'КЕШ / АКТУАЛЬНЫЕ ДАННЫЕ', 'status.active': 'АКТИВНО', 'status.quiet': 'НЕТ СОБЫТИЙ',
    'status.eventsCount': 'СОБЫТИЙ: {count}',
    'time.hoursAgo': '{value} Ч НАЗАД', 'time.daysAgo': '{value} Д НАЗАД',
    'events.push': 'ОТПРАВИЛ ИЗМЕНЕНИЯ В', 'events.create': 'СОЗДАЛ', 'events.pullRequest': 'ОБНОВИЛ PULL REQUEST В',
    'events.review': 'ПРОВЁЛ РЕВЬЮ PULL REQUEST В', 'events.issues': 'ОБНОВИЛ ISSUE В', 'events.comment': 'ОСТАВИЛ КОММЕНТАРИЙ В',
    'events.watch': 'ДОБАВИЛ В ИЗБРАННОЕ', 'events.fork': 'СОЗДАЛ ФОРК', 'events.release': 'ОПУБЛИКОВАЛ РЕЛИЗ В',
    'events.delete': 'УДАЛИЛ ДАННЫЕ ИЗ', 'events.public': 'СДЕЛАЛ ПУБЛИЧНЫМ', 'events.generic': 'АКТИВНОСТЬ В',
    'command.help': [
      'ДОСТУПНЫЕ КОМАНДЫ', '  help         список команд', '  about        обо мне', '  projects     список репозиториев',
      '  research     области интересов', '  achievements избранные проекты', '  skills       навыки и инструменты',
      '  github       открыть профиль GitHub', '  contact      контакты', '  clear        очистить вывод',
      '  whoami       имя пользователя', '  pwd          текущий каталог', '  ls           список файлов',
      '  cat          кратко обо мне', '  neofetch     сведения о системе', '  history      история команд',
      '  date         дата и время', '  uptime       время с начала сессии', '  social       ссылки на профили',
      '  repo NAME    открыть репозиторий', '  theme        сменить цветовую тему', '  exit         завершить сессию (только визуально)'
    ],
    'command.about': ["Я Владислав Мороз.", "Студент программной инженерии СПбГУ.", "Пишу на Rust, изучаю алгоритмы, дедупликацию и хеширование."],
    'command.projectsEmpty': ['НЕТ ДОСТУПНЫХ РЕПОЗИТОРИЕВ.'],
    'command.research': ["Сейчас изучаю:", "  Операционные системы, управление памятью и системное программирование", "  Дедупликацию данных и хеш-функции", "  Поиск похожих объектов и индексацию"],
    'command.achievements': ['MARLINE :: ИНДЕКС НА СПИСКАХ ПОЗИЦИЙ / PR ПРИНЯТ', 'RUST-ANALYZER :: ДИАГНОСТИКА E0121 / PR ВМЕРЖЕН', 'CORRODE :: RUST + SQLITE + GITHUB API'],
    'command.skills': ['ЯЗЫКИ       Rust, C', 'СИСТЕМЫ     Linux, Bash, Docker', 'ИНСТРУМЕНТЫ Cargo, Tokio, асинхронность', 'ДАННЫЕ      PostgreSQL, Git'],
    'command.github': ['ОТКРЫВАЮ HTTPS://GITHUB.COM/VLM326'],
    'command.contact': ['EMAIL:    morozvv75@gmail.com', 'TELEGRAM: @VLM326', 'GITHUB:   github.com/VLM326'],
    'command.whoami': ['vlm326'], 'command.pwd': ['/home/vlm326/portfolio'],
    'command.ls': ['about.txt  projects/  research/  achievements.log  skills.txt  contact.txt'],
    'command.cat': ["Владислав Мороз — студент программной инженерии СПбГУ.", "Rust, алгоритмы, дедупликация, хеширование и open source."],
    'command.neofetch': ['        .--.       VLM326@portfolio', '       |o_o |      -----------------', '       |:_/ |      ОС: {os}', '      //   \\\\     ЯДРО: {kernel}', '     (|     | )    УЗЕЛ: {hostname}', '     /\\_   _/\\     ОБОЛОЧКА: zsh', '     \\___)=(___/    ПАМЯТЬ: {mem}   ВРЕМЯ: {uptime}'],
    'command.historyEmpty': ['ИСТОРИЯ КОМАНД ПУСТА.'], 'command.repoMissing': 'РЕПОЗИТОРИЙ НЕ НАЙДЕН: {name}',
    'command.unknown': 'НЕИЗВЕСТНАЯ КОМАНДА: {name}', 'command.unknownHint': "ВВЕДИТЕ 'HELP', ЧТОБЫ УВИДЕТЬ СПИСОК КОМАНД.",
    'command.theme': ['ЦВЕТ: {theme} PHOSPHOR', 'Анимации и развёртка: переключатель эффектов в шапке.', 'ЧАСТОТА: 60 ГЦ', 'ПРОФИЛЬ: VT100 / CRT'],
    'command.exit': ['СЕАНС НЕЛЬЗЯ ЗАВЕРШИТЬ ИЗ УДАЛЁННОГО TTY.', 'ВВЕДИТЕ `help`, ЧТОБЫ ПРОДОЛЖИТЬ.']
  }
};

const projectProfiles = [
  {
    "id": "localscript",
    "name": "LocalScript",
    "stack": "Rust · Lua · Sandbox",
    "summary": "projects.localScript",
    "url": "https://github.com/Vlm326/LocalScript",
    "en": [
      "Check Lua scripts before execution and run them through a sandbox service.",
      "I worked on part of the Rust sandbox service and the Lua validation and execution pipeline.",
      "The pipeline combines syntax and safety checks with script execution. This was a team project; my contribution focused on the service and script-processing pipeline."
    ],
    "ru": [
      "Проверять Lua-скрипты перед запуском и выполнять их через сервис-песочницу.",
      "Я работал над частью сервиса на Rust и конвейером проверки и выполнения Lua-кода.",
      "Конвейер объединяет синтаксические проверки, проверки безопасности и выполнение скриптов. Это командный проект; мой вклад связан с сервисом и обработкой скриптов."
    ]
  },
  {
    "id": "netanalysys",
    "name": "NetAnalysys",
    "stack": "Rust · Graphs · Algorithms",
    "summary": "projects.netAnalysis",
    "url": "https://github.com/Vlm326/NetAnalysys",
    "en": [
      "Explore graph structure and connectivity using graph algorithms.",
      "The project brings together graph analysis tools implemented in Rust.",
      "Breadth-first search traverses a graph, strongly connected components describe mutual reachability, and landmark indexing provides an additional way to organize graph queries."
    ],
    "ru": [
      "Исследовать структуру графов и связи между вершинами с помощью графовых алгоритмов.",
      "В проекте собраны инструменты анализа графов, реализованные на Rust.",
      "Поиск в ширину используется для обхода графа, сильно связные компоненты описывают взаимную достижимость, а индексация по ориентирам дополняет инструменты работы с графом."
    ]
  },
  {
    "id": "rusthon",
    "name": "Rusthon",
    "stack": "Rust · Lexer · Parser · AST",
    "summary": "projects.rusthon",
    "url": "https://github.com/Vlm326/Rusthon",
    "en": [
      "Explore how a Python-inspired programming language can be implemented in Rust.",
      "The project implements the language-processing pipeline: lexer, parser, AST, and interpreter.",
      "Source text is split into tokens, parsed into an abstract syntax tree, and then evaluated by the interpreter. Each stage has a separate responsibility."
    ],
    "ru": [
      "Разобраться, как реализовать на Rust язык программирования в духе Python.",
      "В проекте реализованы этапы обработки языка: лексер, парсер, AST и интерпретатор.",
      "Исходный текст разбивается на токены, затем преобразуется в абстрактное синтаксическое дерево. Интерпретатор выполняет полученное дерево; у каждого этапа своя задача."
    ]
  },
  {
    "id": "marline",
    "name": "Marline",
    "stack": "Rust · Deduplication · Jaccard",
    "summary": "experience.marline",
    "url": "https://github.com/admitrievtsev/marline/pull/2",
    "en": [
      "Support data deduplication and comparison of similar objects.",
      "I contributed an in-memory posting-list index and Jaccard similarity operations. The PR was accepted upstream.",
      "Posting lists associate indexed elements with the objects containing them. Jaccard similarity compares sets using the size of their intersection relative to their union."
    ],
    "ru": [
      "Поддержать дедупликацию данных и сравнение похожих объектов.",
      "Добавил индекс в памяти на основе posting lists и операции сходства Жаккара. PR принят в основной проект.",
      "Posting lists связывают индексируемые элементы с объектами, в которых они встречаются. Сходство Жаккара сравнивает множества по отношению размера пересечения к размеру объединения."
    ]
  },
  {
    "id": "rust-analyzer",
    "name": "rust-analyzer",
    "stack": "Rust · Diagnostics · Tests",
    "summary": "experience.rustAnalyzer",
    "url": "https://github.com/rust-lang/rust-analyzer/pull/22469",
    "en": [
      "Report type-inference placeholders used in unsupported contexts.",
      "I added E0121 diagnostics and tests. The PR was merged into rust-analyzer.",
      "The change detects unsupported uses of type-inference placeholders and reports a diagnostic. Tests cover the diagnostic behavior."
    ],
    "ru": [
      "Сообщать о плейсхолдерах вывода типов, использованных в недопустимых контекстах.",
      "Добавил диагностику E0121 и тесты. PR вмержен в rust-analyzer.",
      "Изменение обнаруживает неподдерживаемое использование плейсхолдеров вывода типов и выдаёт диагностику. Поведение проверки покрыто тестами."
    ]
  },
  {
    "id": "corrode",
    "name": "Corrode",
    "stack": "Rust · SQLite · GitHub API",
    "summary": "experience.corrode",
    "url": "https://github.com/Vlm326/Corrode",
    "en": [
      "Gather pull request context and support LLM-assisted code review.",
      "A personal Rust project combining GitHub PR context, LLM-assisted review, and persistent review state.",
      "The tool collects context from GitHub, runs a review with an LLM, and stores review state in SQLite."
    ],
    "ru": [
      "Собирать контекст pull request и помогать проводить ревью кода с помощью LLM.",
      "Личный проект на Rust, объединяющий контекст GitHub PR, ревью с LLM и сохранение состояния проверки.",
      "Инструмент получает контекст из GitHub, запускает ревью с помощью LLM и сохраняет состояние в SQLite."
    ]
  }
];
const featuredProjects = ['localscript', 'rusthon', 'marline', 'corrode']
  .map((id) => projectProfiles.find((project) => project.id === id));
let activeProjectId = null;
let projectOpener = null;

function t(key, values = {}) {
  const text = translations[currentLanguage]?.[key] ?? translations.en[key] ?? key;
  const format = (value) => String(value).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
  return Array.isArray(text) ? text.map(format) : format(text);
}

function applyLanguage(language, persist = true) {
  currentLanguage = language === 'en' ? 'en' : 'ru';
  document.documentElement.lang = currentLanguage;
  document.title = t('page.title');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = t(element.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });

  const toggle = $('#languageToggle');
  toggle.textContent = currentLanguage === 'ru' ? 'EN' : 'RU';
  toggle.setAttribute('aria-label', t('language.toggleLabel'));
  if (persist) preferences.setItem('vlm326-language', currentLanguage);

  if (github.user) renderGithub();
  else renderProjects();
  if (github.user) {
    const eventCount = github.events?.length || 0;
    $('#contributions').textContent = eventCount
      ? t('status.eventsCount', { count: eventCount })
      : t('status.publicFeed');
    $('#monitorActivity').textContent = eventCount
      ? t('status.active')
      : t('status.quiet');
    renderActivity();
  }
  updateGithubStatus();
  updateEffectsButton();
  if (activeProjectId) renderProjectDialog();
}

function updateGithubStatus() {
  const state = githubStatus === 'cachedLive'
    ? t('status.cachedLive')
    : githubStatus === 'offlineLocal'
      ? t('status.offlineLocal')
      : t('status.syncing');
  $('#apiState').textContent = state;
  $('#monitorCache').textContent = githubStatus === 'cachedLive'
    ? t('status.cachedLive')
    : githubStatus === 'offlineLocal' ? t('status.offline') : t('status.cold');
}

// ============================================================
// TERMINAL COMMANDS
// ============================================================
const commands = {
  help: () => t('command.help'),

  about: () => t('command.about'),

  projects: () => {
    if (!github.repos.length) {
      return t('command.projectsEmpty');
    }
    return sortRepos().slice(0, 6).map((repo) =>
      `${repo.name.toUpperCase()}  ::  ${repo.language || 'MISC'}  ::  ${repo.stargazers_count || 0} ★`
    );
  },

  research: () => t('command.research'),

  achievements: () => t('command.achievements'),

  skills: () => t('command.skills'),

  github: () => {
    window.open('https://github.com/Vlm326', '_blank', 'noopener');
    return t('command.github');
  },

  contact: () => t('command.contact'),

  whoami: () => t('command.whoami'),

  pwd: () => t('command.pwd'),

  ls: () => t('command.ls'),

  cat: () => t('command.cat'),

  neofetch: () => t('command.neofetch', {
    os: hostInfo.os || 'Linux',
    kernel: hostInfo.kernel || '--',
    hostname: hostInfo.hostname || 'portfolio',
    mem: hostInfo.mem || '--',
    uptime: uptime()
  }),

  history: () => {
    return history.length ? history.map((command, index) =>
      ` ${String(index + 1).padStart(2, '0')}  ${command}`
    ) : t('command.historyEmpty');
  },

  date: () => [new Date().toLocaleString(currentLanguage === 'ru' ? 'ru-RU' : 'en-GB')],

  uptime: () => [uptime()],

  social: () => t('command.contact'),

  theme: (arg) => {
    const theme = arg && themes.includes(arg)
      ? arg
      : themes[(themes.indexOf(currentTheme()) + 1) % themes.length];
    applyTheme(theme);
    return t('command.theme', { theme: theme.toUpperCase() });
  },

  exit: () => t('command.exit')
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
  preferences.setItem('vlm326-theme', theme);
  return theme;
}

function currentTheme() {
  const saved = preferences.getItem('vlm326-theme');
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

function relativeTime(date) {
  if (!date) return '--';
  const hours = Math.max(1, Math.floor((Date.now() - new Date(date)) / 3600000));
  return hours < 24
    ? t('time.hoursAgo', { value: hours })
    : t('time.daysAgo', { value: Math.floor(hours / 24) });
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
      print([t('command.repoMissing', { name: argument })], raw);
    }
    return;
  }

  if (commands[name]) {
    print(commands[name](argument), raw);
  } else {
    print([
      t('command.unknown', { name }),
      t('command.unknownHint')
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
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderProjects();
  });
});

$('#languageToggle').addEventListener('click', () => {
  applyLanguage(currentLanguage === 'ru' ? 'en' : 'ru');
});

const cvDropdown = document.querySelector('.cv-dropdown');
if (cvDropdown) {
  const summary = cvDropdown.querySelector('summary');

  cvDropdown.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') cvDropdown.open = true;
  });

  cvDropdown.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && !cvDropdown.contains(document.activeElement)) {
      cvDropdown.open = false;
    }
  });

  cvDropdown.addEventListener('focusout', (event) => {
    if (!cvDropdown.contains(event.relatedTarget) && !cvDropdown.matches(':hover')) {
      cvDropdown.open = false;
    }
  });

  summary.addEventListener('click', (event) => {
    if (event.detail > 0 && cvDropdown.matches(':hover') && cvDropdown.open) {
      event.preventDefault();
    }
  });

  cvDropdown.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      cvDropdown.open = false;
    });
  });
}

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
    const stored = JSON.parse(preferences.getItem(cacheKey) || 'null');
    if (stored?.data?.user && Array.isArray(stored.data.repos) && Date.now() - stored.timestamp < 15 * 60 * 1000) {
      github = stored.data;
      githubLastChecked = stored.timestamp;
      githubStatus = 'cachedLive';
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

    if (!userResponse || !Array.isArray(reposResponse)) throw new Error('Invalid GitHub snapshot');
    github = {
      user: userResponse,
      repos: reposResponse.sort(
        (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)
      ),
      events: []
    };
    githubLastChecked = Date.now();
    githubStatus = 'cachedLive';

    preferences.setItem(cacheKey,
      JSON.stringify({ timestamp: githubLastChecked, data: github })
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
      fetch('https://api.github.com/users/Vlm326').then((r) => r.ok ? r.json() : Promise.reject()),
      fetch('https://api.github.com/users/Vlm326/repos?sort=pushed')
        .then((r) => r.ok ? r.json() : Promise.reject())
    ]);
    if (!user || !Array.isArray(repos)) throw new Error('Invalid GitHub response');
    github = { user, repos, events: [] };
    githubLastChecked = Date.now();
    githubStatus = 'cachedLive';
    renderGithub();
    fetchEvents();
  } catch {
    githubStatus = 'offlineLocal';
    updateGithubStatus();
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
      ? t('status.eventsCount', { count: github.events.length })
      : t('status.publicFeed');
    $('#monitorActivity').textContent = github.events.length
      ? t('status.active')
      : t('status.quiet');
    renderActivity();
  } catch {
    $('#contributions').textContent = t('status.publicFeed');
    $('#activityFeed').innerHTML = `<p>${escapeHtml(t('activity.empty'))}</p>`;
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
  githubStatus = 'cachedLive';
  updateGithubStatus();
  $('#monitorRepos').textContent = github.user.public_repos ?? github.repos.length;
  $('#monitorSync').textContent = new Date(githubLastChecked || Date.now())
    .toLocaleTimeString(currentLanguage === 'ru' ? 'ru-RU' : 'en-GB');
  $('#lastSync').textContent = githubLastChecked
    ? new Date(githubLastChecked).toLocaleTimeString(currentLanguage === 'ru' ? 'ru-RU' : 'en-GB')
    : '--';

  const latest = [...github.repos]
    .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))[0];

  $('#lastCommit').textContent = latest
    ? `${latest.name.toUpperCase().slice(0, 14)} ${relativeTime(latest.pushed_at)}`
    : '--';

  renderProjects();
}

function projectCard(project) {
  return `
    <article class="project-card project-card--interactive">
      <div class="project-card__top"><h3>${escapeHtml(project.name)}</h3></div>
      <p>${escapeHtml(project.description)}</p>
      <div class="project-card__tags">${escapeHtml(project.stack)}</div>
      <div class="project-card__actions">
        <button type="button" class="project-details" data-project="${escapeHtml(project.id)}"
          aria-haspopup="dialog" aria-label="${escapeHtml(t('projects.details') + ' ' + project.name)}">${escapeHtml(t('projects.details'))}</button>
        <a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">${escapeHtml(t('projects.openRepo'))}</a>
      </div>
    </article>`;
}

function renderProjects() {
  // Preserve the fixed selection regardless of GitHub availability or catalog sorting.
  $('#projectGrid').innerHTML = featuredProjects.map((project) => projectCard({
    ...project, description: t(project.summary)
  })).join('');
  $('#repoGrid').innerHTML = sortRepos().map((repo) => {
    const profile = projectProfiles.find((project) => project.id === repo.name.toLowerCase());
    return projectCard({
      id: repo.name.toLowerCase(), name: repo.name,
      description: profile ? t(profile.summary) : repo.description || t('projects.descriptionFallback'),
      stack: `${repo.language || '—'} · ${repo.stargazers_count || 0} ★`,
      url: repo.html_url
    });
  }).join('');
  $('#projectCount').textContent = github.repos.length;
}

function renderProjectDialog() {
  const profile = projectProfiles.find((project) => project.id === activeProjectId);
  const repo = github.repos.find((item) => item.name.toLowerCase() === activeProjectId);
  if (!profile && !repo) return;
  $('#projectDialogTitle').textContent = profile?.name || repo.name;
  $('#projectDialogStack').textContent = profile?.stack || repo.language || 'GitHub';
  const sections = profile
    ? [t('project.task'), t('project.work'), t('project.implementation')].map((title, index) =>
      `<section><h3>${escapeHtml(title)}</h3><p>${escapeHtml(profile[currentLanguage][index])}</p></section>`).join('')
    : `<p>${escapeHtml(repo.description || t('projects.descriptionFallback'))}</p><p>${escapeHtml(t('project.catalogNote'))}</p>`;
  $('#projectDialogBody').innerHTML = sections;
  $('#projectDialogSource').href = profile?.url || repo.html_url;
}

const projectDialog = $('#projectDialog');
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-project]');
  if (!button) return;
  activeProjectId = button.dataset.project;
  projectOpener = button;
  renderProjectDialog();
  projectDialog.showModal();
});
$('#projectDialogClose').addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('click', (event) => {
  const rect = projectDialog.getBoundingClientRect();
  if (event.target === projectDialog &&
    (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
    projectDialog.close();
  }
});
projectDialog.addEventListener('close', () => {
  const replacement = [...document.querySelectorAll('[data-project]')]
    .find((button) => button.dataset.project === activeProjectId);
  (projectOpener?.isConnected ? projectOpener : replacement)?.focus();
  activeProjectId = null;
});

function renderActivity() {
  if (!github.events?.length) {
    if (github.user) $('#activityFeed').innerHTML = `<p>${escapeHtml(t('activity.empty'))}</p>`;
    return;
  }

  const eventLabels = {
    PushEvent: 'events.push', CreateEvent: 'events.create', PullRequestEvent: 'events.pullRequest',
    PullRequestReviewEvent: 'events.review', IssuesEvent: 'events.issues', IssueCommentEvent: 'events.comment',
    WatchEvent: 'events.watch', ForkEvent: 'events.fork', ReleaseEvent: 'events.release',
    DeleteEvent: 'events.delete', PublicEvent: 'events.public'
  };

  $('#activityFeed').innerHTML = github.events.slice(0, 4).map((event) => `
    <p>
      <time>[ ${relativeTime(event.created_at)} ]</time>
      ${escapeHtml(t(eventLabels[event.type] || 'events.generic'))}
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
      kernel: info.kernel_version || '--',
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
    sync.textContent = t('status.linked');
  } catch {
    hostInfo = {};
    sync.classList.add('dim');
    sync.classList.remove('live-value');
    sync.textContent = t('status.offline');
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
  !document.documentElement.classList.contains('effects-off')
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
const savedLanguage = preferences.getItem('vlm326-language');
applyLanguage(savedLanguage === 'ru' ? 'ru' : 'en', false);
renderProjects();
fetchGithub();
fetchSystemInfo();
setInterval(fetchSystemInfo, 60000);
setInterval(fetchEvents, 5 * 60 * 1000);
applyTheme(currentTheme());

// ============================================================
// BOOT SEQUENCE & VISUAL PREFERENCES
// ============================================================
function updateEffectsButton() {
  const enabled = !document.documentElement.classList.contains('effects-off');
  $('#effectsToggle').textContent = t(enabled ? 'effects.on' : 'effects.off');
  $('#effectsToggle').setAttribute('aria-pressed', String(enabled));
}

function finishBoot() {
  const wasVisible = document.documentElement.classList.contains('boot-pending');
  document.documentElement.classList.remove('boot-pending');
  $('#top').inert = false;
  preferences.setItem('vlm326-intro-seen', '1');
  if (wasVisible && document.activeElement === $('#bootSkip')) $('#top').focus();
}

$('#effectsToggle').addEventListener('click', () => {
  const disabled = document.documentElement.classList.toggle('effects-off');
  preferences.setItem('vlm326-effects', disabled ? 'off' : 'on');
  updateEffectsButton();
  if (disabled) finishBoot();
});
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
  if (event.matches) {
    document.documentElement.classList.add('effects-off');
    updateEffectsButton();
    finishBoot();
  }
});
$('#bootSkip').addEventListener('click', finishBoot);
if (document.documentElement.classList.contains('boot-pending')) {
  $('#top').inert = true;
  $('#bootSkip').focus({ preventScroll: true });
  preferences.setItem('vlm326-intro-seen', '1');
  setTimeout(() => { $('#bootLine').textContent = t('boot.complete'); }, 1200);
  setTimeout(finishBoot, 1500);
}
