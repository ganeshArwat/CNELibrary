import React, { useState, useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Menu as MenuIcon,
  Folder,
  FileText,
  Search as SearchIcon,
} from "lucide-react";
import cneLogo from "@/images/Cnelogo.png";
import { useTheme } from "@/context/ThemeContext";
import api from "@/api/axios"; // ✅ use axios instance

interface FileItem {
  name: string;
  type: "folder" | "file";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [filesByFolder, setFilesByFolder] = useState<
    Record<string, FileItem[]>
  >({});
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [folderSearch, setFolderSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // ✅ Fetch top-level folders using Axios instance
  useEffect(() => {
    api
      .get("/folders")
      .then((res) => setFolders(res.data))
      .catch((err) => console.error("Failed to fetch folders", err));
  }, []);

  // ✅ Toggle folder open/close & fetch files if needed
  const toggleFolder = async (folder: string) => {
    if (openFolders.includes(folder)) {
      setOpenFolders(openFolders.filter((f) => f !== folder));
    } else {
      setOpenFolders([...openFolders, folder]);

      if (!filesByFolder[folder]) {
        api
          .get(`/files/${folder}`)
          .then((res) => {
            setFilesByFolder((prev) => ({ ...prev, [folder]: res.data }));
          })
          .catch((err) => console.error("Failed to fetch files", err));
      }
    }
  };

  // ✅ Handle file click navigation
  const handleFileClick = (folder: string, file: string) => {
    setSelectedFolder(folder);
    setSelectedFile(file);
    navigate(`/note/${folder}/${file}`);
    setSidebarOpen(false);
  };

  // ✅ Folder search filter
  const filteredFolders = useMemo(
    () =>
      folders.filter((f) =>
        f.toLowerCase().includes(folderSearch.toLowerCase())
      ),
    [folders, folderSearch]
  );

  // ✅ Debounced note search using Axios
  useEffect(() => {
    if (!noteSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      api
        .get(`/search?q=${encodeURIComponent(noteSearch)}`)
        .then((res) => setSearchResults(res.data))
        .catch((err) => console.error("Search failed", err));
    }, 300);

    return () => clearTimeout(timeout);
  }, [noteSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-background">
      <div className="flex-1 overflow-auto">
        <div
          className={`min-h-screen flex transition-colors ${
            darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
          }`}
        >
          {/* ===== SIDEBAR ===== */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 transform transition-transform
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 md:relative
    border-r border-gray-200 dark:border-gray-700 flex flex-col backdrop-blur-sm
    ${darkMode ? "bg-gray-900/90" : "bg-white shadow-md"}
    w-80 md:w-64 max-w-full`} // ✅ wider on mobile
          >
            {/* Logo */}
            <div className="flex items-center justify-center py-4 px-3 border-b border-gray-200 dark:border-gray-700">
              <img
                src={cneLogo}
                alt="Notes Library Logo"
                className="h-16 w-auto object-contain mx-auto"
              />
            </div>

            {/* Folder Search */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
          bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>

            {/* Folder & File List */}
            <nav className="flex-1 p-4 overflow-y-auto space-y-3">
              {filteredFolders.map((folder) => {
                const isFolderActive = selectedFolder === folder;
                const isOpen = openFolders.includes(folder);

                return (
                  <div key={folder} className="rounded-xl shadow-sm">
                    <Button
                      variant="ghost"
                      className={`flex items-center justify-between w-full px-4 py-2 text-left font-semibold rounded-lg
              ${
                isFolderActive
                  ? "bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100"
                  : "text-gray-800 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-800 hover:text-green-700 dark:hover:text-green-300"
              }`}
                      onClick={() => toggleFolder(folder)}
                      title={folder}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Folder
                          className={`h-5 w-5 flex-shrink-0 ${
                            isFolderActive
                              ? "text-green-700 dark:text-green-200"
                              : "text-gray-700 dark:text-gray-400"
                          }`}
                        />
                        <span className="break-words">{folder}</span>{" "}
                        {/* wrap long folder names */}
                      </div>
                      <span className="text-gray-400 dark:text-gray-400">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </Button>

                    {isOpen && filesByFolder[folder] && (
                      <ul className="ml-6 mt-2 space-y-1">
                        {filesByFolder[folder].map((file) => {
                          const isFileActive =
                            isFolderActive && selectedFile === file.name;
                          return (
                            <li key={file.name}>
                              <Button
                                variant="ghost"
                                className={`flex items-center gap-2 w-full justify-start text-sm px-3 py-1 rounded-md
                        ${
                          isFileActive
                            ? "bg-green-50 dark:bg-gray-700 text-green-700 dark:text-green-200"
                            : "text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-800 hover:text-green-700 dark:hover:text-green-300"
                        }`}
                                onClick={() =>
                                  handleFileClick(folder, file.name)
                                }
                                title={file.name}
                              >
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="break-words">
                                  {file.name}
                                </span>{" "}
                                {/* wrap long file names */}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Overlay on mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ===== MAIN CONTENT ===== */}
          <div className="flex-1 flex flex-col min-h-screen bg-gray-200 dark:bg-gray-800">
            {/* Header */}
            <header
              className={`flex items-center justify-between border-b border-border/20 px-3 md:px-6 py-3 md:py-5 h-16 md:h-20 transition-colors
                ${
                  darkMode
                    ? "bg-background/50"
                    : "bg-gray-700 text-white shadow-sm"
                }`}
            >
              {/* Left: Hamburger + Title */}
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <button
                  className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <MenuIcon
                    className={`h-5 w-5 md:h-6 md:w-6 ${
                      darkMode ? "text-white" : "text-gray-100"
                    }`}
                  />
                </button>
                <h1
                  className="text-sm md:text-xl font-bold tracking-wide cursor-pointer 
                    text-white dark:text-gray-100 hover:text-blue-300 dark:hover:text-blue-400 
                    transition-colors duration-200"
                  onClick={() => navigate(`/`)}
                >
                  Notes Library
                </h1>
              </div>

              {/* Right: Search + Theme Toggle */}
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 relative">
                {/* Desktop search */}
                <div className="hidden md:block relative">
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 w-64 transition"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-auto z-50">
                      {searchResults.map((res, idx) => (
                        <div
                          key={res.id}
                          className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition 
                            ${
                              idx !== searchResults.length - 1
                                ? "border-b border-gray-200 dark:border-gray-700"
                                : ""
                            }`}
                          onClick={() =>
                            navigate(`/note/${res.folder}/${res.filename}`)
                          }
                        >
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {res.filename}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {res.folder}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile search */}
                <div className="md:hidden relative">
                  <button
                    onClick={() => setMobileSearchOpen((prev) => !prev)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <SearchIcon className={`h-5 w-5 text-white`} />
                  </button>
                  {mobileSearchOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <input
                        type="text"
                        placeholder="Search notes..."
                        value={noteSearch}
                        onChange={(e) => setNoteSearch(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
                      />
                      {searchResults.length > 0 &&
                        searchResults.map((res, idx) => (
                          <div
                            key={res.id}
                            className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition 
                              ${
                                idx !== searchResults.length - 1
                                  ? "border-b border-gray-200 dark:border-gray-700"
                                  : ""
                              }`}
                            onClick={() =>
                              navigate(`/note/${res.folder}/${res.filename}`)
                            }
                          >
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {res.filename}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {res.folder}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Theme toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
            </header>

            {/* Main content */}
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
