# data-raw/

Raw Overpass export consumed by `scripts/build-pakistan-map-data.py`.
Not committed (see `.gitignore`) — regenerate it yourself:

1. Run the query in `.cursor/hero-map-patch.md` section 1a against an
   Overpass endpoint (`https://overpass-api.de/api/interpreter` or a
   mirror), using `out geom` so each way includes its coordinates.
2. Save the response as `data-raw/osm-roads.json`.
3. Run `python3 scripts/build-pakistan-map-data.py` from the project
   root — it rewrites `src/data/pakistan-map.json`'s `roads` array in
   place and prints a vertex-count report.

This sandbox's network egress policy blocks `overpass-api.de` and
every mirror tried (`overpass.kumi.systems`, `lz4.overpass-api.de`,
`overpass.openstreetmap.ru`, `overpass.private.coffee`), so step 1
has to happen outside this environment.

## ne_pak_pov.json

Natural Earth 10m `admin_0_countries`, **Pakistan point of view** — the
mainland polygon only, extracted from the full world file.

GADM's PAK extent stops at 77.8E, so Jammu and Kashmir is cut off part
way through. Natural Earth publishes per-country point-of-view boundary
sets for exactly this reason; the Pakistan set runs out to 79.6E and
carries the territory as Pakistan draws it. The build unions the two, so
the silhouette comes from Natural Earth and the coastline detail and
islands come from GADM.

    curl -sL -o /tmp/ne.geojson \
      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_pak.geojson

Then keep the largest polygon of the feature named `Pakistan`: the other
two are an offshore maritime claim near Gujarat and a coastal islet.

## Permissions and licences

- **GADM** (`gadm41_PAK_0.json`): GADM data is free for non-commercial use only unless the
  rights holder agrees otherwise. The client reports (2026-10-01) that they asked GADM and were told
  to go ahead. Written permission has not been seen by us: keep a copy here when the client provides
  it, and credit GADM wherever the boundary is shown.
- **Natural Earth** (`ne_pak_pov.json`): public domain.
- **OpenStreetMap** (`osm-roads.json`): ODbL. Credit "© OpenStreetMap contributors" wherever the
  roads are shown.
