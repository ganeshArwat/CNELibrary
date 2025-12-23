import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Copy, Check } from "lucide-react";
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

  // Copy button component for code blocks
  const CodeBlock = ({ children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    
    // Extract code element from pre children
    const codeElement = React.Children.toArray(children).find(
      (child: any) => child?.type === "code" || child?.props?.className?.includes("language-")
    ) as any;
    
    // Get code content - handle different structures
    let codeString = "";
    if (codeElement) {
      if (typeof codeElement.props?.children === "string") {
        codeString = codeElement.props.children;
      } else if (Array.isArray(codeElement.props?.children)) {
        codeString = codeElement.props.children
          .map((child: any) => (typeof child === "string" ? child : child?.props?.children || ""))
          .join("");
      } else {
        codeString = String(codeElement.props?.children || "");
      }
      codeString = codeString.replace(/\n$/, "");
    }

    const handleCopy = async () => {
      if (!codeString) return;
      try {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    // Only add copy button if this is a code block (has code element with className)
    const isCodeBlock = codeElement?.props?.className;

    if (!isCodeBlock) {
      return <pre {...props}>{children}</pre>;
    }

    return (
      <div className="relative group">
        <pre {...props}>{children}</pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 dark:bg-gray-600 text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-500 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none z-10 shadow-lg"
          title={copied ? "Copied!" : "Copy code"}
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

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
              components={{
                pre: CodeBlock,
              }}
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
