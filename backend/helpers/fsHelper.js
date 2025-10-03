const fs = require("fs").promises;
const path = require("path");

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
