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
    link.href = `${grafana}/d/homepage-docker/homepage-docker?orgId=1&kiosk&theme=dark`;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.innerHTML = '<span class="cp-sysmon-label">SYS.MON</span><span class="cp-sysmon-sub">Docker</span>';
    // A plain click opens the dashboard in a framed overlay; ctrl/cmd/shift or
    // middle click still open it in a new tab.
    link.addEventListener("click", (e) => {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        openSysmon(link.href);
    });
    bar.append(link);
}

function openSysmon(url) {
    let overlay = document.getElementById("cp-sysmon-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "cp-sysmon-overlay";
        overlay.innerHTML = `
            <div class="cp-sysmon-frame" role="dialog" aria-modal="true" aria-label="Docker monitor">
                <div class="cp-sysmon-inner">
                    <div class="cp-sysmon-bar">
                        <span class="cp-sysmon-title">SYS.MON // Docker</span>
                        <a class="cp-sysmon-tab" target="_blank" rel="noreferrer">Open in tab</a>
                        <button type="button" class="cp-sysmon-close" aria-label="Close">&#x2715;</button>
                    </div>
                    <iframe title="Grafana Docker dashboard"></iframe>
                </div>
            </div>`;
        // Close on the X, a click outside the frame, or Escape (Escape only
        // reaches us while focus isn't inside the Grafana iframe)
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay || e.target.closest(".cp-sysmon-close")) closeSysmon();
        });
        overlay.querySelector(".cp-sysmon-tab").addEventListener("click", closeSysmon);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !overlay.hidden) closeSysmon();
        });
        document.body.append(overlay);
    }

    overlay.querySelector(".cp-sysmon-tab").href = url;
    const frame = overlay.querySelector("iframe");
    if (frame.getAttribute("src") !== url) frame.src = url; // keep it loaded between opens
    overlay.hidden = false;
    document.documentElement.classList.add("cp-sysmon-open");
}

function closeSysmon() {
    const overlay = document.getElementById("cp-sysmon-overlay");
    if (overlay) overlay.hidden = true;
    document.documentElement.classList.remove("cp-sysmon-open");
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
