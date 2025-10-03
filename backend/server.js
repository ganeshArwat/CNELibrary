const express = require("express");
const path = require("path");
const fs = require("fs").promises; // use promises for async/await
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Helper function: scan folder recursively and build tree
async function scanNotesDir(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const tree = {};

  for (const entry of entries) {
    if (entry.isDirectory()) {
      tree[entry.name] = await scanNotesDir(path.join(dirPath, entry.name));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      tree[entry.name] = path.join(dirPath, entry.name);
    }
  }

  return tree;
}

// GET /folders - list top-level folders
app.get("/folders", async (req, res) => {
  try {
    const notesPath = path.join(__dirname, "notes");
    const entries = await fs.readdir(notesPath, { withFileTypes: true });
    const folders = entries.filter((e) => e.isDirectory()).map((f) => f.name);
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: "Failed to read folders" });
  }
});

// GET /files/:folder - list files/subfolders inside a folder
app.get("/files/:folder", async (req, res) => {
  const folder = req.params.folder;
  const folderPath = path.join(__dirname, "notes", folder);

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const result = entries.map((e) => ({
      name: e.name,
      type: e.isDirectory() ? "folder" : "file",
    }));
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: "Folder not found" });
  }
});

// GET /note/:folder/:file - return Markdown content
app.get("/note/:folder/:file", async (req, res) => {
  const { folder, file } = req.params;
  const filePath = path.join(__dirname, "notes", folder, file);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    res.send(content);
  } catch (err) {
    res.status(404).json({ error: "Note not found" });
  }
});

// Optional: GET /tree - full recursive tree
app.get("/tree", async (req, res) => {
  try {
    const notesPath = path.join(__dirname, "notes");
    const tree = await scanNotesDir(notesPath);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: "Failed to scan notes folder" });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
