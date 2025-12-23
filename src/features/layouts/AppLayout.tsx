import React, { useState, useEffect, useMemo, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Menu as MenuIcon,
  Search as SearchIcon,
} from "lucide-react";
import cneLogo from "@/images/Cnelogo.png";
import { useTheme } from "@/context/ThemeContext";
import api from "@/api/axios"; // axios instance
import FolderNode from "@/components/FolderNode";

interface FileItem {
  name: string;
  type: "folder" | "file";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [filesByFolder, setFilesByFolder] = useState<Record<string, FileItem[]>>({});
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [folderSearch, setFolderSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    api.get("/folders")
      .then((res) => setFolders(res.data))
      .catch((err) => console.error("Failed to fetch folders", err));
  }, []);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Close desktop search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setNoteSearch("");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Close mobile search on outside click
  useEffect(() => {
    const handleClickOutsideMobile = (event: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false);
        setNoteSearch("");
      }
    };
    document.addEventListener("click", handleClickOutsideMobile);
    return () => document.removeEventListener("click", handleClickOutsideMobile);
  }, []);

  const toggleFolder = async (folder: string) => {
    if (openFolders.includes(folder)) {
      setOpenFolders(openFolders.filter((f) => f !== folder));
    } else {
      setOpenFolders([...openFolders, folder]);
      if (!filesByFolder[folder]) {
        api.get(`/files/${folder}`)
          .then((res) => setFilesByFolder(prev => ({ ...prev, [folder]: res.data })))
          .catch((err) => console.error("Failed to fetch files", err));
      }
    }
  };

  const handleFileClick = (e: React.MouseEvent, folder: string, file: string) => {
    const url = `/note/${folder}/${file}`;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open(url, '_blank');
    } else {
      setSelectedFolder(folder);
      setSelectedFile(file);
      navigate(url);
      setSidebarOpen(false);
    }
  };

  const filteredFolders = useMemo(() =>
    folders.filter(f => f.toLowerCase().includes(folderSearch.toLowerCase())),
    [folders, folderSearch]
  );

  useEffect(() => {
    if (!noteSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(noteSearch)}`)
        .then((res) => setSearchResults(res.data))
        .catch((err) => console.error("Search failed", err));
    }, 300);
    return () => clearTimeout(timeout);
  }, [noteSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-background">
      <div className="flex-1 overflow-auto">
        <div className={`min-h-screen flex transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
          
          {/* ===== SIDEBAR ===== */}
          <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative
            border-r border-gray-200 dark:border-gray-700 flex flex-col backdrop-blur-sm
            ${darkMode ? "bg-gray-900/90" : "bg-white shadow-md"} w-80 md:w-64 max-w-full`}>

            {/* Logo */}
            <div className="flex items-center justify-center py-4 px-3 border-b border-gray-200 dark:border-gray-700">
              <img
                src={cneLogo}
                alt="Notes Library Logo"
                className="h-16 w-auto object-contain mx-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
            </div>

            {/* Folder Search */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative flex items-center">
                <SearchIcon className="absolute left-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Folder & File List */}
            <nav className="flex-1 p-4 overflow-y-auto space-y-2">
              {filteredFolders.map(folder => (
                <FolderNode
                  key={folder}
                  folderName={folder}
                  files={filesByFolder[folder] || []}
                  filesByFolder={filesByFolder}
                  openFolders={openFolders}
                  toggleFolder={toggleFolder}
                  handleFileClick={handleFileClick}
                  selectedFolder={selectedFolder}
                  selectedFile={selectedFile}
                  level={0}
                />
              ))}
            </nav>
          </aside>

          {/* Overlay mobile */}
          {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* ===== MAIN CONTENT ===== */}
          <div className="flex-1 flex flex-col min-h-screen bg-gray-200 dark:bg-gray-800">
            
            {/* Header */}
            <header className={`flex items-center justify-between border-b border-border/20 px-3 md:px-6 py-3 md:py-5 h-16 md:h-20 transition-colors
              ${darkMode ? "bg-background/50" : "bg-gray-700 text-white shadow-sm"}`}>
              
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <button className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                  onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <MenuIcon className={`h-5 w-5 md:h-6 md:w-6 ${darkMode ? "text-white" : "text-gray-100"}`} />
                </button>
                <h1 className="text-sm md:text-xl font-bold tracking-wide cursor-pointer min-w-0 truncate
                  text-white dark:text-gray-100 hover:text-blue-300 dark:hover:text-blue-400"
                  onClick={() => navigate("/")}>
                  Notes Library
                </h1>
              </div>

              {/* Right: Search + Theme Toggle */}
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 relative">
                {/* Desktop search */}
                <div className="hidden md:block relative" ref={desktopSearchRef}>
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 w-96 transition"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-auto z-50">
                      {searchResults.map((res, idx) => {
                        const folderPath = res.folder ? `${res.folder}/` : '';
                        const url = res.fullPath ? `/note/${res.fullPath}` : `/note/${folderPath}${res.filename}`;
                        return (
                          <div key={res.id} className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition
                            ${idx !== searchResults.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}`}
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey) {
                                e.preventDefault();
                                window.open(url, '_blank');
                              } else {
                                navigate(url);
                                setSearchResults([]);
                                setNoteSearch("");
                              }
                            }}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                  {res.filename}
                                </div>
                                {res.folder && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {res.folder}
                                  </div>
                                )}
                              </div>
                            </div>
                            {res.snippet && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {res.snippet}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Theme toggle */}
                <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-white" />}
                </button>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-auto">
              <div className="max-w-7xl mx-auto animate-fade-in-up">
                <Outlet />
              </div>
            </main>

            <footer className="w-full text-center py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 mt-auto">
              Developed by <a href="https://ganesharwat.in/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ganesh Arwat</a>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
