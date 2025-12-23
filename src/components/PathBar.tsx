import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Home, Folder, FileText, ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import api from "@/api/axios";

interface PathBarProps {
  onNavigate?: (path: string) => void;
}

export default function PathBar({ onNavigate }: PathBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyIndexRef = useRef(0);

  // Get current path from location
  const getCurrentPath = () => {
    if (location.pathname.startsWith("/note/")) {
      return location.pathname.replace("/note/", "");
    } else if (location.pathname.startsWith("/folder/")) {
      return location.pathname.replace("/folder/", "");
    }
    return "";
  };

  const currentPath = getCurrentPath();
  const isNotePage = location.pathname.startsWith("/note/");
  const isFolderPage = location.pathname.startsWith("/folder/");

  // Track browser history
  useEffect(() => {
    const checkHistory = () => {
      // Check if we can go back (history length > 1 means we have history)
      setCanGoBack(window.history.length > 1);
      // For forward, we track our own index
      // This is approximate but works for most cases
      const currentIdx = window.history.state?.idx ?? 0;
      historyIndexRef.current = currentIdx;
      setCanGoForward(false); // Browser doesn't expose forward state easily
    };
    
    checkHistory();
    const handlePopState = () => {
      checkHistory();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [location]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update edit value when path changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(currentPath);
    }
  }, [currentPath, isEditing]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleForward = () => {
    navigate(1);
  };

  const handlePathSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = editValue.trim();
    
    if (!path) {
      navigate("/");
      setIsEditing(false);
      return;
    }

    // Check if path exists as file or folder
    try {
      // Try as folder first (folders are more common)
      const folderResponse = await api.get(`/files/${encodeURIComponent(path)}`, {
        validateStatus: (status) => status < 500,
      });

      if (folderResponse.status === 200) {
        navigate(`/folder/${path}`);
        setIsEditing(false);
        onNavigate?.(path);
        return;
      }

      // Try as file
      const fileResponse = await api.get(`/note/${encodeURIComponent(path)}`, {
        validateStatus: (status) => status < 500, // Don't throw on 404
        responseType: 'text',
      });
      
      if (fileResponse.status === 200) {
        navigate(`/note/${path}`);
        setIsEditing(false);
        onNavigate?.(path);
        return;
      }

      // If neither exists, try as file (default)
      navigate(`/note/${path}`);
      setIsEditing(false);
      onNavigate?.(path);
    } catch (err) {
      console.error("Error checking path:", err);
      // Navigate anyway as file
      navigate(`/note/${path}`);
      setIsEditing(false);
      onNavigate?.(path);
    }
  };

  const handleBreadcrumbClick = (path: string, isFile: boolean) => {
    if (isFile) {
      navigate(`/note/${path}`);
    } else {
      navigate(path ? `/folder/${path}` : "/");
    }
  };

  const pathParts = currentPath ? currentPath.split("/") : [];
  const isRoot = !currentPath;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Back/Forward Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className="p-1.5 rounded hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-white dark:text-gray-200"
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleForward}
          disabled={!canGoForward}
          className="p-1.5 rounded hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-white dark:text-gray-200"
          title="Go forward"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Path Bar */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form onSubmit={handlePathSubmit} className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter path (e.g., folder/subfolder/file.md)"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Go
            </button>
          </form>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700 cursor-text transition min-w-0 bg-gray-800/50 dark:bg-gray-900/50"
            title="Click to edit path"
          >
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap items-center gap-1 text-white dark:text-gray-200">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/");
                    }}
                    className="flex items-center gap-1 hover:text-blue-300 dark:hover:text-blue-400 text-white dark:text-gray-200"
                  >
                    <Home className="h-3 w-3" />
                    <span className="hidden sm:inline">Home</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {pathParts.length > 0 && <BreadcrumbSeparator><ChevronRight className="h-3 w-3 text-gray-400" /></BreadcrumbSeparator>}

                {pathParts.map((part, index) => {
                  const pathToHere = pathParts.slice(0, index + 1).join("/");
                  const isLast = index === pathParts.length - 1;
                  const isFile = isLast && isNotePage;

                  return (
                    <React.Fragment key={pathToHere}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="flex items-center gap-1 truncate max-w-[200px] text-white dark:text-gray-200">
                            {isFile ? (
                              <FileText className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <Folder className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{part}</span>
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBreadcrumbClick(pathToHere, false);
                            }}
                            className="flex items-center gap-1 hover:text-blue-300 dark:hover:text-blue-400 truncate max-w-[200px] text-white dark:text-gray-200"
                          >
                            <Folder className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{part}</span>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator><ChevronRight className="h-3 w-3 text-gray-400" /></BreadcrumbSeparator>}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
      </div>
    </div>
  );
}

