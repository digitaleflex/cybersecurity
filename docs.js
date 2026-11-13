import { DOCUMENTS, docTitle, docURL } from "./js/docs-index.js";

(() => {
  "use strict";


  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(window.location.search);
  const requestedPath = params.get("doc") || "README.md";
  const known = DOCUMENTS.find((item) => item.path === requestedPath);
  const current = known || DOCUMENTS[0];
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const slugify = (value) => String(value)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

  function buildNavigation(filter = "") {
    const nav = $("#docsNav");
    const query = filter.trim().toLocaleLowerCase("fr");
    const visible = DOCUMENTS.filter((item) => !query || item.title.toLocaleLowerCase("fr").includes(query) || item.group.toLocaleLowerCase("fr").includes(query));
    const groups = [...new Set(visible.map((item) => item.group))];
    nav.innerHTML = groups.map((group) => {
      const items = visible.filter((item) => item.group === group);
      const compact = window.matchMedia("(max-width: 860px)").matches; // mobile : seul le groupe courant est déplié
      const open = Boolean(query) || items.some((item) => item.path === current.path) || (!compact && !/^\d\d ·/.test(group));
      return `<details class="docs-nav-group"${open ? " open" : ""}><summary class="docs-nav-label">${esc(group)} <span class="docs-nav-n">${items.length}</span></summary>${items.map((item) =>
        `<a class="docs-nav-link ${item.path === current.path ? "is-active" : ""}" href="${docURL(item.path)}" ${item.path === current.path ? 'aria-current="page"' : ""}>${esc(item.title)}</a>`
      ).join("")}</details>`;
    }).join("") || '<p class="docs-nav-empty">Aucun document correspondant.</p>';
  }

  function createMarkdownParser() {
    if (!window.markdownit || !window.DOMPurify) {
      throw new Error("Le moteur Markdown ou le filtre de sécurité n'a pas pu être chargé. Vérifie ta connexion puis recharge la page.");
    }
    const renderer = window.markdownit({
      html: false,
      linkify: true,
      typographer: true,
      breaks: false,
      quotes: "«»“”",
      highlight: (code, language) => {
        const escaped = window.markdownit().utils.escapeHtml(code);
        return language
          ? `<pre class="language-${language.replace(/[^a-z0-9_-]/gi, "")}"><code>${escaped}</code></pre>`
          : `<pre><code>${escaped}</code></pre>`;
      }
    });

    const defaultHeading = renderer.renderer.rules.heading_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    renderer.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
      const inline = tokens[idx + 1];
      const label = inline?.content || "section";
      const base = slugify(label);
      env.headingCounts ||= {};
      env.headingCounts[base] = (env.headingCounts[base] || 0) + 1;
      const id = env.headingCounts[base] > 1 ? `${base}-${env.headingCounts[base]}` : base;
      tokens[idx].attrSet("id", id);
      return defaultHeading(tokens, idx, options, env, self);
    };

    const defaultLink = renderer.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    renderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const href = tokens[idx].attrGet("href") || "";
      if (/^https?:\/\//i.test(href)) {
        tokens[idx].attrSet("target", "_blank");
        tokens[idx].attrSet("rel", "noopener noreferrer");
      }
      return defaultLink(tokens, idx, options, env, self);
    };
    return renderer;
  }

  function rewriteDocumentLinks(root) {
    const siteBase = new URL(".", window.location.href).pathname;
    root.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) return;
      const [rawPath, rawHash = ""] = href.split("#");
      if (!rawPath) return;
      const hash = rawHash ? `#${rawHash}` : "";
      let relative;
      try {
        const resolved = new URL(rawPath, new URL(current.path, window.location.href)).pathname;
        relative = decodeURIComponent(resolved.startsWith(siteBase) ? resolved.slice(siteBase.length) : resolved).replace(/^\/+/, "");
      } catch {
        return;
      }
      const asFolder = `${relative.replace(/\/+$/, "")}/README.md`;
      const target = DOCUMENTS.find((item) => item.path === relative || item.path === asFolder);
      if (target) {
        link.href = docURL(target.path, hash);
      } else if (/\.md$/i.test(relative)) {
        link.classList.add("docs-link-unavailable");
        link.title = "Ce document n'est pas disponible dans le lecteur.";
      } else if (!relative.startsWith("..")) {
        link.href = `${relative}${hash}`; // fichier du site (index.html, data/resources.json…) résolu depuis la racine
      }
    });
  }

  function buildToc(root) {
    const headings = [...root.querySelectorAll("h2[id], h3[id]")];
    const markup = headings.map((heading) =>
      `<a class="docs-toc-link level-${heading.tagName.toLowerCase()}" href="#${encodeURIComponent(heading.id)}">${heading.textContent}</a>`
    ).join("");
    $("#docsToc").innerHTML = markup || '<span class="docs-toc-empty">Aucun titre secondaire.</span>';
    $("#documentToc").innerHTML = markup ? `<details><summary>Sommaire du document</summary>${markup}</details>` : "";
    $("#documentToc").hidden = !markup;
  }

  function addCodeTools(root) {
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.parentElement.classList.contains("code-block")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.append(pre);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "Copier";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          button.textContent = "Copié";
          window.setTimeout(() => { button.textContent = "Copier"; }, 1400);
        } catch {
          button.textContent = "Copie indisponible";
        }
      });
      wrapper.append(button);
    });
  }

  async function loadDocument() {
    const status = $("#docsStatus");
    const content = $("#documentContent");
    $("#breadcrumbTitle").textContent = known ? docTitle(current) : "Document introuvable";
    $("#sourceLink").href = `https://github.com/digitaleflex/cybersecurity/blob/main/${current.path}`;
    document.title = `${known ? docTitle(current) : "Document introuvable"} — HashCode Cyber Library`;
    buildNavigation();
    if (!known) {
      status.hidden = false;
      status.className = "docs-status is-error";
      status.textContent = `Le document « ${requestedPath.slice(0, 80)} » n'existe pas dans la documentation. Choisis un document dans la liste.`;
      content.innerHTML = "";
      $("#documentToc").hidden = true;
      return;
    }

    try {
      const [response, parser] = await Promise.all([
        fetch(current.path, { headers: { Accept: "text/markdown, text/plain;q=0.9" } }),
        Promise.resolve(createMarkdownParser())
      ]);
      if (!response.ok) throw new Error(`Impossible de charger le document (HTTP ${response.status}).`);
      const markdown = await response.text();
      if (!markdown.trim()) throw new Error("Ce document est vide.");
      const unsafeHtml = parser.render(markdown, { headingCounts: {} });
      const safeHtml = window.DOMPurify.sanitize(unsafeHtml, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ["target", "rel", "id"],
        FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
        FORBID_ATTR: ["style", "onerror", "onclick", "onload"]
      });
      content.innerHTML = safeHtml;
      rewriteDocumentLinks(content);
      addCodeTools(content);
      buildToc(content);
      status.hidden = true;
      const anchor = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (anchor) anchor.scrollIntoView({ block: "start" });
      else content.focus({ preventScroll: true });
    } catch (error) {
      console.error(error);
      status.hidden = false;
      status.className = "docs-status is-error";
      status.textContent = error.message || "Une erreur est survenue pendant le rendu du document.";
      content.innerHTML = '<p>Tu peux consulter la version source sur <a href="https://github.com/digitaleflex/cybersecurity" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>';
    }
  }

  $("#docsSearch").addEventListener("input", (event) => buildNavigation(event.target.value));
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash) {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", link.hash);
      }
    }
  });

  loadDocument();
})();
