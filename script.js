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

async function init() {
    // Nav/cheatsheet tabs work regardless of data loading
    setupNavTabs();
    setupCheatsheetTabs();

    try {
        const [toolbox, colors, fonts] = await Promise.all([
            loadJSON('./toolbox.json'),
            loadJSON('./design-colors.json'),
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
    renderPalettes();
    renderFonts();
    renderItems();
}

// ===== Navigation (만물상자 / 디자인 치트시트) =====
function setupNavTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            currentSection = tab.dataset.section;
            document.getElementById('section-toolbox').style.display =
                currentSection === 'toolbox' ? '' : 'none';
            document.getElementById('section-cheatsheet').style.display =
                currentSection === 'cheatsheet' ? '' : 'none';
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

// ===== Cheatsheet =====
function setupCheatsheetTabs() {
    document.querySelectorAll('.cs-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cs-tab').forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            const target = tab.dataset.cs;
            document.getElementById('cs-colors').style.display = target === 'colors' ? '' : 'none';
            document.getElementById('cs-fonts').style.display = target === 'fonts' ? '' : 'none';
        });
    });
}

function renderPalettes() {
    const container = document.getElementById('palette-container');
    container.innerHTML = '';

    colorsData.palettes.forEach(pal => {
        const card = document.createElement('div');
        card.className = 'palette-card';

        const row = document.createElement('div');
        row.className = 'palette-row';

        pal.forEach(hex => {
            const color = document.createElement('div');
            color.className = 'palette-color';
            color.style.backgroundColor = '#' + hex;
            color.textContent = hex;

            // Determine text color based on luminance
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            color.style.color = lum > 0.55 ? '#000' : '#fff';

            color.addEventListener('click', () => {
                navigator.clipboard.writeText('#' + hex).then(() => {
                    color.textContent = 'copied!';
                    setTimeout(() => { color.textContent = hex; }, 800);
                });
            });
            row.appendChild(color);
        });

        card.appendChild(row);
        container.appendChild(card);
    });
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
