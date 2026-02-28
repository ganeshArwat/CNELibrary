import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Copy, Check } from "lucide-react";
import "highlight.js/styles/atom-one-dark.css";
import "github-markdown-css/github-markdown.css";
import PDFViewer from "@/components/PDFViewer";
import mermaid from "mermaid";
import { useTheme } from "@/context/ThemeContext";

const apiHost = import.meta.env.VITE_API_HOST;
const CODE_EXTENSIONS = [
  "js","ts","tsx","py","java","cpp","c","go","rb","sh","html","css","json","yaml","yml",
];

export default function NoteViewer() {
  const { "*": fullPath } = useParams<{ "*": string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 250);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? "dark" : "default",
    });
  }, [darkMode]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Mermaid diagram - use render() API to get SVG string (avoids init/getBBox DOM issues)
  const MermaidDiagram = ({ code }: { code: string }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!code.trim()) return;
      setSvg(null);
      setError(null);
      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
      const render = () => {
        mermaid
          .render(id, code.trim())
          .then(({ svg: result }) => setSvg(result))
          .catch((err) => setError(err?.message || "Mermaid render failed"));
      };
      const t = setTimeout(render, 100);
      return () => clearTimeout(t);
    }, [code, darkMode]);

    if (error) {
      return (
        <pre className="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm overflow-x-auto">
          <code className="text-gray-800 dark:text-gray-200">{code}</code>
          <p className="mt-2 text-amber-600 dark:text-amber-400 text-xs">{error}</p>
        </pre>
      );
    }
    if (svg) {
      return (
        <div
          ref={containerRef}
          className="mermaid-diagram my-4 flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
    return <div ref={containerRef} className="my-4 min-h-[100px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />;
  };

  // Copy button + language label for code blocks (ChatGPT-style)
  const CodeBlock = ({ children, ...props }: any) => {
    const [copied, setCopied] = useState(false);

    const codeElement = React.Children.toArray(children).find(
      (child: any) => child?.type === "code" || child?.props?.className?.includes("language-")
    ) as any;

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

    const langClass = codeElement?.props?.className || "";
    const langMatch = langClass.match(/language-(\w+)/);
    const language = langMatch ? langMatch[1] : "";

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

    const isCodeBlock = codeElement?.props?.className;
    const hasCode = !!codeElement;
    const isMermaid = language === "mermaid";

    if (!hasCode) {
      return <pre {...props}>{children}</pre>;
    }

    if (isMermaid) {
      return <MermaidDiagram code={codeString} />;
    }

    return (
      <div className="relative group my-4 rounded-xl overflow-hidden bg-[#282c34]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-white/5">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {language || "code"}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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
        <pre {...props} className="!mt-0 !rounded-none">
          {children}
        </pre>
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
          <div
            key={darkMode ? "dark" : "light"}
            className="markdown-body !bg-transparent !text-gray-900 dark:!text-gray-100 text-sm sm:text-base md:text-lg leading-relaxed"
          >
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
