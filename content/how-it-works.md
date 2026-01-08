# How it works

This is a single HTML file that reads markdown files with `fetch()`.

## The flow

1. Open `content/index.json`.
2. Add a new entry with `title`, `file`, and `slug`.
3. Save your markdown file in `/content`.
4. Refresh the page.

## Why it is simple

- There is no build step.
- There is no database.
- You control the file structure.

> If you want to keep it even simpler, remove the descriptions and let the first `#` heading be the page title.

## IndieAuth identity

Neo CMS is an IndieAuth identity site. Add `rel="me"` links in `index.html` so
other sites can verify your identity when you sign in elsewhere. There is no
sign-in form on this site.

Update `content/index.json` with your live URL so webmention targets resolve
correctly:

```
"url": "https://example.com"
```

## Webmentions

Neo CMS uses [webmention.io](https://webmention.io/) to receive inbound
webmentions. Add your site on webmention.io, then paste the endpoint into
`content/index.json` and `index.html`:

```
"webmentionEndpoint": "https://webmention.io/example.com/webmention"
```

```
<link rel="webmention" href="https://webmention.io/example.com/webmention" />
<link rel="pingback" href="https://webmention.io/example.com/xmlrpc" />
```

When another site links to a page, its webmention appears beneath the content as
a reaction (like, repost, reply) or comment.

If a page needs a custom target URL, add a `url` field to its entry in
`content/index.json`. Neo CMS uses it when querying webmention.io.
