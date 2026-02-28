// index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const lunr = require("lunr");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// === CONFIG / ENV CHECKS ===
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USE_LOCAL = /^(true|1|yes)$/i.test(process.env.USE_LOCAL || "");
const LOCAL_PATH = process.env.LOCAL_PATH || "";

if (USE_LOCAL) {
  console.log("📁 Local mode: serving from", LOCAL_PATH || "(LOCAL_PATH not set)");
  if (!LOCAL_PATH || !fs.existsSync(LOCAL_PATH)) {
    console.error("LOCAL_PATH must point to an existing folder. Current:", LOCAL_PATH);
  }
} else if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
  console.error("Missing one of required env vars: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN");
}

// helper to return headers
function ghHeaders() {
  const headers = { "User-Agent": "express-app" };
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;
  return headers;
}

// Skip these folders when scanning locally (saves memory, avoids binary blobs)
const LOCAL_SKIP_DIRS = new Set([".git", "node_modules", "__pycache__", ".next", "dist", "build", ".venv", "venv"]);

// Only index these text extensions (skip PDFs, images, binaries)
const INDEXABLE_EXT = new Set(["md", "txt", "cpp", "c", "py", "java", "js", "ts", "json", "html", "css", "yaml", "yml"]);
const MAX_INDEX_FILE_SIZE = 500 * 1024; // 500KB max per file for search index

// === LOCAL FILE HELPERS (when USE_LOCAL=true) ===
function readLocalContents(repoPath = "") {
  const fullPath = path.join(LOCAL_PATH, ...repoPath.split("/").filter(Boolean));
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    throw new Error(`Directory not found: ${repoPath}`);
  }
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  return entries
    .filter((e) => !e.isDirectory() || (!LOCAL_SKIP_DIRS.has(e.name) && !e.name.startsWith("."))) // skip .git, node_modules, hidden dirs
    .map((e) => ({
      name: e.name,
      type: e.isDirectory() ? "dir" : "file",
      path: repoPath ? `${repoPath}/${e.name}` : e.name,
    }));
}

function readLocalFile(filePath) {
  const fullPath = path.join(LOCAL_PATH, ...filePath.split("/").filter(Boolean));
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, "utf-8");
}

function readLocalFileBuffer(filePath) {
  const fullPath = path.join(LOCAL_PATH, ...filePath.split("/").filter(Boolean));
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath);
}

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

// Unified fetch: use local or GitHub based on USE_LOCAL
async function fetchContents(repoPath) {
  if (USE_LOCAL && LOCAL_PATH) {
    return readLocalContents(repoPath);
  }
  return fetchGitHubContents(repoPath);
}

async function fetchFile(filePath) {
  if (USE_LOCAL && LOCAL_PATH) {
    return readLocalFile(filePath);
  }
  return fetchGitHubFile(filePath);
}

// Build recursive tree (folders + all files)
async function buildTree(repoPath = "") {
  let items;
  try {
    items = await fetchContents(repoPath);
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
        // In local mode: skip large or non-indexable files to avoid OOM
        if (USE_LOCAL && LOCAL_PATH) {
          const ext = name.split(".").pop()?.toLowerCase() || "";
          if (!INDEXABLE_EXT.has(ext)) continue;
          const fullPath = path.join(LOCAL_PATH, ...value.split("/").filter(Boolean));
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > MAX_INDEX_FILE_SIZE) continue;
          } catch {
            continue;
          }
        }
        try {
          const content = await fetchFile(value);
          documents.push({
            id: value,
            filename: name,
            content,
            folder: folderPath || "",
            fullPath: folderPath ? `${folderPath}/${name}` : name,
          });
        } catch (err) {
          console.warn(`collectDocs: failed to fetch file ${value} — ${err.message}`);
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
      this.field("filename", { boost: 10 }); // Boost filename matches
      this.field("content", { boost: 1 });
      this.field("folder", { boost: 5 }); // Boost folder matches
      this.field("fullPath", { boost: 3 }); // Boost full path matches
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
    const items = await fetchContents("");
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
    const items = await fetchContents("");
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
    const items = await fetchContents(encodedPath);
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
    const filePath = decodeURIComponent(req.params[0]);
    if (!filePath) return res.status(400).json({ error: "Missing file path" });

    const ext = (filePath.split(".").pop() || "").toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (["md","txt","json","js","ts","css","html","cpp","c","py","java"].includes(ext))
      contentType = "text/plain; charset=utf-8";
    else if (["png","jpg","jpeg","gif","bmp"].includes(ext))
      contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filePath.split("/").pop()}"`);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    // LOCAL MODE: serve from disk
    if (USE_LOCAL && LOCAL_PATH) {
      const buffer = readLocalFileBuffer(filePath);
      res.send(buffer);
      return;
    }

    // GITHUB MODE
    const encodedPath = encodeRepoPath(filePath);
    const metaUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${DEFAULT_BRANCH}`;
    const { data } = await axios.get(metaUrl, { headers: ghHeaders() });

    if (data.type !== "file") return res.status(400).json({ error: "Not a file" });

    // 🔹 CASE 1: small files (under ~1 MB, GitHub returns Base64)
    if (data.content) {
      const buffer = Buffer.from(data.content, "base64");
      res.send(buffer);
      return;
    }

    // 🔹 CASE 2: large files — stream from download_url
    if (data.download_url) {
      const response = await axios({
        url: data.download_url,
        method: "GET",
        responseType: "stream",
      });

      response.data.pipe(res);
      response.data.on("error", (err) => {
        console.error("Stream error:", err.message);
        res.destroy(err);
      });

      return;
    }

    throw new Error("File content not available");
  } catch (err) {
    console.error(`/note/* error for path "${req.params[0]}":`, err.message);
    const details =
      err.response?.data?.message || err.message;
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

// Helper function to generate snippet with context around search term
function generateSnippet(content, query, maxLength = 200) {
  if (!content || !query) {
    return content ? content.substring(0, maxLength) + "..." : "";
  }

  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Find first occurrence of query
  const index = contentLower.indexOf(queryLower);
  
  if (index === -1) {
    // If exact match not found, try word boundary search
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);
    let foundIndex = -1;
    for (const word of words) {
      const wordIndex = contentLower.indexOf(word);
      if (wordIndex !== -1) {
        foundIndex = wordIndex;
        break;
      }
    }
    
    if (foundIndex === -1) {
      return content.substring(0, maxLength) + "...";
    }
    
    const start = Math.max(0, foundIndex - 50);
    const end = Math.min(content.length, foundIndex + maxLength - 50);
    let snippet = content.substring(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";
    return snippet;
  }
  
  // Extract context around the match
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + maxLength - 50);
  let snippet = content.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

// GET /search?q=...&folder=... -> enhanced lunr search with optional folder filter
app.get("/search", (req, res) => {
  const query = req.query.q;
  const folderFilter = req.query.folder; // Optional folder filter
  if (!query) return res.status(400).json({ error: "Missing search query" });
  if (!idx) return res.status(500).json({ error: "Index not ready" });

  try {
    // Enhanced search query - add wildcards for partial matches
    let searchQuery = query.trim();
    
    // Split query into terms and add wildcards for better matching
    const terms = searchQuery.split(/\s+/).filter(t => t.length > 0);
    const enhancedQuery = terms
      .map(term => {
        // Add wildcard if term doesn't already have one
        if (!term.includes('*')) {
          return term + '*';
        }
        return term;
      })
      .join(' ');
    
    let searchResults;
    try {
      // Try enhanced query first
      searchResults = idx.search(enhancedQuery);
    } catch (err) {
      // Fallback to original query if enhanced fails
      try {
        searchResults = idx.search(searchQuery);
      } catch (fallbackErr) {
        // If both fail, try simple term matching
        searchResults = idx.search(terms.join(' '));
      }
    }
    
    // Also do a direct content search for exact matches (case-insensitive)
    const directMatches = documents
      .filter(doc => {
        const searchLower = searchQuery.toLowerCase();
        const matchesContent = (
          doc.filename.toLowerCase().includes(searchLower) ||
          doc.content.toLowerCase().includes(searchLower) ||
          doc.folder.toLowerCase().includes(searchLower) ||
          (doc.fullPath && doc.fullPath.toLowerCase().includes(searchLower))
        );
        
        // Apply folder filter if provided
        if (folderFilter) {
          const folderLower = folderFilter.toLowerCase();
          const docFolderLower = doc.folder.toLowerCase();
          const docFullPathLower = doc.fullPath ? doc.fullPath.toLowerCase() : '';
          // Match if folder starts with the filter or is exactly the filter
          const matchesFolder = docFolderLower === folderLower || 
                                docFolderLower.startsWith(folderLower + '/') ||
                                docFullPathLower.startsWith(folderLower + '/');
          return matchesContent && matchesFolder;
        }
        
        return matchesContent;
      })
      .map(doc => ({
        ref: doc.id,
        score: 1.5, // Boost direct matches
      }));
    
    // Merge and deduplicate results
    const allResults = [...searchResults];
    for (const directMatch of directMatches) {
      if (!allResults.find(r => r.ref === directMatch.ref)) {
        allResults.push(directMatch);
      }
    }
    
    // Filter by folder if provided
    let filteredResults = allResults;
    if (folderFilter) {
      filteredResults = allResults.filter(r => {
        const doc = documents.find((d) => d.id === r.ref);
        if (!doc) return false;
        const folderLower = folderFilter.toLowerCase();
        const docFolderLower = doc.folder.toLowerCase();
        const docFullPathLower = doc.fullPath ? doc.fullPath.toLowerCase() : '';
        // Match if folder starts with the filter or is exactly the filter
        return docFolderLower === folderLower || 
               docFolderLower.startsWith(folderLower + '/') ||
               docFullPathLower.startsWith(folderLower + '/');
      });
    }
    
    // Sort by score (highest first)
    filteredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Limit results to top 50
    const limitedResults = filteredResults.slice(0, 50);
    
    const formattedResults = limitedResults.map((r) => {
      const doc = documents.find((d) => d.id === r.ref);
      if (!doc) {
        return {
          id: r.ref,
          filename: r.ref.split('/').pop() || r.ref,
          folder: "",
          snippet: "",
          score: r.score || 0,
        };
      }
      
      return {
        id: r.ref,
        filename: doc.filename,
        folder: doc.folder || "",
        fullPath: doc.fullPath || (doc.folder ? `${doc.folder}/${doc.filename}` : doc.filename),
        snippet: generateSnippet(doc.content, query),
        score: r.score || 0,
      };
    });
    
    return res.json(formattedResults);
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
