/* ==================================================================
   Project Showcase

   The data source is pluggable, so the same interface runs against
   real files on disk or against an in-memory demo.
================================================================== */

const source = window.__SHOWCASE_SOURCE__ || {
  async list() {
    const res = await fetch('projects.json');
    if (!res.ok) throw new Error(`projects.json returned ${res.status}`);
    return res.json();
  },
  frame(project) { return { src: `${project.path}/index.html` }; },
  href(project) { return `${project.path}/index.html`; },
  async read(project, file) {
    const res = await fetch(`${project.path}/${file}`);
    if (!res.ok) throw new Error(`${file} returned ${res.status}`);
    return res.text();
  }
};

/* ---------------- Elements ---------------- */
const el = (id) => document.getElementById(id);

const appEl       = el('app');
const viewportEl  = el('viewport');
const paneCodeEl  = el('pane-code');
const splitHandle = el('split-handle');
const treeEl      = el('tree');
const treeEmptyEl = el('tree-empty');
const tabstripEl  = el('tabstrip');
const frameWrapEl = el('frame-wrap');
const previewEl   = el('preview');
const loaderEl    = el('loader');
const codeBodyEl  = el('code-body');
const gutterEl    = el('gutter');
const msgEl       = el('msg');
const msgCardEl   = el('msg-card');
const infoBtn     = el('info-btn');
const infoModal   = el('info-modal');
const modalClose  = el('modal-close');
const crumbEl     = el('crumb');
const filterEl    = el('filter');
const countEl     = el('project-count');
const statusDot   = el('status-dot');
const statusText  = el('status-text');
const statusMeta  = el('status-meta');
const toastEl     = el('toast');
const resizerEl   = el('resizer');
const deviceGroup = el('device-group');
const reloadBtn   = el('reload');
const openTabBtn  = el('open-tab');
const copyBtn     = el('copy-code');
const panelBtn    = el('toggle-panel');
const splitDirBtn = el('split-dir');
const expandBtn   = el('expand-code');
const closeCodeBtn= el('close-code');

/* ---------------- State ---------------- */
let projects = [];
let current = null;
let tabs = [];               // open file names for the current project
let activeTab = -1;
let splitDir = 'v';          // 'v' side by side, 'h' stacked
let maximised = false;
let rowIndex = new Map();

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(`showcase:${key}`)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`showcase:${key}`, JSON.stringify(value)); }
    catch { /* private browsing, ignore */ }
  }
};

/* ---------------- Boot ---------------- */
async function boot() {
  restoreLayout();

  try {
    projects = await source.list();
    buildTree(projects);
    countEl.textContent = `${projects.length} project${projects.length === 1 ? '' : 's'}`;
    setStatus('Ready', 'idle');

    // Open the remembered project, or simply the first one, so the
    // preview is never an empty screen.
    const remembered = projects.find((p) => p.path === store.get('lastProject', null));
    const first = remembered || projects[0];
    if (first) openProject(first);
  } catch (error) {
    console.error(error);
    showLoadError(error);
  }
}

function showLoadError(error) {
  setStatus('Could not load projects.json', 'error');
  countEl.textContent = '0';

  msgEl.hidden = false;
  msgCardEl.textContent = '';

  const heading = document.createElement('strong');
  heading.textContent = 'Could not load projects.json';

  const body = document.createElement('span');
  body.append('Serve this folder over http instead of opening the file directly. Run ');
  const cmd = document.createElement('code');
  cmd.textContent = 'npx serve .';
  body.append(cmd, ` in the project folder, then open the address it prints. (${error.message})`);

  msgCardEl.append(heading, body);
}

/* ---------------- Tree ---------------- */
function buildTree(list, term = '') {
  treeEl.textContent = '';
  rowIndex.clear();
  treeEmptyEl.hidden = list.length > 0;

  list.forEach((project) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');

    const folderRow = document.createElement('button');
    folderRow.type = 'button';
    folderRow.className = 'row row-folder';
    folderRow.setAttribute('role', 'treeitem');
    folderRow.setAttribute('aria-expanded', 'false');

    const twisty = svgEl('twisty', 'M9 6l6 6-6 6');
    const label = document.createElement('span');
    label.append(highlight(project.name, term));
    const count = document.createElement('span');
    count.className = 'row-count';
    count.textContent = project.files.length;

    folderRow.append(twisty, label, count);

    const fileList = document.createElement('ul');
    fileList.className = 'tree-files';
    fileList.setAttribute('role', 'group');

    project.files.forEach((file) => {
      const fileItem = document.createElement('li');
      fileItem.setAttribute('role', 'none');

      const fileRow = document.createElement('button');
      fileRow.type = 'button';
      fileRow.className = 'row row-file';
      fileRow.setAttribute('role', 'treeitem');

      const dot = document.createElement('span');
      dot.className = `dot dot-${extOf(file)}`;
      dot.setAttribute('aria-hidden', 'true');

      const name = document.createElement('span');
      name.append(highlight(file, term));

      fileRow.append(dot, name);
      fileRow.addEventListener('click', () => {
        if (current?.path !== project.path) openProject(project, false);
        openFile(file);
      });

      rowIndex.set(`${project.path}::${file}`, fileRow);
      fileItem.append(fileRow);
      fileList.append(fileItem);
    });

    folderRow.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      folderRow.setAttribute('aria-expanded', String(open));
      openProject(project);
    });

    rowIndex.set(`${project.path}::`, folderRow);
    item.append(folderRow, fileList);
    treeEl.append(item);

    if (term) {
      item.classList.add('is-open');
      folderRow.setAttribute('aria-expanded', 'true');
    }
  });
}

function svgEl(className, path) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}

function highlight(text, term) {
  const fragment = document.createDocumentFragment();
  if (!term) { fragment.append(text); return fragment; }

  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  let from = 0;
  let at = lower.indexOf(needle);

  while (at !== -1) {
    fragment.append(text.slice(from, at));
    const mark = document.createElement('span');
    mark.className = 'hit';
    mark.textContent = text.slice(at, at + needle.length);
    fragment.append(mark);
    from = at + needle.length;
    at = lower.indexOf(needle, from);
  }
  fragment.append(text.slice(from));
  return fragment;
}

/* ---------------- Projects ---------------- */
function openProject(project, runPreview = true) {
  const switching = current?.path !== project.path;
  current = project;
  store.set('lastProject', project.path);

  if (switching) {
    tabs = [];
    activeTab = -1;
    closeCodePane();
    expandOnly(project);
  }

  if (runPreview) runPreviewFor(project);
  markRows();
}

function expandOnly(project) {
  treeEl.querySelectorAll('li').forEach((item) => {
    const row = item.querySelector('.row-folder');
    if (!row) return;
    const isTarget = rowIndex.get(`${project.path}::`) === row;
    item.classList.toggle('is-open', isTarget);
    row.setAttribute('aria-expanded', String(isTarget));
  });
}

function runPreviewFor(project) {
  msgEl.hidden = true;
  frameWrapEl.hidden = false;
  deviceGroup.hidden = false;
  reloadBtn.hidden = false;
  openTabBtn.hidden = false;

  loaderEl.hidden = false;
  setStatus('Loading preview', 'idle');

  const frame = source.frame(project);
  if (frame.srcdoc !== undefined) {
    previewEl.removeAttribute('src');
    previewEl.srcdoc = frame.srcdoc;
  } else {
    previewEl.removeAttribute('srcdoc');
    previewEl.src = frame.src;
  }

  openTabBtn.href = source.href(project);
  setCrumb();
  statusMeta.textContent = project.path;
}

previewEl.addEventListener('load', () => {
  loaderEl.hidden = true;
  setStatus('Running', 'live');
});

/* ---------------- Code pane and tabs ---------------- */
function openFile(file) {
  const found = tabs.indexOf(file);
  if (found === -1) {
    tabs.push(file);
    activeTab = tabs.length - 1;
  } else {
    activeTab = found;
  }

  openCodePane();
  renderTabs();
  loadFile(file);
}

function openCodePane() {
  paneCodeEl.hidden = false;
  splitHandle.hidden = false;
  setMode(maximised ? 'code' : `split-${splitDir}`);
}

function closeCodePane() {
  tabs = [];
  activeTab = -1;
  maximised = false;
  expandBtn.classList.remove('is-on');
  paneCodeEl.hidden = true;
  splitHandle.hidden = true;
  setMode('preview');
  setCrumb();
  markRows();
}

function setMode(mode) {
  viewportEl.className = `viewport mode-${mode}`;
}

function closeTab(index) {
  tabs.splice(index, 1);
  if (tabs.length === 0) { closeCodePane(); return; }
  activeTab = Math.min(activeTab, tabs.length - 1);
  renderTabs();
  loadFile(tabs[activeTab]);
}

function renderTabs() {
  tabstripEl.textContent = '';

  tabs.forEach((file, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab' + (index === activeTab ? ' is-on' : '');
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(index === activeTab));

    const dot = document.createElement('span');
    dot.className = `dot dot-${extOf(file)}`;

    const name = document.createElement('span');
    name.className = 'tab-name';
    name.textContent = file;

    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '\u00D7';
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(index);
    });

    button.append(dot, name, close);
    button.addEventListener('click', () => {
      activeTab = index;
      renderTabs();
      loadFile(file);
    });

    tabstripEl.append(button);
  });
}

async function loadFile(file) {
  setCrumb(file);
  markRows();
  setStatus('Reading file', 'idle');

  codeBodyEl.textContent = 'Loading...';
  gutterEl.textContent = '';

  try {
    const text = await source.read(current, file);

    // textContent, never innerHTML: source is displayed, never parsed
    codeBodyEl.textContent = text;
    codeBodyEl.className = `language-${prismLang(file)}`;
    if (window.Prism) Prism.highlightElement(codeBodyEl);

    const lines = text.split('\n').length;
    gutterEl.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');

    setStatus(maximised ? 'Source' : 'Running', maximised ? 'idle' : 'live');
    statusMeta.textContent = `${current.path}/${file}  ·  ${lines} lines  ·  ${(text.length / 1024).toFixed(1)} KB`;
  } catch (error) {
    console.error(error);
    codeBodyEl.className = '';
    codeBodyEl.textContent = `Could not read ${current.path}/${file}\n\n${error.message}`;
    gutterEl.textContent = '';
    setStatus('Read failed', 'error');
  }
}

/* ---------------- Shared UI ---------------- */
function setCrumb(file) {
  crumbEl.textContent = '';

  if (!current) {
    const empty = document.createElement('span');
    empty.className = 'crumb-empty';
    empty.textContent = 'Nothing open';
    crumbEl.append(empty);
    return;
  }

  const name = document.createElement('span');
  name.className = 'crumb-project';
  name.textContent = current.name;
  crumbEl.append(name);

  if (file) {
    const sep = document.createElement('span');
    sep.className = 'crumb-sep';
    sep.textContent = '/';
    const fileEl = document.createElement('span');
    fileEl.className = 'crumb-file';
    fileEl.textContent = file;
    crumbEl.append(sep, fileEl);
  }
}

function markRows() {
  treeEl.querySelectorAll('.row').forEach((row) => {
    row.classList.remove('is-active', 'is-open-file');
  });
  if (!current) return;

  rowIndex.get(`${current.path}::`)?.classList.add('is-active');
  tabs.forEach((file, index) => {
    const row = rowIndex.get(`${current.path}::${file}`);
    if (!row) return;
    row.classList.add(index === activeTab ? 'is-active' : 'is-open-file');
  });
}

function setStatus(text, kind) {
  statusText.textContent = text;
  statusDot.className = 'status-dot' + (kind === 'live' ? ' is-live' : kind === 'error' ? ' is-error' : '');
}

function extOf(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ext === 'htm' ? 'html' : ext;
}

function prismLang(filename) {
  const map = { html: 'markup', css: 'css', js: 'javascript', json: 'json' };
  return map[extOf(filename)] || 'none';
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { toastEl.hidden = true; }, 1600);
}

/* ---------------- Pane controls ---------------- */
splitDirBtn.addEventListener('click', toggleSplitDir);

function toggleSplitDir() {
  if (paneCodeEl.hidden) return;
  splitDir = splitDir === 'v' ? 'h' : 'v';
  store.set('splitDir', splitDir);
  splitDirBtn.title = splitDir === 'v' ? 'Stack panes (Ctrl+\\)' : 'Place side by side (Ctrl+\\)';
  if (!maximised) setMode(`split-${splitDir}`);
  toast(splitDir === 'v' ? 'Side by side' : 'Stacked');
}

expandBtn.addEventListener('click', () => {
  maximised = !maximised;
  expandBtn.classList.toggle('is-on', maximised);
  expandBtn.title = maximised ? 'Restore split' : 'Maximise code pane';
  setMode(maximised ? 'code' : `split-${splitDir}`);
  setStatus(maximised ? 'Source' : 'Running', maximised ? 'idle' : 'live');
});

closeCodeBtn.addEventListener('click', closeCodePane);

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeBodyEl.textContent);
    toast('Source copied');
  } catch {
    toast('Copy blocked by the browser');
  }
});

deviceGroup.addEventListener('click', (event) => {
  const button = event.target.closest('.seg');
  if (!button) return;

  deviceGroup.querySelectorAll('.seg').forEach((b) => b.classList.remove('is-on'));
  button.classList.add('is-on');

  const width = button.dataset.width;
  if (width === 'full') {
    frameWrapEl.classList.remove('is-constrained');
    previewEl.style.maxWidth = '';
  } else {
    frameWrapEl.classList.add('is-constrained');
    previewEl.style.maxWidth = `${width}px`;
  }
});

reloadBtn.addEventListener('click', () => {
  loaderEl.hidden = false;
  if (previewEl.srcdoc) previewEl.srcdoc = previewEl.srcdoc;
  else previewEl.src = previewEl.src;
  toast('Preview reloaded');
});

panelBtn.addEventListener('click', togglePanel);

function togglePanel() {
  const collapsed = appEl.classList.toggle('is-collapsed');
  panelBtn.classList.toggle('is-on', collapsed);
  panelBtn.title = collapsed ? 'Show file tree (Ctrl+B)' : 'Hide file tree (Ctrl+B)';
  store.set('collapsed', collapsed);
}

/* ---------------- Filter ---------------- */
filterEl.addEventListener('input', () => {
  const term = filterEl.value.trim();
  const lower = term.toLowerCase();

  const matches = projects.map((project) => {
    if (!lower) return project;
    if (project.name.toLowerCase().includes(lower)) return project;
    const files = project.files.filter((f) => f.toLowerCase().includes(lower));
    return files.length ? { ...project, files } : null;
  }).filter(Boolean);

  buildTree(matches, term);
  markRows();
  countEl.textContent = `${matches.length} project${matches.length === 1 ? '' : 's'}`;
});

/* ---------------- Dragging: tree width ---------------- */
let dragTarget = null;

resizerEl.addEventListener('mousedown', (event) => startDrag('tree', resizerEl, event));
splitHandle.addEventListener('mousedown', (event) => startDrag('split', splitHandle, event));

function startDrag(kind, element, event) {
  dragTarget = kind;
  element.classList.add('is-dragging');
  document.body.style.userSelect = 'none';
  event.preventDefault();
}

window.addEventListener('mousemove', (event) => {
  if (!dragTarget) return;

  if (dragTarget === 'tree') {
    setTreeWidth(window.innerWidth - event.clientX);
    return;
  }

  const box = viewportEl.getBoundingClientRect();
  const horizontal = viewportEl.classList.contains('mode-split-h')
    || window.matchMedia('(max-width: 900px)').matches;

  const ratio = horizontal
    ? ((event.clientY - box.top) / box.height) * 100
    : ((event.clientX - box.left) / box.width) * 100;

  setSplit(ratio);
});

window.addEventListener('mouseup', () => {
  if (!dragTarget) return;
  resizerEl.classList.remove('is-dragging');
  splitHandle.classList.remove('is-dragging');
  document.body.style.userSelect = '';
  store.set(dragTarget === 'tree' ? 'treeWidth' : 'split',
            dragTarget === 'tree' ? currentTreeWidth() : currentSplit());
  dragTarget = null;
});

/* keyboard resizing */
resizerEl.addEventListener('keydown', (event) => {
  const step = event.shiftKey ? 40 : 12;
  if (event.key === 'ArrowLeft') setTreeWidth(currentTreeWidth() + step);
  else if (event.key === 'ArrowRight') setTreeWidth(currentTreeWidth() - step);
  else return;
  event.preventDefault();
  store.set('treeWidth', currentTreeWidth());
});

splitHandle.addEventListener('keydown', (event) => {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  if (!keys.includes(event.key)) return;
  const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
  setSplit(currentSplit() + (back ? -4 : 4));
  event.preventDefault();
  store.set('split', currentSplit());
});

function setTreeWidth(px) {
  const width = Math.min(Math.max(px, 220), 560);
  document.documentElement.style.setProperty('--tree-w', `${width}px`);
}

function currentTreeWidth() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tree-w'), 10) || 300;
}

function setSplit(percent) {
  const value = Math.min(Math.max(percent, 20), 80);
  document.documentElement.style.setProperty('--split', `${value}%`);
}

function currentSplit() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--split')) || 52;
}

function restoreLayout() {
  setTreeWidth(store.get('treeWidth', 300));
  setSplit(store.get('split', 52));
  splitDir = store.get('splitDir', 'v');
  splitDirBtn.title = splitDir === 'v' ? 'Stack panes (Ctrl+\\)' : 'Place side by side (Ctrl+\\)';

  if (store.get('collapsed', false)) {
    appEl.classList.add('is-collapsed');
    panelBtn.classList.add('is-on');
  }
}

/* ---------------- Info modal ---------------- */
function openInfo() {
  if (!infoModal.open) infoModal.showModal();
}

infoBtn.addEventListener('click', openInfo);
modalClose.addEventListener('click', () => infoModal.close());

// click on the backdrop closes it: the dialog element itself fills only
// the card, so a click landing on <dialog> means the backdrop was hit
infoModal.addEventListener('click', (event) => {
  if (event.target === infoModal) infoModal.close();
});

/* ---------------- Keyboard ---------------- */
document.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  const mod = event.ctrlKey || event.metaKey;

  if (infoModal.open) return;   // the dialog handles its own Escape

  if (event.key === '?' && !typing) {
    event.preventDefault();
    openInfo();
    return;
  }

  if (event.key === '/' && !typing) {
    event.preventDefault();
    filterEl.focus();
    filterEl.select();
    return;
  }

  if (mod && event.key.toLowerCase() === 'b') {
    event.preventDefault();
    togglePanel();
    return;
  }

  if (mod && event.key === '\\') {
    event.preventDefault();
    toggleSplitDir();
    return;
  }

  if (event.key === 'Escape') {
    if (typing) {
      filterEl.value = '';
      filterEl.dispatchEvent(new Event('input'));
      filterEl.blur();
    } else if (!paneCodeEl.hidden) {
      closeCodePane();
    }
  }
});

boot();