import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Folder, FileText } from "lucide-react";
import api from "@/api/axios";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

const fetchFolders = async (): Promise<string[]> => {
  const { data } = await api.get("/folders");
  return data;
};

const fetchFiles = async (folder: string): Promise<FileItem[]> => {
  const { data } = await api.get(`/files/${folder}`);
  return data;
};

export default function HomePage() {
  const navigate = useNavigate();

  // Fetch folders
  const {
    data: folders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["folders"],
    queryFn: fetchFolders,
  });

  // Fetch files for each folder (safe version)
  const folderFilesQueries = useQueries({
    queries:
      folders?.map((folder) => ({
        queryKey: ["files", folder],
        queryFn: () => fetchFiles(folder),
        enabled: !!folders,
      })) ?? [],
  });

  if (isLoading) return <p className="p-6">Loading folders...</p>;
  if (isError)
    return <p className="p-6 text-red-500">Failed to load folders.</p>;

  const handleFileClick = (folder: string, file: string) => {
    navigate(`/note/${folder}/${file}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {folders?.map((folder, i) => {
    const query = folderFilesQueries[i];
    const files = query?.data;
    const isLoading = query?.isLoading;
    const isError = query?.isError;

    return (
      <div
        key={folder}
        className="bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition p-4 flex flex-col"
      >
        {/* Folder Header */}
        <div className="flex items-center gap-3 mb-3">
          <Folder className="h-6 w-6 text-blue-500 flex-shrink-0" />
          <h2 className="font-semibold text-lg truncate">{folder}</h2>
        </div>

        {/* File List Container */}
        <div className="flex-1 overflow-y-auto max-h-64">
          {isLoading && (
            <p className="text-sm text-gray-400">Loading files...</p>
          )}
          {isError && (
            <p className="text-sm text-red-500">Failed to load files.</p>
          )}
          {files?.length === 0 && !isLoading && !isError && (
            <p className="text-sm text-gray-500">No files found</p>
          )}
          <ul className="space-y-1">
            {files?.map((file) => (
              <li key={file.name}>
                <button
                  onClick={() => handleFileClick(folder, file.name)}
                  className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300 hover:text-blue-500 w-full text-left"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Show file count at bottom */}
        {files?.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {files.length} {files.length === 1 ? "file" : "files"}
          </div>
        )}
      </div>
    );
  })}
</div>

    </div>
  );
}
