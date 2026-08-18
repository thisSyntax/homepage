# homepage

Config for my [Homepage](https://gethomepage.dev/) dashboard ("Fey Server Infrastructure") — self-hosted, Docker-based. This repo holds only the YAML/CSS/JS config that Homepage reads at runtime; there's no app code, build, or tests.

## Setup

1. Create an `.env` file next to `compose.yaml` (not tracked in this repo) with values for every `{{HOMEPAGE_VAR_*}}` placeholder used in the `*.yaml` files — see [Environment variables](#environment-variables) below.
2. Adjust the bind mounts in `compose.yaml` (`/opt/docker/homepage`, `/opt/images`) to match your host's paths.
3. Start the container:

   ```sh
   docker compose up -d       # start
   docker compose pull        # update image
   docker compose down        # stop
   ```

4. Open `http://localhost:3000`. Config file edits are picked up live — no restart needed.

## Files

| File | Purpose |
|------|---------|
| `settings.yaml` | Global appearance: theme, background, tabs/layout groups, quick-launch |
| `services.yaml` | Service cards (with widgets), grouped into the layout sections defined in `settings.yaml` |
| `widgets.yaml` | Top-of-page info widgets: search bar, weather (Open-Meteo), date/time, Proxmox glances |
| `docker.yaml` | Docker socket endpoints, used by `server`/`container` fields in `services.yaml` for live container status |
| `bookmarks.yaml` | Bookmark links shown in the Bookmarks group |
| `proxmox.yaml` | Proxmox API credentials |
| `custom.css` | Custom styles: hidden scrollbar, page zoom, iframe sizing per widget, 4-column service grid |
| `custom.js` | DOM tweaks: removes the refresh button, shortens a few widget labels |
| `compose.yaml` | Docker Compose service definition |

## Environment variables

Every secret and host-specific value is a `{{HOMEPAGE_VAR_*}}` placeholder, resolved from `.env` at container start. Never hardcode a real IP, token, or password into a tracked file. Variables currently referenced:

- **Infra**: `WEB_DOMAIN`, `GRAFANA_URL`
- **Proxmox**: `PROXMOX_IP_URL`, `PROXMOX_API_ID`, `PROXMOX_API_KEY`, `PROXMOX_GLANCES_URL`
- **Komodo**: `KOMODO_IP_URL`, `KOMODO_API_KEY`, `KOMODO_SECRET`
- **Synology**: `SYNOLOGY_IP_URL`, `SYNOLOGY_USERNAME`, `SYNOLOGY_PASSWORD`
- **Docker hosts**: `DOCKER-MEDIA_IP`, `DOCKER-OTHERS_IP`
- **Home Assistant**: `HOMEASSISTANT_URL`, `HOMEASSISTANT_TOKEN`, `HOMEASSISTANT_WEATHER_URL`
- **Weather**: `OPENMETEO_LATITUDE`, `OPENMETEO_LONGITUDE`
- **Media stack**: `PLEX_API_KEY`, `TAUTULLI_API_KEY`, `JELLYSEERR_API_KEY`, `IMMICH_TOKEN`, `RADARR_API_KEY`, `SONARR_API_KEY`, `LIDARR_API_KEY`, `BAZARR_API_KEY`, `PROWLARR_API_KEY`, `SABNZBD_API_KEY`
- **Seedbox**: `SEEDBOX_URL`, `SEEDBOX_PASSWORD`

(Each is referenced as `HOMEPAGE_VAR_<NAME>` in `.env`.)

## Custom column layout

`custom.css` replaces Homepage's default single-column service list with a 4-column CSS grid. A service's `id` prefix in `services.yaml` controls its column span:

- `id: col-1__<name>` → 1 column
- `id: col-2__<name>` → 2 columns
- `id: col-3__<name>` → 3 columns
- no `col-N__` prefix → all 4 columns

## Tabs

Configured via `settings.yaml`'s `layout`:

- **Services** — System, Apps, Admin, Media Management, Monitoring & Networking, Tools, Bookmarks
- **Grafana** — full-width Grafana iframe

The `At a Glance` group has no tab assignment, so it renders above the tab bar on every
tab. It holds weather, the release calendar, and Plex/Tautulli/Jellyseerr — the services
meant to be visible at a glance without switching tabs. `Apps` now holds only Immich.
