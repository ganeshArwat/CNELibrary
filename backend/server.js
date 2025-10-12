// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const lunr = require("lunr");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// === CONFIG / ENV CHECKS ===
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
  console.error("Missing one of required env vars: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN");
  // Do not exit automatically in dev; still useful to continue for local debug.
}

// helper to return headers
function ghHeaders() {
  const headers = { "User-Agent": "express-app" };
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;
  return headers;
}

// === IN-MEMORY SEARCH ===
let idx = null; // Lunr index
let documents = []; // Store doc objects {id, filename, content, folder}

// === GITHUB HELPERS ===
async function fetchGitHubContents(repoPath = "") {
  // repoPath: '' returns root, else path like 'folder/subfolder'
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${DEFAULT_BRANCH}`;
  try {
    const { data } = await axios.get(url, { headers: ghHeaders() });
    return data;
  } catch (err) {
    // Provide helpful debug output
    if (err.response) {
      const status = err.response.status;
      const msg = err.response.data && err.response.data.message;
      throw new Error(`GitHub API error (${status}): ${msg || JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

async function fetchGitHubFile(filePath) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${DEFAULT_BRANCH}`;
  try {
    const { data } = await axios.get(url, { headers: ghHeaders() });
    if (data.type !== "file") throw new Error("Not a file");
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return decoded;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const msg = err.response.data && err.response.data.message;
      throw new Error(`GitHub file fetch error (${status}): ${msg || JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

// Build recursive tree (folders + all files)
async function buildTree(repoPath = "") {
  let items;
  try {
    items = await fetchGitHubContents(repoPath);
  } catch (err) {
    console.warn(`buildTree: failed to list path "${repoPath}" — ${err.message}`);
    return {}; // return empty so caller continues
  }

  const tree = {};
  for (const item of items) {
    try {
      if (item.type === "dir") {
        tree[item.name] = await buildTree(item.path);
      } else if (item.type === "file") {
        tree[item.name] = item.path;
      }
    } catch (err) {
      console.warn(`Skipping item ${item.path}: ${err.message}`);
      // continue
    }
  }
  return tree;
}

// === BUILD LUNR INDEX ===
async function buildIndex() {
  console.log("🔄 Building in-memory search index...");
  documents = []; // reset

  const tree = await buildTree("");
  async function collectDocs(treeNode, folderPath = "") {
    for (const [name, value] of Object.entries(treeNode)) {
      if (typeof value === "string") {
        try {
          const content = await fetchGitHubFile(value);
          documents.push({
            id: value,
            filename: name,
            content,
            folder: folderPath || "",
          });
        } catch (err) {
          console.warn(`collectDocs: failed to fetch file ${value} — ${err.message}`);
          // continue indexing others
        }
      } else {
        await collectDocs(value, folderPath ? `${folderPath}/${name}` : name);
      }
    }
  }

  await collectDocs(tree);

  try {
    idx = lunr(function () {
      this.ref("id");
      this.field("filename");
      this.field("content");
      for (const doc of documents) this.add(doc);
    });
    console.log(`✅ In-memory search index built: ${documents.length} documents`);
  } catch (err) {
    console.error("Failed to build lunr index:", err.message);
    idx = null;
  }
}

// === ROUTES ===

// GET /folders  -> top-level directories in repo root
app.get("/folders", async (req, res) => {
  try {
    const items = await fetchGitHubContents("");
    const folders = items.filter((i) => i.type === "dir").map((f) => f.name);
    return res.json(folders);
  } catch (err) {
    console.error("/folders error:", err.message);
    return res.status(500).json({ error: "Failed to read folders", details: err.message });
  }
});

// GET /files  -> list root files + folders
app.get("/files", async (req, res) => {
  try {
    const items = await fetchGitHubContents("");
    const result = items.map((i) => ({ name: i.name, type: i.type === "dir" ? "folder" : "file" }));
    return res.json(result);
  } catch (err) {
    console.error("/files error:", err.message);
    return res.status(500).json({ error: "Failed to read files", details: err.message });
  }
});

// helper for safe path encoding for GitHub API calls:
function encodeRepoPath(p) {
  if (!p) return "";
  return p.split("/").map(encodeURIComponent).join("/");
}

// GET /files/* => list folder (supports root when no path)
app.get(/^\/files(?:\/(.*))?$/, async (req, res) => {
  try {
    const folderPath = req.params[0] || ""; // the captured group
    const encodedPath = encodeRepoPath(folderPath);
    const items = await fetchGitHubContents(encodedPath);
    const result = items.map((i) => ({ name: i.name, type: i.type === "dir" ? "folder" : "file" }));
    res.json(result);
  } catch (err) {
    console.error(`/files/* error for path "${req.params[0]}":`, err.message);
    res.status(404).json({ error: "Folder not found", details: err.message });
  }
});

// GET /note/* => return file contents
app.get(/^\/note\/(.+)$/, async (req, res) => {
  try {
    const filePath = req.params[0]; // everything after /note/
    if (!filePath) return res.status(400).json({ error: "Missing file path" });

    const encodedPath = encodeRepoPath(filePath);
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${DEFAULT_BRANCH}`;
    const { data } = await axios.get(url, { headers: ghHeaders() });

    if (data.type !== "file") return res.status(400).json({ error: "Not a file" });

    const buffer = Buffer.from(data.content, "base64");
    const ext = (filePath.split(".").pop() || "").toLowerCase();

    if (ext === "pdf") res.setHeader("Content-Type", "application/pdf");
    else if (["md","txt","json","js","ts","css","html","cpp","c","py","java"].includes(ext))
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    else if (["png","jpg","jpeg","gif","bmp"].includes(ext))
      res.setHeader("Content-Type", `image/${ext === "jpg" ? "jpeg" : ext}`);
    else res.setHeader("Content-Type", "application/octet-stream");

    res.setHeader("Content-Disposition", `inline; filename="${filePath.split("/").pop()}"`);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    return res.send(buffer);
  } catch (err) {
    console.error(`/note/* error for path "${req.params[0]}":`, err.message);
    const details = err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message;
    return res.status(404).json({ error: "File not found", details });
  }
});

// GET /tree -> returns recursive tree (folders + files)
app.get("/tree", async (req, res) => {
  try {
    const tree = await buildTree("");
    return res.json(tree);
  } catch (err) {
    console.error("/tree error:", err.message);
    return res.status(500).json({ error: "Failed to scan repo tree", details: err.message });
  }
});

// GET /search?q=... -> simple lunr search
app.get("/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });
  if (!idx) return res.status(500).json({ error: "Index not ready" });

  try {
    const results = idx.search(query).map((r) => {
      const doc = documents.find((d) => d.id === r.ref);
      return {
        id: r.ref,
        filename: doc ? doc.filename : r.ref,
        folder: doc ? doc.folder : "",
        snippet: doc ? doc.content.substring(0, 200) + "..." : "",
      };
    });
    return res.json(results);
  } catch (err) {
    console.error("/search error:", err.message);
    return res.status(500).json({ error: "Search failed", details: err.message });
  }
});

// Start server and build index (non-blocking)
app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
  buildIndex().catch((e) => console.error("buildIndex failed:", e && e.message));
});
