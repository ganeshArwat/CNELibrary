// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, FileText } from "lucide-react";
const apiHost = import.meta.env.VITE_API_HOST;

interface FileItem {
  name: string;
  type: "folder" | "file";
}

export default function HomePage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [filesMap, setFilesMap] = useState<Record<string, FileItem[]>>({});
  const navigate = useNavigate();

  // Fetch top-level folders
  useEffect(() => {
    fetch(`${apiHost}/folders`)
      .then((res) => res.json())
      .then((data: string[]) => {
        setFolders(data);

        // Fetch files for each folder
        data.forEach((folder) => {
          fetch(`${apiHost}/files/${folder}`)
            .then((res) => res.json())
            .then((files: FileItem[]) => {
              setFilesMap((prev) => ({ ...prev, [folder]: files }));
            })
            .catch((err) => console.error(`Failed to fetch files for ${folder}`, err));
        });
      })
      .catch((err) => console.error("Failed to fetch folders", err));
  }, []);

  const handleFileClick = (folder: string, file: string) => {
    navigate(`/note/${folder}/${file}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <div
            key={folder}
            className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-6 w-6 text-blue-500" />
              <h2 className="font-semibold text-lg">{folder}</h2>
            </div>

            {/* List files inside this folder */}
            <ul className="mt-2 space-y-1">
              {filesMap[folder]?.map((file) => (
                <li key={file.name}>
                  <button
                    onClick={() => handleFileClick(folder, file.name)}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-500"
                  >
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
