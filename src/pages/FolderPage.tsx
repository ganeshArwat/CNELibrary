import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Folder } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

const fetchFiles = async (folderPath: string): Promise<FileItem[]> => {
  const encoded = encodeURIComponent(folderPath);
  const { data } = await api.get(folderPath ? `/files/${encoded}` : "/files");
  return data;
};

export default function FolderPage() {
  const { "*": folderPath } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["files", folderPath],
    queryFn: () => fetchFiles(folderPath || ""),
  });

  const handleFileClick = (e: React.MouseEvent, fileName: string) => {
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const url = `/note/${fullPath}`;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const handleSubfolderClick = (e: React.MouseEvent, subfolder: string) => {
    const fullPath = folderPath ? `${folderPath}/${subfolder}` : subfolder;
    const url = `/folder/${fullPath}`;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const handleBack = () => {
    if (!folderPath) return navigate("/");
    const parts = folderPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    navigate(parentPath ? `/folder/${parentPath}` : "/");
  };

  // Filtered lists
  const subfolders = items
    .filter((item) => item.type === "folder")
    .filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const files = items
    .filter((item) => item.type === "file")
    .filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (isError) return <p className="p-6 text-red-500">Failed to load items</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <div
        className="flex items-center gap-2 text-blue-500 cursor-pointer mb-4 hover:text-blue-600 transition"
        onClick={handleBack}
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </div>

      {/* Folder Title */}
      <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        {folderPath || "Root"}
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search folders or files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-gray-200"
      />

      {/* Subfolders */}
      {subfolders.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">
            Folders
          </h2>
          <ul className="space-y-1">
            {subfolders.map((folder) => (
              <li key={folder.name}>
                <button
                  onClick={(e) => handleSubfolderClick(e, folder.name)}
                  className="flex items-center gap-2 text-left w-full px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-blue-600 dark:text-blue-400 font-medium"
                >
                  <Folder className="h-5 w-5" />
                  <span>{folder.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">
            Files
          </h2>
          <ul className="space-y-1">
            {files.map((file) => (
              <li key={file.name}>
                <button
                  onClick={(e) => handleFileClick(e, file.name)}
                  className="flex items-center gap-2 text-left w-full px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-800 dark:text-gray-300"
                >
                  <FileText className="h-5 w-5" />
                  <span>{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {subfolders.length === 0 && files.length === 0 && (
        <p className="text-gray-500">No items found</p>
      )}
    </div>
  );
}
