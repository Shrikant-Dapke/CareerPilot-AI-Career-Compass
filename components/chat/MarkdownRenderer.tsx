"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-sm prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-li:marker:text-zinc-500">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
