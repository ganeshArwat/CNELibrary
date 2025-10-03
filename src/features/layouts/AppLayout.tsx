import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu as MenuIcon, X as CloseIcon, Folder, FileText } from "lucide-react";
import cneLogo from "@/images/Cnelogo.png";
import { useTheme } from "@/context/ThemeContext";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Fetch top-level folders on mount
  useEffect(() => {
    fetch("http://localhost:5000/folders")
      .then((res) => res.json())
      .then((data) => setFolders(data))
      .catch((err) => console.error("Failed to fetch folders", err));
  }, []);

  // Fetch files when a folder is selected
  const handleFolderClick = (folder: string) => {
    fetch(`http://localhost:5000/files/${folder}`)
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => console.error("Failed to fetch files", err));
    setSelectedFolder(folder);
  };

  const handleFileClick = (file: string) => {
    if (selectedFolder) {
      navigate(`/note/${selectedFolder}/${file}`);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-background">
      <div className="flex-1 overflow-auto">
        <div className={`min-h-screen flex transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>

          {/* SIDEBAR */}
          <aside
            className={`fixed inset-y-0 left-0 w-64 z-50 transform transition-transform
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative
              border-r border-border/20 flex flex-col backdrop-blur-sm
              ${darkMode ? "bg-background/80" : "bg-white shadow-sm"}`}
          >
            {/* Logo */}
            <div className="pt-5 flex items-center justify-center h-20">
              <img src={cneLogo} alt="Notes Library Logo" className="h-16 w-auto object-contain" />
            </div>

            {/* Folder & File Explorer */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {folders.map((folder) => (
                <div key={folder}>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 w-full justify-start"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <Folder size={18} />
                    {folder}
                  </Button>

                  {/* List files inside selected folder */}
                  {selectedFolder === folder && (
                    <ul className="ml-5 mt-1 space-y-1">
                      {files.map((file) => (
                        <li key={file.name}>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 w-full justify-start text-sm"
                            onClick={() => handleFileClick(file.name)}
                          >
                            <FileText size={16} />
                            {file.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Overlay on mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col min-h-screen bg-gray-200 dark:bg-gray-800">
            {/* HEADER */}
            <header className={`flex items-center justify-between border-b border-border/20 px-3 md:px-6 py-3 md:py-5 h-16 md:h-20 transition-colors
              ${darkMode ? "bg-background/50" : "bg-gray-700 text-white shadow-sm"}`}>
              {/* Left: Hamburger + Title */}
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <button
                  className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <MenuIcon className="h-5 w-5 md:h-6 md:w-6 text-white dark:text-foreground" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="ml-3 text-xl font-bold tracking-wide">Notes Library</h1>
                </div>
              </div>

              {/* Right: Theme toggle */}
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <button
                  onClick={toggleDarkMode}
                  className="p-1 md:p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0"
                >
                  {darkMode ? <Sun className="h-4 md:h-5 w-4 md:w-5 text-yellow-400" /> :
                    <Moon className="h-4 md:h-5 w-4 md:w-5 text-gray-600" />}
                </button>
              </div>
            </header>

            {/* CONTENT */}
            <main className="flex-1 p-4 md:p-8 overflow-auto">
              <div className="max-w-7xl mx-auto animate-fade-in-up">
                <Outlet />
              </div>
            </main>
          </div>

        </div>
      </div>
    </div>
  );
}
