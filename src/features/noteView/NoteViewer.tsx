import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import "highlight.js/styles/github.css";
import "github-markdown-css/github-markdown.css";
import PDFViewer from "@/components/PDFViewer";

const apiHost = import.meta.env.VITE_API_HOST;

export default function NoteViewer() {
  const { "*": fullPath } = useParams<{ "*": string }>(); // wildcard captures entire path
  const navigate = useNavigate();
  const [showTopButton, setShowTopButton] = useState(false);

  // Scroll listener for showing "Go to Top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!fullPath) return <p className="p-6 text-red-500">No file specified</p>;

  const pathParts = fullPath.split("/");
  const file = pathParts.pop()!;
  const folder = pathParts.join("/");

  const fileExt = file.split(".").pop()?.toLowerCase();

  const { data: content, isLoading, isError, error } = useQuery({
    queryKey: ["note", folder, file],
    queryFn: async () => {
      const encodedPath = encodeURIComponent(folder ? `${folder}/${file}` : file);

      if (fileExt === "pdf") return `${apiHost}/note/${encodedPath}`;

      const { data } = await axios.get(`${apiHost}/note/${encodedPath}`, {
        responseType: "text",
      });
      return data;
    },
    enabled: !!fullPath,
  });

  if (isLoading) return <p className="p-6">Loading note...</p>;
  if (isError) return <p className="p-6 text-red-500">{(error as Error)?.message}</p>;

  return (
    <div className="relative w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 overflow-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        ← Back
      </button>

      <h1 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        {file}
      </h1>

      {fileExt === "pdf" ? (
        <div className="w-full h-full flex justify-center items-center p-4">
          <PDFViewer fileUrl={content as string} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 overflow-auto w-full">
          <div className="markdown-body !bg-transparent !text-gray-900 dark:!text-gray-100 text-sm sm:text-base md:text-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content || ""}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Go to Top Button */}
      {showTopButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition"
          title="Go to Top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
