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
import mermaid from "mermaid";

const apiHost = import.meta.env.VITE_API_HOST;
const CODE_EXTENSIONS = [
  "js","ts","tsx","py","java","cpp","c","go","rb","sh","html","css","json","yaml","yml",
];

export default function NoteViewer() {
  const { "*": fullPath } = useParams<{ "*": string }>();
  const navigate = useNavigate();
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 250);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
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

      if (CODE_EXTENSIONS.includes(fileExt || "")) {
        return `\`\`\`${fileExt}\n${data}\n\`\`\``;
      }
      return data;
    },
    enabled: !!fullPath,
  });

  useEffect(() => {
    if (content) {
      // Render Mermaid diagrams dynamically
      mermaid.init(undefined, document.querySelectorAll(".language-mermaid"));
    }
  }, [content]);

  if (isLoading) return <p className="p-4 text-center">Loading note...</p>;
  if (isError)
    return (
      <p className="p-4 text-red-500 text-center">{(error as Error)?.message}</p>
    );

  return (
    <div className="relative w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-4 overflow-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm sm:text-base"
      >
        ← Back
      </button>

      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1 sm:mb-4 text-gray-800 dark:text-gray-200 break-words">
        {file}
      </h1>

      {fileExt === "pdf" ? (
        <PDFViewer fileUrl={content as string} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-3 sm:p-4 md:p-6 overflow-auto w-full">
          <div className="markdown-body !bg-transparent !text-gray-900 dark:!text-gray-100 text-sm sm:text-base md:text-lg leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content || ""}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {showTopButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg transition"
          title="Go to Top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
