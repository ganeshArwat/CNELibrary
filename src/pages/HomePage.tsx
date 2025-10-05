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
  const { data: folders, isLoading, isError } = useQuery({
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
  if (isError) return <p className="p-6 text-red-500">Failed to load folders.</p>;

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
              className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-6 w-6 text-blue-500" />
                <h2 className="font-semibold text-lg">{folder}</h2>
              </div>

              <ul className="mt-2 space-y-1">
                {isLoading && <li className="text-sm text-gray-400">Loading files...</li>}
                {isError && <li className="text-sm text-red-500">Failed to load files.</li>}
                {files?.map((file) => (
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
          );
        })}
      </div>
    </div>
  );
}
