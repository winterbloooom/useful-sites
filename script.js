/**
 * Load array of websites from json file.
 * @param {string} category - Which category to load objects. Be sure that it should be exactly same with name of array object in json file.
 * @returns list of websites in `category` object
 */
function loadWebsites(category) {
    return fetch("./websites.json")
        .then((res) => res.json())
        .then((json) => json[category]);
}


/**
 * Insert rows in table
 * @param {Array} websites - array of website objects from json file
 * @param {Promise} container - table to insert rows
 */
function showWebsites(websites, container) {
    websites.forEach(website => {
        line_tr = Object.assign(
            document.createElement('tr'),
            { className: "line" }
        );
        pick_td = Object.assign(
            document.createElement('td'),
            { className: "pick" }
        );
        pick_td.innerText += website.pick.frequently ? "⭐" : "";
        pick_td.innerText += website.pick.good ? "👍" : "";
        pick_td.innerText += website.pick.web ? "🌏" : "";
        name_td = Object.assign(
            document.createElement('td'),
            { className: "name" }
        );
        link_td = Object.assign(
            document.createElement('a'),
            { href: website.url },
            { innerText: website.name },
            { target: "_blank"}
        );
        desc_td = Object.assign(
            document.createElement('td'),
            { className: "description" },
            { innerText: website.desc }
        );
        name_td.appendChild(link_td);
        line_tr.appendChild(pick_td);
        line_tr.appendChild(name_td);
        line_tr.appendChild(desc_td);
        container.appendChild(line_tr);
    });
}


function callLoader(name, activeContent) {
    var pos = name.indexOf("_") + 1;
    name = name.substring(pos);
    loadWebsites(name).then((websites) => {
        showWebsites(websites, activeContent);
    })
}


function showActivateTab() {
    const tabList = document.querySelectorAll("#category-tab > .tab-item");
    const table = document.querySelector("#category-contents > table > tbody");
    var tableRows;

    for(var i=0; i<tabList.length; i++) {
        tabList[i].addEventListener("click", function(event) {
            event.preventDefault();

            // remove is-on class from tabs
            for(var j=0; j<tabList.length; j++) {
                tabList[j].classList.remove("is-on");
            }
            this.classList.add("is-on");

            // remove all rows exist
            tableRows = document.querySelectorAll("#category-contents .line");
            for (var j=0; j<tableRows.length; j++) {
                tableRows[j].remove();
            }

            // name of tab
            var tabName = this.children[1].textContent;
            callLoader(tabName, table);
        });
    }

    // initializae
    callLoader("utils", table);
}

showActivateTab();