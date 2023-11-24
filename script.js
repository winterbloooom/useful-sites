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
            color_div.style.backgroundColor = "#" + color;
            color_div.onclick = copy_code;
            colors.push(color_div);
        });
        colors.forEach(color => {
            single_pal.appendChild(color)
        })
        container.appendChild(single_pal)
    });
}

loadPalettes().then((palettes) => {
    showPalettes(palettes);
});