// ===== State =====
let toolboxData = null;
let colorsData = null;
let fontsData = null;

let currentSection = 'toolbox';
let currentCategory = null;
let currentView = 'list';
let currentSort = 'default';
let currentSearch = '';


// ===== Data Loading =====
async function loadJSON(url) {
    const res = await fetch(url);
    return res.json();
}

async function loadJSONL(url) {
    const res = await fetch(url);
    const txt = await res.text();
    return txt.split('\n').map(l => l.trim()).filter(Boolean)
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);
}

async function init() {
    // Nav tabs work regardless of data loading
    setupNavTabs();

    try {
        const [toolbox, colors, fonts] = await Promise.all([
            loadJSON('./toolbox.json'),
            loadJSONL('./colors.jsonl'),
            loadJSON('./design-fonts.json'),
        ]);
        toolboxData = toolbox;
        colorsData = colors;
        fontsData = fonts;
    } catch (e) {
        document.getElementById('items-container').innerHTML =
            '<div class="empty-state">데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';
        return;
    }

    // Set hero count
    const total = Object.values(toolboxData).reduce((sum, arr) => sum + arr.length, 0);
    document.getElementById('hero-count').textContent = total + '개 도구 모음';

    setupCategoryTabs();
    setupToolbar();
    setupColors();
    renderColors();
    renderFonts();
    renderItems();
}

// ===== Navigation (만물상자 / Colors / Fonts) =====
const SECTIONS = ['toolbox', 'colors', 'fonts'];

function setupNavTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            currentSection = tab.dataset.section;
            SECTIONS.forEach(s => {
                document.getElementById('section-' + s).style.display =
                    currentSection === s ? '' : 'none';
            });
            window.scrollTo(0, 0);
        });
    });
}

// ===== Category Tabs =====
const DESIGN_SUBCATS = ['색', '글꼴', '아이콘·일러스트', '사진·영상', '편집', '레퍼런스'];
const DESIGN_PARENT = '디자인';

function getCategoryNames() {
    return Object.keys(toolboxData);
}

function isDesignSub(cat) {
    return DESIGN_SUBCATS.includes(cat);
}

function setupCategoryTabs() {
    const container = document.getElementById('category-tabs');
    const subContainer = document.getElementById('subcategory-tabs');
    const categories = getCategoryNames();

    const total = categories.reduce((sum, c) => sum + toolboxData[c].length, 0);

    const allBtn = document.createElement('button');
    allBtn.className = 'cat-tab is-active';
    allBtn.innerHTML = `전체 <span class="cat-count">${total}</span>`;
    allBtn.dataset.cat = '__all__';
    allBtn.addEventListener('click', () => selectCategory('__all__'));
    container.appendChild(allBtn);

    currentCategory = '__all__';

    let designInserted = false;
    categories.forEach(cat => {
        if (isDesignSub(cat)) {
            if (!designInserted) {
                const designTotal = DESIGN_SUBCATS.reduce((s, c) => s + (toolboxData[c]?.length || 0), 0);
                const dBtn = document.createElement('button');
                dBtn.className = 'cat-tab';
                dBtn.innerHTML = `${DESIGN_PARENT} <span class="cat-count">${designTotal}</span>`;
                dBtn.dataset.cat = '__design__';
                dBtn.addEventListener('click', () => selectCategory('__design__'));
                container.appendChild(dBtn);
                designInserted = true;
            }
            return;
        }
        const btn = document.createElement('button');
        btn.className = 'cat-tab';
        btn.innerHTML = `${cat} <span class="cat-count">${toolboxData[cat].length}</span>`;
        btn.dataset.cat = cat;
        btn.addEventListener('click', () => selectCategory(cat));
        container.appendChild(btn);
    });

    // Build design sub-tabs (rendered once, shown when design active)
    const subAll = document.createElement('button');
    const subTotal = DESIGN_SUBCATS.reduce((s, c) => s + (toolboxData[c]?.length || 0), 0);
    subAll.className = 'subcat-tab is-active';
    subAll.innerHTML = `전체 <span class="cat-count">${subTotal}</span>`;
    subAll.dataset.cat = '__design__';
    subAll.addEventListener('click', () => selectCategory('__design__'));
    subContainer.appendChild(subAll);

    DESIGN_SUBCATS.forEach(cat => {
        if (!toolboxData[cat]) return;
        const btn = document.createElement('button');
        btn.className = 'subcat-tab';
        btn.innerHTML = `${cat} <span class="cat-count">${toolboxData[cat].length}</span>`;
        btn.dataset.cat = cat;
        btn.addEventListener('click', () => selectCategory(cat));
        subContainer.appendChild(btn);
    });
}

function selectCategory(cat) {
    currentCategory = cat;

    // Top tabs: highlight design parent if a design sub is active
    const topActive = isDesignSub(cat) ? '__design__' : cat;
    document.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.toggle('is-active', t.dataset.cat === topActive);
    });

    // Sub tabs: visible only when design parent or design sub active
    const sub = document.getElementById('subcategory-tabs');
    const showSub = cat === '__design__' || isDesignSub(cat);
    sub.style.display = showSub ? '' : 'none';
    if (showSub) {
        document.querySelectorAll('.subcat-tab').forEach(t => {
            t.classList.toggle('is-active', t.dataset.cat === cat);
        });
    }

    renderItems();
}

// ===== Toolbar =====
function setupToolbar() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderItems();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderItems();
    });

    document.getElementById('view-toggle').addEventListener('click', () => {
        currentView = currentView === 'list' ? 'card' : 'list';
        const container = document.getElementById('items-container');
        container.className = currentView === 'list' ? 'view-list' : 'view-card';
        document.getElementById('icon-grid').style.display = currentView === 'list' ? '' : 'none';
        document.getElementById('icon-list').style.display = currentView === 'card' ? '' : 'none';
    });
}

// ===== Constants =====
const REPO_URL = 'https://github.com/winterbloooom/useful-sites';

// ===== Get & Filter Items =====
function getFilteredItems() {
    let items = [];

    if (currentCategory === '__all__') {
        Object.entries(toolboxData).forEach(([cat, arr]) => {
            arr.forEach(item => items.push({ ...item, _cat: cat }));
        });
    } else if (currentCategory === '__design__') {
        DESIGN_SUBCATS.forEach(cat => {
            (toolboxData[cat] || []).forEach(item => items.push({ ...item, _cat: cat }));
        });
    } else {
        items = (toolboxData[currentCategory] || []).map(item => ({ ...item, _cat: currentCategory }));
    }

    // Search
    if (currentSearch) {
        items = items.filter(item =>
            item.name.toLowerCase().includes(currentSearch) ||
            (item.desc && item.desc.toLowerCase().includes(currentSearch))
        );
    }

    // Sort
    if (currentSort === 'name') {
        items.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else if (currentSort === 'frequent') {
        items.sort((a, b) => {
            const af = a.pick ? 1 : 0;
            const bf = b.pick ? 1 : 0;
            return bf - af || a.name.localeCompare(b.name, 'ko');
        });
    }

    return items;
}

// ===== Render Items =====
function renderItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';

    const items = getFilteredItems();

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';

        const pickText = item.pick ? '⭐' : '';
        const p = (k, v) => `${k}=${encodeURIComponent(v)}`;
        const editTitle = `[수정] ${item.name} | ${item._cat} | ${item.id}`;
        const editUrl = `${REPO_URL}/issues/new?template=edit_site.yml&${p('title', editTitle)}&${p('name', item.name)}&${p('url', item.url || '')}&${p('desc', item.desc || '')}`;
        const deleteTitle = `[삭제] ${item.name} | ${item._cat} | ${item.id}`;
        const deleteUrl = `${REPO_URL}/issues/new?template=delete_site.yml&${p('title', deleteTitle)}`;

        div.innerHTML =
            `<div class="item-pick">${pickText}</div>` +
            `<div class="item-name"><a href="${item.url || '#'}" target="_blank">${item.name}</a></div>` +
            `<div class="item-desc">${item.desc || ''}</div>` +
            `<div class="item-actions">` +
                `<a href="${editUrl}" target="_blank" title="수정">수정</a>` +
                `<a href="${deleteUrl}" target="_blank" title="삭제">삭제</a>` +
            `</div>`;

        container.appendChild(div);
    });
}

// ===== Colors viewer =====
const COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

let toastTimer;
function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 1100);
}

async function copyText(text, label) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const t = document.createElement('textarea');
        t.value = text;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
    }
    toast((label ? label + ' ' : '') + '복사됨: ' + text);
}

// Pick readable text color over a hex background
function textOn(hex) {
    const m = hex.replace('#', '');
    if (m.length < 6) return '#1a1a1a';
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1a1a1a' : '#fff';
}

// Daily-seeded shuffle so "기본" order is random but stable within a day
let colorsShuffled = null;

function dailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function seededShuffle(arr, seed) {
    const a = arr.slice();
    const rnd = mulberry32(seed);
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function setupColors() {
    colorsShuffled = seededShuffle(colorsData, dailySeed());

    const sizes = [...new Set(colorsData.map(c => c.size))].sort((a, b) => a - b);
    const sizeSel = document.getElementById('colors-size');
    sizes.forEach(s => sizeSel.add(new Option(s + '색', s)));

    const tags = [...new Set(colorsData.flatMap(c => c.tags || []))].sort((a, b) => a.localeCompare(b, 'ko'));
    const tagSel = document.getElementById('colors-tag');
    tags.forEach(t => tagSel.add(new Option(t, t)));

    ['colors-search', 'colors-size', 'colors-tag', 'colors-sort'].forEach(id => {
        const ev = id === 'colors-search' ? 'input' : 'change';
        document.getElementById(id).addEventListener(ev, renderColors);
    });
}

function colorPasses(c) {
    const q = document.getElementById('colors-search').value.trim().toLowerCase();
    if (q && !(c.id.toLowerCase().includes(q)
            || c.colors.some(x => x.hex.toLowerCase().includes(q))
            || c.colors.some(x => (x.desc || '').toLowerCase().includes(q))
            || (c.tags || []).some(t => t.toLowerCase().includes(q)))) return false;

    const sz = document.getElementById('colors-size').value;
    if (sz && c.size != +sz) return false;

    const tg = document.getElementById('colors-tag').value;
    if (tg && !(c.tags || []).includes(tg)) return false;

    return true;
}

function colorCard(c) {
    const el = document.createElement('div');
    el.className = 'color-card';

    // Header: id copy button + badges
    const head = document.createElement('div');
    head.className = 'cc-head';

    const idb = document.createElement('button');
    idb.className = 'cc-id';
    idb.innerHTML = COPY_SVG + '<span>' + c.id + '</span>';
    idb.title = 'id 복사';
    idb.onclick = () => copyText(c.id, 'id');
    head.appendChild(idb);

    const sb = document.createElement('span');
    sb.className = 'cc-badge size';
    sb.textContent = c.size + '색';
    head.appendChild(sb);

    (c.tags || []).forEach(t => {
        const b = document.createElement('span');
        b.className = 'cc-badge tag';
        b.textContent = t;
        head.appendChild(b);
    });
    el.appendChild(head);

    // Edge-to-edge palette segments (hover to expand)
    const pal = document.createElement('div');
    pal.className = 'cc-palette';
    c.colors.forEach(col => {
        const seg = document.createElement('div');
        seg.className = 'cc-seg';
        seg.style.background = col.hex;
        seg.title = col.hex + (col.desc ? ' · ' + col.desc : '') + ' (클릭 복사)';
        const t = document.createElement('span');
        t.className = 'cc-inhex';
        t.textContent = col.hex;
        t.style.color = textOn(col.hex);
        seg.appendChild(t);
        seg.onclick = () => copyText(col.hex, 'hex');
        pal.appendChild(seg);
    });
    el.appendChild(pal);

    // hex/desc labels under each segment
    const labs = document.createElement('div');
    labs.className = 'cc-labels';
    c.colors.forEach(col => {
        const l = document.createElement('div');
        l.className = 'cc-lab';
        l.title = col.hex + ' 복사';
        l.onclick = () => copyText(col.hex, 'hex');
        const h = document.createElement('span');
        h.className = 'cc-h';
        h.textContent = col.hex;
        const d = document.createElement('span');
        d.className = 'cc-d';
        d.textContent = col.desc || '';
        l.appendChild(h);
        l.appendChild(d);
        labs.appendChild(l);
    });
    el.appendChild(labs);

    return el;
}

function renderColors() {
    const grid = document.getElementById('colors-grid');
    const sort = document.getElementById('colors-sort').value;

    // Default (no sort) = daily-random order; size options sort explicitly
    const base = sort ? colorsData : colorsShuffled;
    let list = base.filter(colorPasses);
    if (sort === 'size') list = list.slice().sort((a, b) => a.size - b.size);
    else if (sort === 'sizeD') list = list.slice().sort((a, b) => b.size - a.size);

    document.getElementById('colors-count').textContent =
        list.length + ' / ' + colorsData.length + '개 조합';

    grid.innerHTML = '';
    if (!list.length) {
        grid.innerHTML = '<div class="empty-state">조건에 맞는 조합이 없습니다.</div>';
        return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(c => frag.appendChild(colorCard(c)));
    grid.appendChild(frag);
}

function renderFonts() {
    const container = document.getElementById('font-container');
    container.innerHTML = '';

    fontsData.fonts.forEach(font => {
        const card = document.createElement('div');
        card.className = 'font-card';
        card.innerHTML =
            `<div class="font-name"><a href="${font.url}" target="_blank">${font.name}</a></div>` +
            `<span class="font-tag">${font.tag}</span>` +
            `<div class="font-desc">${font.desc || ''}</div>`;
        container.appendChild(card);
    });
}

// ===== Init =====
init();
