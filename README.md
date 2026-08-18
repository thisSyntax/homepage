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
| `settings.yaml` | Global appearance: theme, background, layout group order, quick-launch |
| `services.yaml` | Service cards (with widgets), grouped into the layout sections defined in `settings.yaml` |
| `widgets.yaml` | Top-of-page info widgets: search bar, weather (Open-Meteo), date/time, Proxmox glances |
| `docker.yaml` | Docker socket endpoints, used by `server`/`container` fields in `services.yaml` for live container status |
| `bookmarks.yaml` | Bookmark links shown in the Bookmarks group |
| `proxmox.yaml` | Proxmox API credentials |
| `custom.css` | Custom styles: hidden scrollbar, page zoom, iframe sizing per widget |
| `custom.js` | DOM tweaks: removes the refresh button, shortens a few widget labels |
| `compose.yaml` | Docker Compose service definition |

## Environment variables

Every secret and host-specific value is a `{{HOMEPAGE_VAR_*}}` placeholder, resolved from `.env` at container start. Never hardcode a real IP, token, or password into a tracked file. Variables currently referenced:

- **Infra**: `WEB_DOMAIN`
- **Proxmox**: `PROXMOX_IP_URL`, `PROXMOX_API_ID`, `PROXMOX_API_KEY`, `PROXMOX_GLANCES_URL`
- **Komodo**: `KOMODO_IP_URL`, `KOMODO_API_KEY`, `KOMODO_SECRET`
- **Synology**: `SYNOLOGY_IP_URL`, `SYNOLOGY_USERNAME`, `SYNOLOGY_PASSWORD`
- **Docker hosts**: `DOCKER-MEDIA_IP`, `DOCKER-OTHERS_IP`
- **Home Assistant**: `HOMEASSISTANT_URL`, `HOMEASSISTANT_TOKEN`, `HOMEASSISTANT_WEATHER_URL`
- **Weather**: `OPENMETEO_LATITUDE`, `OPENMETEO_LONGITUDE`
- **Media stack**: `PLEX_API_KEY`, `TAUTULLI_API_KEY`, `JELLYSEERR_API_KEY` (used by the Seerr widget/card), `IMMICH_TOKEN`, `RADARR_API_KEY`, `SONARR_API_KEY`, `LIDARR_API_KEY`, `BAZARR_API_KEY`, `PROWLARR_API_KEY`, `SABNZBD_API_KEY`
- **Seedbox**: `SEEDBOX_URL`, `SEEDBOX_PASSWORD`

(Each is referenced as `HOMEPAGE_VAR_<NAME>` in `.env`.)

## Layout

Single page, no tabs. `settings.yaml`'s `layout` block controls both the display order (top
to bottom follows the order keys appear in that block, independent of `services.yaml`'s own
order) and the columns, via Homepage's native nested-group support: a group can contain
child groups, each with its own `style: row`/`column` and `columns` count, instead of the
old approach of forcing a CSS grid onto a flat service list.

Current top-to-bottom structure:

- **Bookmarks** — `header: false`, single row (see `bookmarks.yaml`)
- **Infrastructure** — Proxmox, Synology (row of 2)
- **Services** — a row of 4 nested columns: Media (Plex, Tautulli, Immich), Apps (Komodo,
  Notifiarr), Network (Home Assistant, Speedtest-Tracker, Syncthing), Requests (Seerr)
- **Arr Stack** — a row of 3 nested columns: Discovery (Radarr, Sonarr, Lidarr, Prowlarr),
  Calendar (release calendar), Management (Bazarr, deluge, SABnzbd)

**Caveat**: the Calendar widget's `radarr`/`sonarr` integrations (`service_group`/
`service_name`) look up services by name and do **not** recurse into nested sub-groups. Here
Radarr/Sonarr live in `Arr Stack > Discovery`, so `service_group: Discovery` (the immediate
nested group, not `Arr Stack`) is what the integration is pointed at. If new-release events
stop appearing on the Calendar card after a future restructure, check this first — it likely
means the lookup can no longer find the target service at its new nesting depth.

(A two-tab Services/Grafana split was tried and dropped earlier — the Grafana iframe
integration wasn't set up correctly.)
