require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const lunr = require("lunr");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// === CONFIG ===
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// === IN-MEMORY SEARCH ===
let idx; // Lunr index
let documents = []; // Store note content

// === GITHUB HELPERS ===

async function fetchGitHubContents(repoPath = "") {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${DEFAULT_BRANCH}`;
  const { data } = await axios.get(url, {
    headers: { 
      "User-Agent": "express-app",
      "Authorization": `token ${GITHUB_TOKEN}` // Add this line
    },
  });
  return data;
}

async function fetchGitHubFile(filePath) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${DEFAULT_BRANCH}`;
  const { data } = await axios.get(url, {
    headers: { 
      "User-Agent": "express-app",
      "Authorization": `token ${GITHUB_TOKEN}`
    },
  });
  if (data.type !== "file") throw new Error("Not a file");
  return Buffer.from(data.content, "base64").toString("utf-8");
}

// Build recursive tree (folders + .md files only)
async function buildTree(repoPath = "") {
  const items = await fetchGitHubContents(repoPath);
  const tree = {};

  for (const item of items) {
    if (item.type === "dir") {
      tree[item.name] = await buildTree(item.path);
    } else if (item.type === "file" && item.name.endsWith(".md")) {
      tree[item.name] = item.path;
    }
  }

  return tree;
}

// === BUILD LUNR INDEX ===
async function buildIndex() {
  console.log("🔄 Building in-memory search index...");

  const tree = await buildTree("");

  async function collectDocs(tree, folderPath = "") {
    for (const [name, value] of Object.entries(tree)) {
      if (typeof value === "string") {
        const content = await fetchGitHubFile(value);
        documents.push({
          id: value,
          filename: name,
          content,
          folder: folderPath,
        });
      } else {
        await collectDocs(value, `${folderPath}/${name}`);
      }
    }
  }

  await collectDocs(tree);

  idx = lunr(function () {
    this.ref("id");
    this.field("filename");
    this.field("content");
    documents.forEach((doc) => this.add(doc));
  });

  console.log("✅ In-memory search index built");
}

// === ROUTES ===

// List top-level folders
app.get("/folders", async (req, res) => {
  try {
    const items = await fetchGitHubContents("");
    const folders = items.filter((i) => i.type === "dir").map((f) => f.name);
    res.json(folders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to read folders" });
  }
});

// List files/subfolders in a folder
app.get("/files/:folder", async (req, res) => {
  try {
    const folder = req.params.folder;
    const items = await fetchGitHubContents(folder);
    const result = items.map((i) => ({
      name: i.name,
      type: i.type === "dir" ? "folder" : "file",
    }));
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(404).json({ error: "Folder not found" });
  }
});

// Return Markdown content
app.get("/note/:folder/:file", async (req, res) => {
  try {
    const { folder, file } = req.params;
    const filePath = `${folder}/${file}`;
    const content = await fetchGitHubFile(filePath);
    res.send(content);
  } catch (err) {
    console.error(err.message);
    res.status(404).json({ error: "Note not found" });
  }
});

// Full recursive tree
app.get("/tree", async (req, res) => {
  try {
    const tree = await buildTree("");
    res.json(tree);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to scan repo tree" });
  }
});

// Search notes in-memory
app.get("/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });
  if (!idx) return res.status(500).json({ error: "Index not ready" });

  const results = idx.search(query).map((r) => {
    const doc = documents.find((d) => d.id === r.ref);
    return {
      id: r.ref,
      filename: doc.filename,
      folder: doc.folder,
      snippet: doc.content.substring(0, 200) + "...",
    };
  });

  res.json(results);
});

// === START SERVER ===
app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
  buildIndex().catch(console.error); // Build in-memory index on startup
});
