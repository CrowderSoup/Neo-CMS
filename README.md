# neo-cms

Neo CMS is a lightweight, static content site starter built with NeoCities.org in mind. It ships as a single-page site with a tiny JS layer and a simple `content/` folder you can edit without build tools.

![Neo CMS screenshot](screenshot.png)

## What is this?

- A minimal, file-based CMS for small personal sites on NeoCities.
- Works with plain HTML, CSS, and JavaScript.
- Designed to be edited locally and uploaded to your NeoCities site.

## Quick start (NeoCities)

1. Create a NeoCities site if you do not have one yet.
2. Open `index.html` in a browser to preview locally.
3. Edit markdown or HTML files in `content/` to update pages.
4. Customize behavior and data loading in `neo-cms.js`.
5. Tweak styles in `style.css`.
6. Upload the updated files to your NeoCities site.

## IndieWeb support

Neo CMS ships with basic IndieWeb features using hosted services:

- IndieAuth identity links (`rel="me"`) so you can log into other sites.
- Webmentions for inbound comments/reactions (via `webmention.io`).

### IndieAuth identity

IndieAuth relies on `rel="me"` links in your HTML so other sites can verify your
identity. Add your profile links directly in `index.html` under the Rel=me
section. Neo CMS does not include a local login UI.

### Setup steps

1. Set your canonical site URL in `content/index.json`:

```
"url": "https://example.com"
```

2. Add `rel="me"` links to `index.html` so IndieAuth can verify your identity.
3. Register your site at `https://webmention.io/` and copy your endpoint.
4. Update both `content/index.json` and `index.html` with the webmention
   endpoints:

```
"webmentionEndpoint": "https://webmention.io/example.com/webmention"
```

```
<link rel="webmention" href="https://webmention.io/example.com/webmention" />
<link rel="pingback" href="https://webmention.io/example.com/xmlrpc" />
```

Neo CMS reads IndieWeb settings from `content/index.json` under
`site.indieweb`.

### Required environment variables

None. Neo CMS is a static site, so configuration lives in `index.html` and
`content/index.json`.

## Project links

- Live site: <https://crowdersoup.neocities.org/>

## License

MIT. See [`LICENSE`](LICENSE)
