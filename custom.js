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

// Enhanced MutationObserver that handles all functions
const observer = new MutationObserver((mutations) => {
    let shouldAddDockerButtons = false;
    
    // Run all functions
    renameLabels();
    addServiceLinks();

});

observer.observe(document.body, { childList: true, subtree: true });


// Run functions once DOM is loaded
if (document.readyState !== "loading") {
    renameLabels();
    addServiceLinks();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        renameLabels();
        addServiceLinks();
    }, { once: true });
}
