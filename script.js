function copy_code(event) {
    color = event.target.innerText;
    navigator.clipboard.writeText(event.target.innerText)
    .then(() => {
        alert('Color Copied: #' + color);
    })
    .catch(err => {
        console.error('Error in copying text: ', err);
    });
}

function loadPalettes() {
    return fetch("./palettes.json")
        .then((res) => res.json())
        .then((json) => json.palettes);
}

function loadUtils() {
    return fetch("./websites.json")
        .then((res) => res.json())
        .then((json) => json.utils);
}

function loadIcons() {
    return fetch("./websites.json")
        .then((res) => res.json())
        .then((json) => json.icons);
}

function showPalettes(palettes) {
    const container = document.querySelector("#colors-wrapper");
    palettes.forEach(pal => {
        single_pal = Object.assign(
            document.createElement('div'),
            { className: "palette-single" }
        )
        var colors = []
        pal.forEach(color => {
            color_div = Object.assign(
                document.createElement('div'),
                { className: "color" },
                { textContent: color }
            )
            color_div.style.backgroundColor = "#" + color.toUpperCase();
            color_div.onclick = copy_code;
            colors.push(color_div);
        });
        colors.forEach(color => {
            single_pal.appendChild(color)
        })
        container.appendChild(single_pal)
    });
}

function showWebsites(utils, container_id) {
    const container = document.querySelector(container_id);
    utils.forEach(util => {
        line_tr = Object.assign(
            document.createElement('tr'),
            { className: "line" }
        );
        pick_td = Object.assign(
            document.createElement('td'),
            { className: "pick" }
        );
        pick_td.innerText += util.pick.frequently ? "⭐" : "";
        pick_td.innerText += util.pick.good ? "👍" : "";
        pick_td.innerText += util.pick.web ? "🌏" : "";
        name_td = Object.assign(
            document.createElement('td'),
            { className: "name" }
        );
        link_td = Object.assign(
            document.createElement('a'),
            { href: util.url },
            { innerText: util.name },
            { target: "_blank"}
        );
        desc_td = Object.assign(
            document.createElement('td'),
            { className: "description" },
            { innerText: util.desc }
        );
        name_td.appendChild(link_td);
        line_tr.appendChild(pick_td);
        line_tr.appendChild(name_td);
        line_tr.appendChild(desc_td);
        container.appendChild(line_tr);
    });
}

loadIcons().then((utils) => {
    showWebsites(utils, "#icons-table");
});

loadUtils().then((utils) => {
    showWebsites(utils, "#websites-table");
});



loadPalettes().then((palettes) => {
    showPalettes(palettes);
});

