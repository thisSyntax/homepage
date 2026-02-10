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

// Enhanced MutationObserver that handles all functions
const observer = new MutationObserver((mutations) => {
    let shouldAddDockerButtons = false;
    
    // Run all functions
    renameLabels();
    
});

observer.observe(document.body, { childList: true, subtree: true });


// Run functions once DOM is loaded
if (document.readyState !== "loading") {
    renameLabels();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        renameLabels();
    }, { once: true });
}
