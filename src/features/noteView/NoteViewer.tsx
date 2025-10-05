import React from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import "highlight.js/styles/github.css";
import "github-markdown-css/github-markdown.css";

const apiHost = import.meta.env.VITE_API_HOST;

// 🔹 Fetch note content
const fetchNote = async (folder: string, file: string) => {
  const { data } = await axios.get(`${apiHost}/note/${folder}/${file}`, {
    responseType: "text",
  });
  return data;
};

export default function NoteViewer() {
  const { folder, file } = useParams<{ folder: string; file: string }>();

  const {
    data: content,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["note", folder, file],
    queryFn: () => fetchNote(folder!, file!),
    enabled: !!folder && !!file, // only run when params exist
  });

  if (isLoading) return <p>Loading note...</p>;
  if (isError) return <p className="text-red-500">{(error as Error).message}</p>;

  return (
<div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 overflow-auto">
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 overflow-auto w-full max-w-[290px] md:max-w-[1024px] lg:max-w-[1200px]">
    <div
      className="
        markdown-body
        !bg-transparent
        !text-gray-900
        dark:!text-gray-100
        dark:!bg-transparent
        text-sm sm:text-base md:text-lg
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  </div>
</div>

  );
}
