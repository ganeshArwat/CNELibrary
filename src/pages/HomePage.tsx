import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Folder, FileText } from "lucide-react";
import api from "@/api/axios";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

// Fetch top-level folders
const fetchFolders = async (): Promise<string[]> => {
  const { data } = await api.get("/folders");
  return data;
};

// Fetch files/folders inside a folder
const fetchFiles = async (folderPath: string): Promise<FileItem[]> => {
  const encoded = encodeURIComponent(folderPath);
  const { data } = await api.get(folderPath ? `/files/${encoded}` : "/files");
  return data;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // Get top-level folders
  const { data: folders, isLoading, isError } = useQuery({
    queryKey: ["folders"],
    queryFn: fetchFolders,
  });

  // Get files/folders for each top-level folder
  const folderFilesQueries = useQueries({
    queries:
      folders?.map((folder) => ({
        queryKey: ["files", folder],
        queryFn: () => fetchFiles(folder),
        enabled: !!folders,
      })) ?? [],
  });

  if (isLoading) return <p className="p-6">Loading folders...</p>;
  if (isError) return <p className="p-6 text-red-500">Failed to load folders.</p>;

  const handleFileClick = (folderPath: string, fileName: string) => {
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    navigate(`/note/${fullPath}`);
  };

  const handleFolderClick = (folderPath: string) => {
    navigate(`/folder/${folderPath}`);
  };

  const handleSearch = (folder: string, term: string) => {
    setSearchTerms((prev) => ({ ...prev, [folder]: term }));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders?.map((folder, i) => {
          const query = folderFilesQueries[i];
          const items = query?.data || [];
          const isLoadingFiles = query?.isLoading;
          const isErrorFiles = query?.isError;

          // separate files and subfolders
          const files = items.filter((item) => item.type === "file");
          const subfolders = items.filter((item) => item.type === "folder");

          // search filter only applies to files
          const filteredFiles = files.filter((file) =>
            file.name.toLowerCase().includes((searchTerms[folder] || "").toLowerCase())
          );

          return (
            <div
              key={folder}
              className="bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition p-4 flex flex-col"
            >
              {/* Top-level folder header clickable */}
              <div
                className="flex items-center gap-3 mb-3 cursor-pointer"
                onClick={() => handleFolderClick(folder)}
              >
                <Folder className="h-6 w-6 text-blue-500 flex-shrink-0" />
                <h2 className="font-semibold text-lg truncate text-blue-600 dark:text-blue-400">{folder}</h2>
                <span className="text-sm text-gray-400 dark:text-gray-300">({items.length})</span>
              </div>

              {/* Files & Folders */}
              <div className="flex-1 overflow-y-auto max-h-64">
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full mb-2 px-2 py-1 border rounded text-sm focus:outline-none focus:ring focus:ring-blue-300 dark:bg-gray-600 dark:text-gray-200"
                  value={searchTerms[folder] || ""}
                  onChange={(e) => handleSearch(folder, e.target.value)}
                />

                {isLoadingFiles && <p className="text-sm text-gray-400">Loading items...</p>}
                {isErrorFiles && <p className="text-sm text-red-500">Failed to load items.</p>}
                {!isLoadingFiles && !isErrorFiles && filteredFiles.length === 0 && (
                  <p className="text-sm text-gray-500">No files found</p>
                )}

                {/* Subfolders */}
                <ul className="space-y-1 mb-2">
                  {subfolders.map((sub) => (
                    <li key={sub.name}>
                      <button
                        onClick={() => handleFolderClick(`${folder}/${sub.name}`)}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 w-full text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-600 transition"
                      >
                        <Folder className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">{sub.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Files */}
                <ul className="space-y-1">
                  {filteredFiles.map((file) => (
                    <li key={file.name}>
                      <button
                        onClick={() => handleFileClick(folder, file.name)}
                        className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300 hover:text-blue-500 w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">{file.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
