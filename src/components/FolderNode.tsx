import React from "react";
import { Button } from "./ui/button";
import { Folder, FileText } from "lucide-react";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

interface FolderNodeProps {
  folderName: string;
  files: FileItem[];
  filesByFolder: Record<string, FileItem[]>;
  openFolders: string[];
  toggleFolder: (folderPath: string) => void;
  handleFileClick: (folderPath: string, fileName: string) => void;
  selectedFolder: string;
  selectedFile: string;
  level: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folderName,
  files,
  filesByFolder,
  openFolders,
  toggleFolder,
  handleFileClick,
  selectedFolder,
  selectedFile,
  level,
}) => {
  const isOpen = openFolders.includes(folderName);
  const isFolderActive = selectedFolder === folderName;

  const subfolders = files.filter(f => f.type === "folder");
  const regularFiles = files.filter(f => f.type === "file");

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        className={`flex items-center justify-between w-full text-left px-4 py-2 rounded-lg
          ${isFolderActive
            ? "bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100"
            : "text-gray-800 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-800 hover:text-green-700 dark:hover:text-green-300"}`
        }
        onClick={() => toggleFolder(folderName)}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Folder className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{folderName.split("/").pop()}</span>
        </div>
        <span>{isOpen ? "▾" : "▸"}</span>
      </Button>

      {isOpen && (
        <div className="flex flex-col mt-1">
          {subfolders.map(sub => {
            const childPath = `${folderName}/${sub.name}`;
            return (
              <FolderNode
                key={childPath}
                folderName={childPath}
                files={filesByFolder[childPath] || []}
                filesByFolder={filesByFolder}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                handleFileClick={handleFileClick}
                selectedFolder={selectedFolder}
                selectedFile={selectedFile}
                level={level + 1}
              />
            );
          })}

          {regularFiles.map(file => {
            const isFileActive = selectedFolder === folderName && selectedFile === file.name;
            return (
              <Button
                key={file.name}
                variant="ghost"
                className={`flex items-center justify-start gap-2 w-full text-left px-4 py-1 rounded-md text-sm
                  ${isFileActive
                    ? "bg-green-50 dark:bg-gray-700 text-green-700 dark:text-green-200"
                    : "text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-800 hover:text-green-700 dark:hover:text-green-300"
                  }`}
                style={{ paddingLeft: `${(level + 1) * 16 + 16}px` }}
                onClick={(e) => handleFileClick(e, folderName, file.name)}
                title={file.name}
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderNode;
