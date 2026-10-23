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

// Shorten plain stat values of a million or more (e.g. Pi-hole gravity
// "2,190,527" -> "2.19M"); the full number stays available on hover
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumSignificantDigits: 3 });

function compactLargeNumbers() {
    document.querySelectorAll(".service-block-value").forEach((el) => {
        const text = el.textContent.trim();
        if (!/^\d{1,3}(,\d{3}){2,}$/.test(text)) return;
        el.title = text;
        el.textContent = compactNumber.format(Number(text.replaceAll(",", "")));
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
    // Borrow a neighbouring box's classes so the button gets the same padding,
    // margins and height as the weather and clock boxes
    const sibling = bar.querySelector(".widget-container");
    link.className = `${sibling ? sibling.className : "widget-container"} cp-sysmon`;
    // kiosk=1, not a bare kiosk: Grafana only accepts "1" or true, and the bare
    // form didn't hide its menus inside the overlay iframe
    link.href = `${grafana}/d/homepage-docker/homepage-docker?orgId=1&kiosk=1&theme=dark`;
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
    // Reload on every open: Escape inside the dashboard makes Grafana leave kiosk
    // mode, and the cross-origin iframe can't be inspected to notice that
    overlay.querySelector("iframe").src = url;
    overlay.hidden = false;
    document.documentElement.classList.add("cp-sysmon-open");
}

function closeSysmon() {
    const overlay = document.getElementById("cp-sysmon-overlay");
    if (overlay) {
        overlay.hidden = true;
        overlay.querySelector("iframe").src = "about:blank"; // stop its 1m refreshes while hidden
    }
    document.documentElement.classList.remove("cp-sysmon-open");
}

// Cyberpunk UI sounds, synthesised with Web Audio (no audio files): a short
// rising blip on hover, a falling chirp on click. Browsers only allow audio
// after the first click or key press on the page, so hovers are silent until
// then. Mouse/trackpad only - phones have no hover. Muted with the SFX button.
const SFX_TARGETS = ".service-card, .bookmark > a, .cp-sysmon, .cp-sublink, .cp-sysmon-close";
const sfx = {
    ctx: null,
    on: (() => { try { return localStorage.getItem("cp-sfx") !== "off"; } catch { return true; } })(),
    hovered: null,
    lastAt: 0,
};

function sfxUnlock() {
    if (!sfx.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        sfx.ctx = new Ctx();
    }
    if (sfx.ctx.state === "suspended") sfx.ctx.resume();
}

function sfxTone({ type = "square", from, to, ms, gain }) {
    if (!sfx.on || !sfx.ctx || sfx.ctx.state !== "running") return;
    const ctx = sfx.ctx, start = ctx.currentTime, end = start + ms / 1000;
    const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, end);
    filter.type = "lowpass";
    filter.frequency.value = 3200;    // take the harsh edge off the square wave
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(filter).connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(end);
}
const sfxHover = () => sfxTone({ from: 1400, to: 2200, ms: 45, gain: 0.02 });
const sfxClick = () => sfxTone({ type: "sawtooth", from: 900, to: 300, ms: 90, gain: 0.03 });

if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointerdown", sfxUnlock, true);
    document.addEventListener("keydown", sfxUnlock, true);
    document.addEventListener("pointerover", (e) => {
        const el = e.target.closest?.(SFX_TARGETS);
        if (!el || el === sfx.hovered) return;   // moving within the same card
        sfx.hovered = el;
        const now = performance.now();
        if (now - sfx.lastAt < 60) return;       // no machine-gun when sweeping across rows
        sfx.lastAt = now;
        sfxHover();
    });
    document.addEventListener("pointerout", (e) => {
        if (sfx.hovered && !sfx.hovered.contains(e.relatedTarget)) sfx.hovered = null;
    });
    document.addEventListener("click", (e) => {
        if (e.target.closest?.(SFX_TARGETS)) sfxClick();
    }, true);
}

// SFX on/off button after SYS.MON, remembered per browser
function addSfxToggle() {
    const bar = document.getElementById("information-widgets-right");
    if (!bar || !document.getElementById("cp-sysmon") || document.getElementById("cp-sfx")) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const sibling = bar.querySelector(".widget-container:not(.cp-sysmon)");
    const button = document.createElement("button");
    button.id = "cp-sfx";
    button.type = "button";
    button.className = `${sibling ? sibling.className : "widget-container"} cp-sfx`;

    const render = () => {
        button.textContent = sfx.on ? "SFX" : "MUTE";
        button.setAttribute("aria-pressed", String(sfx.on));
        button.title = sfx.on ? "UI sounds on - click to mute" : "UI sounds off - click to turn on";
    };
    button.addEventListener("click", () => {
        sfx.on = !sfx.on;
        try { localStorage.setItem("cp-sfx", sfx.on ? "on" : "off"); } catch { /* private mode */ }
        render();
        if (sfx.on) sfxClick();
    });
    render();
    bar.append(button);
}

// Enhanced MutationObserver that handles all functions
const observer = new MutationObserver((mutations) => {
    let shouldAddDockerButtons = false;

    // Run all functions
    renameLabels();
    addServiceLinks();
    compactLargeNumbers();
    addSysmonButton();
    addSfxToggle();

});

observer.observe(document.body, { childList: true, subtree: true });


// Run functions once DOM is loaded
if (document.readyState !== "loading") {
    renameLabels();
    addServiceLinks();
    compactLargeNumbers();
    addSysmonButton();
    addSfxToggle();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        renameLabels();
        addServiceLinks();
        compactLargeNumbers();
        addSysmonButton();
        addSfxToggle();
    }, { once: true });
}
