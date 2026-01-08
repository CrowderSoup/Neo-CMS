const manifestPath = "content/index.json";
const nav = document.getElementById("nav");
const content = document.getElementById("content");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const pageStatus = document.getElementById("page-status");
const siteTitle = document.getElementById("site-title");
const siteTagline = document.getElementById("site-tagline");
const siteFooter = document.getElementById("site-footer");
const webmentions = document.getElementById("webmentions");

let manifest = null;

const indieweb = {
  siteUrl: "",
  webmentionEndpoint: "",
};

const readHeadLink = (rel) => {
  const link = document.querySelector(`link[rel="${rel}"]`);
  return link?.getAttribute("href") || "";
};

const escapeHtml = (input) =>
  String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const parseMarkdown = (raw) => {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let buffer = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!buffer.length) return;
    const paragraph = buffer.join(" ").trim();
    if (paragraph) {
      blocks.push(`<p>${inlineMarkdown(paragraph)}</p>`);
    }
    buffer = [];
  };

  const inlineMarkdown = (text) => {
    let html = escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    );
    return html;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push(`<pre><code>${escapeHtml(buffer.join("\n"))}</code></pre>`);
        buffer = [];
        inCode = false;
        codeLang = "";
      } else {
        flushParagraph();
        inCode = true;
        buffer = [];
      }
      continue;
    }

    if (inCode) {
      buffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      flushParagraph();
      const level = line.match(/^#+/)[0].length;
      blocks.push(
        `<h${level}>${inlineMarkdown(line.replace(/^#{1,3}\s/, ""))}</h${level}>`,
      );
      continue;
    }

    if (/^>\s/.test(line)) {
      flushParagraph();
      blocks.push(
        `<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`,
      );
      continue;
    }

    if (/^(-|\*|\+)\s+/.test(line)) {
      flushParagraph();
      const items = [line];
      while (i + 1 < lines.length && /^(-|\*|\+)\s+/.test(lines[i + 1])) {
        items.push(lines[i + 1]);
        i += 1;
      }
      const htmlItems = items
        .map(
          (item) =>
            `<li>${inlineMarkdown(item.replace(/^(-|\*|\+)\s+/, ""))}</li>`,
        )
        .join("");
      blocks.push(`<ul>${htmlItems}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      const items = [line];
      while (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1])) {
        items.push(lines[i + 1]);
        i += 1;
      }
      const htmlItems = items
        .map(
          (item) => `<li>${inlineMarkdown(item.replace(/^\d+\.\s+/, ""))}</li>`,
        )
        .join("");
      blocks.push(`<ol>${htmlItems}</ol>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph();
      blocks.push("<hr />");
      continue;
    }

    buffer.push(line.trim());
  }

  if (inCode) {
    blocks.push(`<pre><code>${escapeHtml(buffer.join("\n"))}</code></pre>`);
  } else {
    flushParagraph();
  }

  return blocks.join("");
};

const setStatus = (text) => {
  pageStatus.textContent = text;
};

const formatMentionDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getPageUrl = (page, slug) => {
  if (page?.url) return page.url;
  const origin = window.location.origin;
  const fallbackBase =
    origin === "null" ? "" : `${origin}${window.location.pathname}`;
  const base = indieweb.siteUrl || fallbackBase;
  if (!base) return "";
  const baseUrl = base.replace(/#.*$/, "");
  return `${baseUrl}#${slug}`;
};

const getMentionType = (mention) => {
  const property = mention["wm-property"];
  const map = {
    "like-of": "Like",
    "repost-of": "Repost",
    "bookmark-of": "Bookmark",
    "in-reply-to": "Reply",
    "mention-of": "Mention",
  };
  return map[property] || "Mention";
};

const getMentionBody = (mention) => {
  const property = mention["wm-property"];
  const actionMap = {
    "like-of": "liked this.",
    "repost-of": "reposted this.",
    "bookmark-of": "bookmarked this.",
    "in-reply-to": "replied:",
    "mention-of": "mentioned this.",
  };
  return (
    mention.content?.text || mention.content?.html || actionMap[property] || ""
  );
};

const renderWebmentions = (mentions, targetUrl) => {
  if (!webmentions) return;
  if (!indieweb.webmentionEndpoint) {
    webmentions.innerHTML = `
      <h2>Webmentions</h2>
      <p class="webmentions-summary">
        Webmentions are disabled until you set a webmention endpoint.
      </p>
    `;
    return;
  }
  const count = mentions.length;
  if (!count) {
    webmentions.innerHTML = `
      <h2>Webmentions</h2>
      <p class="webmentions-summary">
        No webmentions yet. When another site links to ${escapeHtml(
          targetUrl,
        )}, it will show up here.
      </p>
    `;
    return;
  }
  const items = mentions
    .map((mention) => {
      const author = mention.author || {};
      const authorName =
        author.name || author.url || mention.url || "Anonymous";
      const authorUrl = author.url || mention.url || "#";
      const body = getMentionBody(mention);
      const date =
        formatMentionDate(mention.published) ||
        formatMentionDate(mention["wm-received"]);
      return `
        <li class="webmention-item">
          <div class="webmention-meta">${getMentionType(mention)}${
            date ? ` · ${date}` : ""
          }</div>
          <div class="webmention-body">
            <a href="${escapeHtml(authorUrl)}" target="_blank" rel="noopener">
              ${escapeHtml(authorName)}
            </a>
            ${body ? ` - ${escapeHtml(body)}` : ""}
          </div>
        </li>
      `;
    })
    .join("");
  webmentions.innerHTML = `
    <h2>Webmentions</h2>
    <p class="webmentions-summary">
      ${count} mention${count === 1 ? "" : "s"} for ${escapeHtml(targetUrl)}.
    </p>
    <ul class="webmention-list">${items}</ul>
  `;
};

const loadWebmentions = async (page, slug) => {
  if (!webmentions) return;
  const targetUrl = getPageUrl(page, slug);
  if (!targetUrl) {
    webmentions.innerHTML = `
      <h2>Webmentions</h2>
      <p class="webmentions-summary">
        Webmentions are unavailable on local previews.
      </p>
    `;
    return;
  }
  if (!indieweb.webmentionEndpoint) {
    renderWebmentions([], targetUrl);
    return;
  }
  webmentions.innerHTML = `
    <h2>Webmentions</h2>
    <p class="webmentions-summary">Loading webmentions...</p>
  `;
  try {
    const apiUrl = `https://webmention.io/api/mentions.jf2?target=${encodeURIComponent(
      targetUrl,
    )}`;
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Webmention request failed");
    const data = await response.json();
    const mentions = (data.children || []).slice().sort((a, b) => {
      const dateA = new Date(a.published || a["wm-received"] || 0);
      const dateB = new Date(b.published || b["wm-received"] || 0);
      return dateB - dateA;
    });
    renderWebmentions(mentions, targetUrl);
  } catch (error) {
    webmentions.innerHTML = `
      <h2>Webmentions</h2>
      <p class="webmentions-summary">
        Could not load webmentions for this page.
      </p>
    `;
  }
};

const renderNav = () => {
  nav.innerHTML = "";
  manifest.sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "nav-section";
    sectionEl.innerHTML = `<h3>${section.title}</h3>`;

    const links = document.createElement("div");
    links.className = "nav-links";

    section.items.forEach((item) => {
      const slug = item.slug || slugify(item.title || item.file);
      item.slug = slug;
      const link = document.createElement("a");
      link.href = `#${slug}`;
      link.textContent = item.title || slug;
      link.dataset.slug = slug;
      links.appendChild(link);
    });

    sectionEl.appendChild(links);
    nav.appendChild(sectionEl);
  });
};

const markActiveLink = (slug) => {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.toggle("active", link.dataset.slug === slug);
  });
};

const findPage = (slug) => {
  for (const section of manifest.sections) {
    for (const item of section.items) {
      if (item.slug === slug) return item;
    }
  }
  return null;
};

const renderEmpty = (message) => {
  content.innerHTML = `<div class="empty">${message}</div>`;
};

const loadPage = async () => {
  if (!manifest) return;
  const slug =
    location.hash.replace("#", "") || manifest.sections[0].items[0].slug;
  const page = findPage(slug);
  markActiveLink(slug);

  if (!page) {
    pageTitle.textContent = "Missing page";
    pageSubtitle.textContent =
      "The link you followed does not exist in content/index.json.";
    setStatus("Not found");
    renderEmpty(
      "Add the page back into <code>content/index.json</code> or pick another link.",
    );
    if (webmentions) {
      webmentions.innerHTML = "";
    }
    return;
  }

  currentPage = page;
  pageTitle.textContent = page.title || "Untitled";
  pageSubtitle.textContent = page.description || "";
  setStatus("Loading");

  try {
    const response = await fetch(`content/${page.file}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Missing file");
    }
    const raw = await response.text();
    const html = parseMarkdown(raw);
    content.innerHTML = html || "<p>Empty page.</p>";
    const headingMatch = raw.match(/^#\s+(.+)$/m);
    if (!page.title && headingMatch) {
      pageTitle.textContent = headingMatch[1].trim();
    }
    setStatus("Loaded");
    loadWebmentions(page, slug);
  } catch (error) {
    pageTitle.textContent = "Missing file";
    pageSubtitle.textContent = `Could not load content/${page.file}.`;
    setStatus("Error");
    renderEmpty(
      "Create the file or fix the filename in <code>content/index.json</code>.",
    );
    if (webmentions) {
      webmentions.innerHTML = "";
    }
  }
};

const loadManifest = async () => {
  try {
    const response = await fetch(manifestPath, { cache: "no-store" });
    if (!response.ok) throw new Error("Missing manifest");
    manifest = await response.json();

    siteTitle.textContent = manifest.site?.title || "Neo CMS";
    siteTagline.textContent = manifest.site?.tagline || siteTagline.textContent;
    siteFooter.textContent = manifest.site?.footer || "";
    indieweb.webmentionEndpoint =
      readHeadLink("webmention") || indieweb.webmentionEndpoint;
    const siteConfig = manifest.site || {};
    const indiewebConfig = siteConfig.indieweb || {};
    indieweb.siteUrl = siteConfig.url || indieweb.siteUrl;
    indieweb.webmentionEndpoint =
      indiewebConfig.webmentionEndpoint || indieweb.webmentionEndpoint;
    renderNav();
    await loadPage();
  } catch (error) {
    pageTitle.textContent = "Manifest missing";
    pageSubtitle.textContent =
      "Create content/index.json to map your markdown files.";
    setStatus("Setup");
    renderEmpty(
      "Create <code>content/index.json</code> and point it at markdown files. Use the sample in this repo as a template.",
    );
    indieweb.webmentionEndpoint =
      readHeadLink("webmention") || indieweb.webmentionEndpoint;
  }
};

window.addEventListener("hashchange", loadPage);
loadManifest();
