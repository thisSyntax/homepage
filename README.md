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
| `bookmarks.yaml` | Bookmark links shown in the Quick Links row |
| `proxmox.yaml` | Proxmox API credentials |
| `custom.css` | Custom styles: hidden scrollbar, page zoom, iframe sizing per widget |
| `custom.js` | DOM tweaks: removes the refresh button, shortens a few widget labels |
| `compose.yaml` | Docker Compose service definition |

## Environment variables

Every secret and host-specific value is a `{{HOMEPAGE_VAR_*}}` placeholder, resolved from `.env` at container start. Never hardcode a real IP, token, or password into a tracked file.

`.env.example` in the repo root lists every `HOMEPAGE_VAR_*` variable referenced across the YAML files, grouped by section. Copy it to `.env` and fill in real values.

## Layout

Single page, no tabs. `settings.yaml`'s `layout` block sets the display order (top to
bottom follows the order keys appear in that block) and the columns for each group, using
Homepage's nested-group support: a group can contain child groups, each with its own
`style: row`/`column` and `columns` count.

Top-to-bottom structure:

- **Quick Links** — bookmarks, single row (see `bookmarks.yaml`)
- **Infrastructure** — Proxmox, Synology (row of 2)
- **Services** — a row of 4 nested columns: Apps (Plex, Tautulli, Immich, Home Assistant),
  Admin (Komodo), Network (Unifi Controller, Speedtest-Tracker), DNS (Pi-hole 1, Pi-hole 2 —
  on a Raspberry Pi)
- **Media** — a row of 3 nested columns: Arr Stack (Radarr, Sonarr, Lidarr, Bazarr,
  Prowlarr — itself a 2-column row), Calendar (a monthly grid card and an agenda list card),
  Management (Seerr, Syncthing, Notifiarr)
