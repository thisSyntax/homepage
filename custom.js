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
  
 
// Portainer API details
const PORTAINER_ENDPOINT_ID = 2;
const PORTAINER_API_KEY = "REDACTED";
const PORTAINER_BASE_URL = "REDACTED";
 
// Function to add Docker buttons to service containers
function addDockerButtons() {
    document.querySelectorAll('.service-container-stats').forEach(dot => {
        // Find the closest parent with an 'id'
        const serviceRow = dot.closest('[id]');
        if (serviceRow && !serviceRow.querySelector('.custom-docker-stop-btn, .custom-docker-restart-btn')) {
            const fullId = serviceRow.id;
            const [layoutId, containerName] = fullId.split('__');
 
            // Add container name as data attribute to both buttons
            const stopBtnWithAttr = stopBtnHTML.replace(
                '<button type="button"',
                `<button type="button" data-container-name="${containerName}"`
            );
            const restartBtnWithAttr = restartBtnHTML.replace(
                '<button type="button"',
                `<button type="button" data-container-name="${containerName}"`
            );
 
            // Insert both buttons before the stats dot
            dot.insertAdjacentHTML('beforebegin', stopBtnWithAttr + restartBtnWithAttr);
        }
    });
}
 
// Enhanced MutationObserver that handles all functions
const observer = new MutationObserver((mutations) => {
    let shouldAddDockerButtons = false;
 
    // Check if Docker buttons need to be added
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node contains service containers or is one itself
                    if (node.querySelector && (
                        node.querySelector('.service-container-stats') ||
                        node.classList && node.classList.contains('service-container-stats')
                    )) {
                        shouldAddDockerButtons = true;
                    }
                }
            });
        }
    });
 
    // Run all functions
    renameLabels();
    addLogoutButton();
    addCrictimesWidget();
 
    // Add Docker buttons if needed
    if (shouldAddDockerButtons) {
        setTimeout(addDockerButtons, 100);
    }
});
 
observer.observe(document.body, { childList: true, subtree: true });
 
// Also re-add Docker buttons when visibility changes (tab switching)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setTimeout(addDockerButtons, 200);
    }
});
 
// Run functions once DOM is loaded
if (document.readyState !== "loading") {
    renameLabels();
    addLogoutButton();
    addCrictimesWidget();
    addDockerButtons();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        renameLabels();
        addLogoutButton();
        addCrictimesWidget();
        addDockerButtons();
    }, { once: true });
}
 
// Attach click event handler for Docker buttons
document.addEventListener('click', async function(event) {
    const stopBtn = event.target.closest('.custom-docker-stop-btn');
    const restartBtn = event.target.closest('.custom-docker-restart-btn');
 
    if (!stopBtn && !restartBtn) return;
 
    const btn = stopBtn || restartBtn;
    const action = stopBtn ? 'stop' : 'restart';
 
    // Get the container name from the data attribute
    const containerName = btn.getAttribute('data-container-name');
    if (!containerName) {
        alert("No container name found!");
        return;
    }
 
    // Compose API URL
    const url = `${PORTAINER_BASE_URL}/api/endpoints/${PORTAINER_ENDPOINT_ID}/docker/containers/${encodeURIComponent(containerName)}/${action}`;
    console.log(`${action.toUpperCase()} URL is:`, url);
 
    // Indicate activity to user
    btn.disabled = true;
    btn.style.opacity = 0.7;
 
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'X-API-Key': PORTAINER_API_KEY
            }
        });
 
        if (res.ok) {
            alert(`Container "${containerName}" ${action} triggered!`);
        } else {
            const errText = await res.text();
            alert(`Failed to ${action} container "${containerName}".\nStatus: ${res.status}\n${errText}`);
        }
    } catch (err) {
        alert(`Network error ${action}ing container "${containerName}":\n${err}`);
    }
 
    btn.disabled = false;
    btn.style.opacity = 1;
});
