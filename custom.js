// Remove refresh button
document.getElementById("revalidate")?.remove();

// Rename widget labels dynamically
function renameLabels() {
    const mappings = {
        "Missing Episodes": "Episodes",         // bazarr
        "Missing Movies": "Movies",             // bazarr
        "Logins (24h)": "Logins",               // authentik
        "Failed Logins (24h)": "Failed",        // authentik
        "Sites Down": "Down",                   // uptime-kuma
        "Sites Up": "Up"                        // uptime-kuma
    };

    document.querySelectorAll("div.font-bold.text-xs.uppercase").forEach((el) => {
        const text = el.textContent.trim();
        if (mappings[text]) el.textContent = mappings[text];
    });
}

// Turn a "Label|https://url" service description into a small link chip next to
// the service name, so a card can link somewhere besides its own href.
function addServiceLinks() {
    document.querySelectorAll(".service-description").forEach((desc) => {
        const match = desc.textContent.trim().match(/^([^|]+)\|(https?:\/\/\S+)$/);
        if (!match) return;

        const title = desc.closest(".service-title");
        if (!title || title.querySelector(".cp-sublink")) return;

        const link = document.createElement("a");
        link.className = "cp-sublink";
        link.href = match[2];
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = match[1].trim();

        title.querySelector(".service-title-text").after(link);
        desc.style.display = "none";
    });
}

// "SYS.MON" button at the end of the top bar, opening the Grafana Docker
// dashboard in kiosk mode. The Grafana address is taken from the node cards'
// graph iframes, so it follows HOMEPAGE_VAR_GRAFANA_URL instead of living here.
function addSysmonButton() {
    const bar = document.getElementById("information-widgets-right");
    const graph = document.querySelector('iframe[src*="/d-solo/"]');
    if (!bar || !graph || document.getElementById("cp-sysmon")) return;

    let grafana;
    try {
        grafana = new URL(graph.src).origin;
    } catch {
        return; // unset variable leaves a placeholder instead of a URL
    }

    const link = document.createElement("a");
    link.id = "cp-sysmon";
    link.className = "widget-container cp-sysmon";
    link.href = `${grafana}/d/homepage-docker/homepage-docker?orgId=1&kiosk`;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.innerHTML = '<span class="cp-sysmon-label">SYS.MON</span><span class="cp-sysmon-sub">Docker</span>';
    bar.append(link);
}

// Enhanced MutationObserver that handles all functions
const observer = new MutationObserver((mutations) => {
    let shouldAddDockerButtons = false;

    // Run all functions
    renameLabels();
    addServiceLinks();
    addSysmonButton();

});

observer.observe(document.body, { childList: true, subtree: true });


// Run functions once DOM is loaded
if (document.readyState !== "loading") {
    renameLabels();
    addServiceLinks();
    addSysmonButton();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        renameLabels();
        addServiceLinks();
        addSysmonButton();
    }, { once: true });
}
