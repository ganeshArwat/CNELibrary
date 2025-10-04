import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "github-markdown-css/github-markdown.css";
const apiHost = import.meta.env.VITE_API_HOST;

export default function NoteViewer() {
  const { folder, file } = useParams<{ folder: string; file: string }>();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folder || !file) return;

    setLoading(true);
    fetch(`${apiHost}/note/${folder}/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch note");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [folder, file]);

  if (loading) return <p>Loading note...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 overflow-auto">
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 overflow-auto">
    <div className="markdown-body dark:!bg-gray-900 dark:!text-white">
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      />
    </div>
  </div>
</div>

  );
}
