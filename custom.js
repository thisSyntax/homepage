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
 
// Add logout button
function addLogoutButton() {
    const logoutUrl = "REDACTED"; // Replace with your actual logout URL
    const targetElement = document.querySelector(".flex.flex-row.w-full.flex-wrap.justify-between.gap-x-2");
 
    if (targetElement && !document.getElementById("logout-icon")) {
        const logoutButton = document.createElement("a");
        logoutButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M10 9V5a1 1 0 011-1h8a1 1 0 011 1v14a1 1 0 01-1 1h-8a1 1 0 01-1-1v-4H8v4a3 3 0 003 3h8a3 3 0 003-3V5a3 3 0 00-3-3h-8a3 3 0 00-3 3v4h2zM15 12l-4-4v3H3v2h8v3l4-4z"/>
            </svg>
        `;
        logoutButton.href = logoutUrl;
        logoutButton.id = "logout-icon";
        logoutButton.classList.add("logout-icon");
 
        targetElement.appendChild(logoutButton);
    }
}
 
// Custom Docker Buttons - Stop and Restart
const stopBtnHTML = `
  <button type="button"
    class="shrink-0 flex items-center justify-center cursor-pointer service-tag custom-docker-stop-btn"
    title="Stop Docker Container"
    style="padding:0;">
    <div class="w-auto text-center overflow-hidden"
         style="padding:0.75rem 0.25rem; background:transparent;">
      <div class="rounded-full h-3 w-3 flex items-center justify-center"
           style="background:transparent;">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" stroke="none">
          <rect x="6" y="5" width="12" height="12" rx="1"/>
        </svg>
      </div>
    </div>
    <span class="sr-only">Stop Docker Container</span>
  </button>
`;
 
const restartBtnHTML = `
  <button type="button"
    class="shrink-0 flex items-center justify-center cursor-pointer service-tag custom-docker-restart-btn"
    title="Restart Docker Container"
    style="padding:0;">
    <div class="w-auto text-center overflow-hidden"
         style="padding:0.75rem 0.25rem; background:transparent;">
      <div class="rounded-full h-3 w-3 flex items-center justify-center"
           style="background:transparent;">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v5h5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 9A7 7 0 1 0 9 4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <span class="sr-only">Restart Docker Container</span>
  </button>
`;
 
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
