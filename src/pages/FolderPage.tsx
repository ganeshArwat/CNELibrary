import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Folder, FileText, ArrowLeft } from "lucide-react";
import api from "@/api/axios";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

// Fetch files/folders from backend
const fetchFiles = async (folderPath: string): Promise<FileItem[]> => {
  const encoded = encodeURIComponent(folderPath);
  const { data } = await api.get(`/files/${encoded}`);
  return data;
};

export default function FolderPage() {
  const { "*": folderPath } = useParams(); // wildcard for nested folders
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: files = [], isLoading, isError } = useQuery({
    queryKey: ["files", folderPath],
    queryFn: () => fetchFiles(folderPath || ""),
  });

  // Handle file click
  const handleFileClick = (fileName: string) => {
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    navigate(`/note/${fullPath}`);
  };

  // Handle subfolder click
  const handleSubfolderClick = (subfolder: string) => {
    const fullPath = folderPath ? `${folderPath}/${subfolder}` : subfolder;
    navigate(`/folder/${fullPath}`);
  };

  // Handle back button
  const handleBack = () => {
    if (!folderPath) {
      navigate("/"); // root
    } else {
      const parts = folderPath.split("/");
      parts.pop(); // go one folder up
      const parentPath = parts.join("/");
      navigate(parentPath ? `/folder/${parentPath}` : "/");
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <p className="p-6">Loading files...</p>;
  if (isError) return <p className="p-6 text-red-500">Failed to load files.</p>;

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-4 flex items-center gap-2 cursor-pointer text-blue-500" onClick={handleBack}>
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </div>

      {/* Folder Title */}
      <h1 className="text-2xl font-bold mb-4">Folder: {folderPath || "Root"}</h1>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search files..."
        className="w-full mb-4 px-2 py-1 border rounded text-sm focus:outline-none focus:ring focus:ring-blue-300 dark:bg-gray-600 dark:text-gray-200"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Files / Folders List */}
      <ul className="space-y-2">
        {filteredFiles.map((file) => (
          <li key={file.name}>
            <button
              onClick={() =>
                file.type === "folder"
                  ? handleSubfolderClick(file.name)
                  : handleFileClick(file.name)
              }
              className={`flex items-center gap-2 text-sm w-full text-left px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-gray-600 transition ${
                file.type === "folder" ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-800 dark:text-gray-300"
              }`}
            >
              {file.type === "folder" ? <Folder className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              <span>{file.name}</span>
            </button>
          </li>
        ))}

        {filteredFiles.length === 0 && <p className="text-sm text-gray-500">No files or folders found</p>}
      </ul>
    </div>
  );
}
