# useful-sites

Static tools directory page built with plain HTML/CSS/JS.

## Open locally

1. Open [`useful-site.html`](./useful-site.html) in a browser.
2. Local file mode also works because the page includes a bundled data fallback.

## Features

- Public URL access (no login required for viewers)
- Search + category filter
- Read-only listing sourced from `websites.json`
- Add / edit / delete requests through GitHub Issues

## Data behavior

- The site reads directly from `websites.json`.
- Browser-side editing is intentionally disabled.
- To change the shared list, open a GitHub Issue using the built-in add/edit/delete buttons.
- A GitHub Actions workflow processes supported issue forms and updates `websites.json` plus `websites-data.js`.

## Deploy with GitHub Pages (free)

1. Push this repo to GitHub.
2. In GitHub repo: `Settings -> Pages`.
3. Set source to your main branch (root folder).
4. Open the published URL (for example `https://<username>.github.io/<repo>/`).

## Custom domain

- You can use your own domain instead of `https://<username>.github.io`.
- In `Settings -> Pages`, set a custom domain.
- Then point your DNS records to GitHub Pages.
- If you want the apex domain, use `A` / `AAAA` records.
- If you want a subdomain such as `tools.example.com`, use a `CNAME` record.

## JSON format

This app reads the existing category-object format in `websites.json`.
Each entry currently uses:

- `name`
- `url`
- `desc`
- `pick.frequently`
