const TOOL_DATA_SOURCE = "./tool_data.json";
const GITHUB_REPO = "winterbloooom/useful-sites";
const ISSUE_BASE_URL = `https://github.com/${GITHUB_REPO}/issues/new`;

const state = {
    items: [],
    search: "",
    categoryFilter: "all",
    initialized: false
};

const refs = {
    rows: document.getElementById("tool-rows"),
    listMeta: document.getElementById("list-meta"),
    rowTemplate: document.getElementById("row-template"),
    categoryFilter: document.getElementById("category-filter"),
    searchInput: document.getElementById("search-input"),
    addIssueBtn: document.getElementById("add-issue-btn")
};

function uid() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) {
        return "";
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

function normalizeLegacyData(raw) {
    if (Array.isArray(raw)) {
        return raw.map(normalizeItem).filter(Boolean);
    }

    const items = [];
    Object.entries(raw || {}).forEach(([category, list]) => {
        if (!Array.isArray(list)) {
            return;
        }
        list.forEach((entry) => {
            const normalized = normalizeItem({ ...entry, category });
            if (normalized) {
                items.push(normalized);
            }
        });
    });

    return items;
}

function normalizeItem(entry) {
    if (!entry || !entry.name) {
        return null;
    }

    return {
        id: entry.id || uid(),
        name: String(entry.name || "").trim(),
        url: normalizeUrl(entry.url || ""),
        desc: String(entry.desc || "").trim(),
        category: String(entry.category || "uncategorized").trim().toLowerCase(),
        frequently: Boolean(entry.frequently || (entry.pick && entry.pick.frequently))
    };
}

async function loadInitialData() {
    try {
        const response = await fetch(TOOL_DATA_SOURCE);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        state.items = normalizeLegacyData(json);
        return;
    } catch (error) {
        if (window.TOOL_DATA) {
            state.items = normalizeLegacyData(window.TOOL_DATA);
            return;
        }
        throw error;
    }
}

function compareItems(a, b) {
    if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
}

function getCategories() {
    const set = new Set();
    state.items.forEach((item) => set.add(item.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function filterItems() {
    const search = state.search.trim().toLowerCase();

    return state.items
        .filter((item) => state.categoryFilter === "all" || item.category === state.categoryFilter)
        .filter((item) => {
            if (!search) {
                return true;
            }
            const bucket = [item.name, item.desc, item.category].join(" ").toLowerCase();
            return bucket.includes(search);
        })
        .sort(compareItems);
}

function createIssueUrl(template, fields = {}) {
    const params = new URLSearchParams({ template });
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value) !== "") {
            params.set(key, String(value));
        }
    });
    return `${ISSUE_BASE_URL}?${params.toString()}`;
}

function addIssueUrl() {
    return createIssueUrl("add-tool.yml", { title: "[Add] " });
}

function editIssueUrl(item) {
    return createIssueUrl("edit-tool.yml", {
        title: `[Edit] ${item.name}`,
        current_name: item.name,
        current_url: item.url,
        field: "Multiple fields",
        new_description: item.desc,
        new_category: "No change",
        frequently_used: "No change"
    });
}

function deleteIssueUrl(item) {
    return createIssueUrl("delete-tool.yml", {
        title: `[Delete] ${item.name}`,
        name: item.name,
        url: item.url,
        category: item.category
    });
}

function refreshCategoryControls() {
    const categories = getCategories();
    if (state.categoryFilter !== "all" && !categories.includes(state.categoryFilter)) {
        state.categoryFilter = "all";
    }

    refs.categoryFilter.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All";
    refs.categoryFilter.appendChild(all);

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        refs.categoryFilter.appendChild(option);
    });
    refs.categoryFilter.value = state.categoryFilter;
}

function renderRows() {
    const filtered = filterItems();
    refs.rows.innerHTML = "";

    if (!filtered.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.className = "empty";
        td.textContent = "No tools found.";
        tr.appendChild(td);
        refs.rows.appendChild(tr);
    } else {
        filtered.forEach((item) => {
            const row = refs.rowTemplate.content.firstElementChild.cloneNode(true);

            const nameCell = row.querySelector(".name-cell");
            if (item.url) {
                const link = document.createElement("a");
                link.href = item.url;
                link.target = "_blank";
                link.rel = "noreferrer";
                link.textContent = item.name;
                nameCell.appendChild(link);
            } else {
                const text = document.createElement("span");
                text.className = "name-text";
                text.textContent = item.name;
                nameCell.appendChild(text);
            }

            if (item.desc) {
                const desc = document.createElement("div");
                desc.className = "panel-meta";
                desc.textContent = item.desc;
                nameCell.appendChild(desc);
            }

            row.querySelector(".category-cell").textContent = item.category;
            row.querySelector(".tag-cell").innerHTML = item.frequently
                ? '<span class="tag-chip tag-chip-accent">자주 사용</span>'
                : "-";

            const actionCell = row.querySelector(".action-cell");

            const editLink = document.createElement("a");
            editLink.className = "btn";
            editLink.href = editIssueUrl(item);
            editLink.target = "_blank";
            editLink.rel = "noreferrer";
            editLink.textContent = "Edit";

            const deleteLink = document.createElement("a");
            deleteLink.className = "btn btn-danger";
            deleteLink.href = deleteIssueUrl(item);
            deleteLink.target = "_blank";
            deleteLink.rel = "noreferrer";
            deleteLink.textContent = "Delete";

            actionCell.append(editLink, deleteLink);
            refs.rows.appendChild(row);
        });
    }

    refs.listMeta.textContent = `${filtered.length} shown / ${state.items.length} total`;
}

function render() {
    refreshCategoryControls();
    renderRows();
}

function bindEvents() {
    refs.searchInput.addEventListener("input", (event) => {
        state.search = event.target.value;
        renderRows();
    });

    refs.categoryFilter.addEventListener("change", (event) => {
        state.categoryFilter = event.target.value;
        renderRows();
    });

    refs.addIssueBtn.href = addIssueUrl();
}

async function init() {
    if (state.initialized) {
        return;
    }

    bindEvents();
    await loadInitialData();
    render();
    state.initialized = true;
}

init().catch((error) => {
    console.error(error);
    alert(`Initialization failed: ${error.message}`);
});
