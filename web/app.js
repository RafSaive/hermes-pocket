/* Hermes Pocket — client PWA pour Hermes Agent (API compatible OpenAI)
 * Auteur : Rafael Saive — lcn.ac — Licence MIT
 *
 * Parle à l'API server de Hermes (/v1/chat/completions, streaming SSE).
 * - Texte : collage natif, historique multi-conversations (localStorage).
 * - Photos/images : envoyées en vision (image_url base64).
 * - Documents (PDF, Word, txt, code…) : texte extrait dans le navigateur puis
 *   injecté dans le message (l'API Hermes n'accepte pas l'upload de fichiers).
 */
"use strict";

/* ---------- pdf.js worker ---------- */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ---------- Config ---------- */
const CFG_KEY = "hp_cfg";
const cfg = Object.assign(
  { base: "", model: "hermes-agent", key: "" },
  JSON.parse(localStorage.getItem(CFG_KEY) || "{}")
);
const saveCfg = () => localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
const apiBase = () => (cfg.base || "").replace(/\/+$/, "");
function authHeaders() {
  const h = { "Content-Type": "application/json" };
  if (cfg.key) h["Authorization"] = "Bearer " + cfg.key;
  return h;
}

/* ---------- Stockage des conversations ---------- */
const LIST_KEY = "hp_convs";
const ACTIVE_KEY = "hp_active";
const convKey = (id) => "hp_conv_" + id;
const loadList = () => JSON.parse(localStorage.getItem(LIST_KEY) || "[]");
const saveList = (l) => localStorage.setItem(LIST_KEY, JSON.stringify(l));
const loadMsgs = (id) => JSON.parse(localStorage.getItem(convKey(id)) || "[]");
const saveMsgs = (id, m) => localStorage.setItem(convKey(id), JSON.stringify(m));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let activeId = localStorage.getItem(ACTIVE_KEY) || null;
let messages = []; // {role, content, _display?}
let pending = []; // pièces jointes en attente {kind,name,dataURL?,text?}
let abort = null;

/* ---------- Éléments ---------- */
const $ = (s) => document.querySelector(s);
const log = $("#log"), input = $("#input"), composer = $("#composer");
const sendBtn = $("#sendBtn"), stopBtn = $("#stopBtn");
const tray = $("#attachTray"), convTitle = $("#convTitle");

/* ---------- Rendu markdown ---------- */
if (window.marked) marked.setOptions({ breaks: true, gfm: true });
function md(text) {
  const raw = window.marked ? marked.parse(text || "") : (text || "");
  return window.DOMPurify ? DOMPurify.sanitize(raw) : raw;
}

/* ---------- Affichage des messages ---------- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function scrollDown() { log.scrollTop = log.scrollHeight; }

function renderUser(m) {
  const d = el("div", "msg me");
  const disp = m._display || { text: typeof m.content === "string" ? m.content : "" };
  if (disp.text) d.appendChild(el("div", null, escapeHtml(disp.text).replace(/\n/g, "<br>")));
  (disp.files || []).forEach((f) =>
    d.appendChild(el("span", "filechip", "📎 " + escapeHtml(f)))
  );
  (disp.images || []).forEach((src) => {
    const img = el("img", "att"); img.src = src; d.appendChild(img);
  });
  log.appendChild(d);
}
function renderBot() {
  const d = el("div", "msg bot");
  log.appendChild(d);
  return d;
}
function finalizeBot(d, raw) {
  d.innerHTML = md(raw);
  enhanceCode(d);
  const tools = el("div", "msgtools");
  const cp = el("button", null, "⧉ Copier");
  cp.onclick = () => copyText(raw, cp, "⧉ Copier");
  tools.appendChild(cp);
  d.appendChild(tools);
}
function enhanceCode(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".codecopy")) return;
    const code = pre.querySelector("code") || pre;
    const b = el("button", "codecopy", "copier");
    b.onclick = () => copyText(code.innerText, b, "copier");
    pre.appendChild(b);
  });
}
function copyText(text, btn, label) {
  const ok = () => { btn.textContent = "✓"; setTimeout(() => (btn.textContent = label), 1200); };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(ok).catch(() => legacyCopy(text, ok));
  } else legacyCopy(text, ok);
}
function legacyCopy(text, ok) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.contentEditable = "true"; ta.readOnly = false;
  ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
  document.body.appendChild(ta);
  const range = document.createRange(); range.selectNodeContents(ta);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
  ta.setSelectionRange(0, text.length);
  try { document.execCommand("copy"); ok(); } catch (e) {}
  document.body.removeChild(ta);
}
function sys(text) { log.appendChild(el("div", "msg sys", escapeHtml(text))); scrollDown(); }
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderAll() {
  log.innerHTML = "";
  if (!messages.length) {
    sys("Nouvelle conversation avec Hermes. Écris, colle, ou joins une photo / un document.");
  }
  messages.forEach((m) => {
    if (m.role === "user") renderUser(m);
    else finalizeBot(renderBot(), m.content);
  });
  scrollDown();
}

/* ---------- Conversations ---------- */
function setActive(id) {
  activeId = id;
  localStorage.setItem(ACTIVE_KEY, id);
  messages = loadMsgs(id);
  const meta = loadList().find((c) => c.id === id);
  convTitle.textContent = meta ? meta.title : "Hermes";
  renderAll();
  renderConvList();
}
function newConv() {
  const id = uid();
  const list = loadList();
  list.unshift({ id, title: "Nouveau chat", updated: Date.now() });
  saveList(list);
  saveMsgs(id, []);
  setActive(id);
  closeDrawer();
  input.focus();
}
function touchConv(firstText) {
  const list = loadList();
  const c = list.find((x) => x.id === activeId);
  if (!c) return;
  c.updated = Date.now();
  if (c.title === "Nouveau chat" && firstText) c.title = firstText.slice(0, 40);
  list.sort((a, b) => b.updated - a.updated);
  saveList(list);
  convTitle.textContent = c.title;
  renderConvList();
}
function deleteConv(id) {
  localStorage.removeItem(convKey(id));
  let list = loadList().filter((c) => c.id !== id);
  saveList(list);
  if (id === activeId) {
    if (list.length) setActive(list[0].id);
    else newConv();
  } else renderConvList();
}
function renderConvList() {
  const ul = $("#convList");
  ul.innerHTML = "";
  loadList().forEach((c) => {
    const li = el("li", c.id === activeId ? "active" : "");
    const name = el("span", "name", escapeHtml(c.title));
    name.onclick = () => { setActive(c.id); closeDrawer(); };
    const del = el("button", "del", "🗑");
    del.onclick = (e) => { e.stopPropagation(); if (confirm("Supprimer cette conversation ?")) deleteConv(c.id); };
    li.appendChild(name); li.appendChild(del);
    ul.appendChild(li);
  });
}

/* ---------- Tiroir & réglages ---------- */
const drawer = $("#drawer"), scrim = $("#scrim");
function openDrawer() { drawer.hidden = false; scrim.hidden = false; }
function closeDrawer() { drawer.hidden = true; scrim.hidden = true; }
$("#menuBtn").onclick = openDrawer;
scrim.onclick = closeDrawer;
$("#newChatBtn").onclick = newConv;

const dlg = $("#settings");
$("#settingsBtn").onclick = () => {
  $("#setBase").value = cfg.base; $("#setModel").value = cfg.model; $("#setKey").value = cfg.key;
  dlg.showModal();
};
$("#setCancel").onclick = () => dlg.close();
$("#setSave").onclick = () => {
  cfg.base = $("#setBase").value.trim();
  cfg.model = $("#setModel").value.trim() || "hermes-agent";
  cfg.key = $("#setKey").value.trim();
  saveCfg(); dlg.close(); sys("Réglages enregistrés.");
};

/* ---------- Pièces jointes ---------- */
$("#attachBtn").onclick = () => $("#fileInput").click();
$("#camBtn").onclick = () => $("#camInput").click();
$("#fileInput").onchange = (e) => handleFiles(e.target.files);
$("#camInput").onchange = (e) => handleFiles(e.target.files);

async function handleFiles(files) {
  for (const f of files) {
    try {
      if (f.type.startsWith("image/")) {
        const dataURL = await downscaleImage(f);
        pending.push({ kind: "image", name: f.name, dataURL });
      } else {
        const text = await extractText(f);
        pending.push({ kind: "file", name: f.name, text });
      }
    } catch (err) {
      sys("Impossible de lire " + f.name + " : " + err.message);
    }
  }
  renderTray();
  updateSend();
}
function renderTray() {
  tray.innerHTML = "";
  tray.hidden = pending.length === 0;
  pending.forEach((p, i) => {
    const t = el("div", "thumb");
    if (p.kind === "image") { const img = el("img"); img.src = p.dataURL; t.appendChild(img); }
    else t.appendChild(el("span", null, "📎 " + escapeHtml(p.name)));
    const rm = el("button", "rm", "×");
    rm.onclick = () => { pending.splice(i, 1); renderTray(); updateSend(); };
    t.appendChild(rm);
    tray.appendChild(t);
  });
}
const readAsDataURL = (f) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f);
});
const readAsText = (f) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsText(f);
});
// Réduit une image côté navigateur avant envoi (évite les erreurs 413).
function downscaleImage(file, maxDim = 1568, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (Math.max(w, h) > maxDim) {
        const s = maxDim / Math.max(w, h);
        w = Math.round(w * s); h = Math.round(h * s);
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image illisible")); };
    img.src = url;
  });
}

async function extractText(f) {
  const name = f.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const buf = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const c = await page.getTextContent();
      out += c.items.map((i) => i.str).join(" ") + "\n\n";
    }
    return out.trim();
  }
  if (name.endsWith(".docx")) {
    const buf = await f.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: buf });
    return r.value.trim();
  }
  return (await readAsText(f)).trim(); // txt, md, csv, code, json…
}

/* ---------- Saisie ---------- */
function updateSend() {
  const has = input.value.trim().length > 0 || pending.length > 0;
  sendBtn.disabled = !has || !!abort;
}
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(140, input.scrollHeight) + "px";
  updateSend();
});
const coarse = window.matchMedia("(pointer: coarse)").matches;
input.enterKeyHint = coarse ? "enter" : "send";
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !coarse) {
    e.preventDefault(); composer.requestSubmit();
  }
});

/* ---------- Envoi ---------- */
composer.addEventListener("submit", (e) => { e.preventDefault(); send(); });
stopBtn.onclick = () => { if (abort) abort.abort(); };

async function send() {
  const text = input.value.trim();
  if ((!text && pending.length === 0) || abort) return;
  if (!activeId) newConv();

  // Construire le contenu API
  const parts = [];
  let combined = text;
  const fileNames = [];
  pending.filter((p) => p.kind === "file").forEach((p) => {
    fileNames.push(p.name);
    combined += `\n\n--- Fichier joint : ${p.name} ---\n${p.text}\n--- fin ${p.name} ---`;
  });
  if (combined.trim()) parts.push({ type: "text", text: combined.trim() });
  const imgs = pending.filter((p) => p.kind === "image");
  imgs.forEach((p) => parts.push({ type: "image_url", image_url: { url: p.dataURL } }));

  const apiContent = imgs.length ? parts : (combined.trim() || text);
  const userMsg = {
    role: "user",
    content: apiContent,
    _display: { text, files: fileNames, images: imgs.map((p) => p.dataURL) },
  };
  messages.push(userMsg);
  renderUser(userMsg);
  touchConv(text || fileNames[0] || "Image");

  // reset saisie
  input.value = ""; input.style.height = "auto";
  pending = []; renderTray();
  scrollDown();

  // état "en cours"
  abort = new AbortController();
  sendBtn.hidden = true; stopBtn.hidden = false; updateSend();

  const botEl = renderBot();
  botEl.classList.add("cursor");
  let acc = "";
  let toolEl = null;

  try {
    const res = await fetch(apiBase() + "/v1/chat/completions", {
      method: "POST",
      headers: authHeaders(),
      signal: abort.signal,
      body: JSON.stringify({
        model: cfg.model,
        stream: true,
        messages: messages.map(stripDisplay),
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error("HTTP " + res.status + (t ? " — " + t.slice(0, 200) : ""));
    }
    await parseSSE(res, (evt, data) => {
      if (evt === "hermes.tool.progress") {
        const tool = data.tool || data.name || "outil";
        if (!toolEl) { toolEl = el("div", "msg tool", ""); log.insertBefore(toolEl, botEl); }
        toolEl.textContent = "🔧 " + tool + "…";
        scrollDown();
        return;
      }
      const delta = data?.choices?.[0]?.delta?.content;
      if (delta) {
        acc += delta;
        botEl.innerHTML = md(acc);
        scrollDown();
      }
    });
  } catch (err) {
    if (err.name === "AbortError") acc += (acc ? "\n\n" : "") + "_(arrêté)_";
    else { botEl.classList.add("sys"); botEl.textContent = "Erreur : " + err.message; acc = ""; }
  } finally {
    if (toolEl) toolEl.remove();
    botEl.classList.remove("cursor");
    abort = null; sendBtn.hidden = false; stopBtn.hidden = true; updateSend();
    if (acc) {
      finalizeBot(botEl, acc);
      messages.push({ role: "assistant", content: acc });
    }
    saveMsgs(activeId, messages);
    scrollDown();
  }
}
const stripDisplay = (m) => ({ role: m.role, content: m.content });

/* ---------- Parseur SSE ---------- */
async function parseSSE(res, onEvent) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, idx); buf = buf.slice(idx + 2);
      let evt = "message"; const dataLines = [];
      block.split("\n").forEach((line) => {
        if (line.startsWith("event:")) evt = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      });
      const dataStr = dataLines.join("\n");
      if (!dataStr) continue;
      if (dataStr === "[DONE]") return;
      try { onEvent(evt, JSON.parse(dataStr)); } catch (_) { /* ignore keep-alive */ }
    }
  }
}

/* ---------- Démarrage ---------- */
(function init() {
  const list = loadList();
  if (!list.length) newConv();
  else setActive(activeId && list.find((c) => c.id === activeId) ? activeId : list[0].id);
  updateSend();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
