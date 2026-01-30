import React from "react";

type HtmlPreviewProps = {
  html: string;
  className?: string;
};

export default function HtmlPreview({ html, className }: HtmlPreviewProps) {
  if (!html) return null;
  return (
    <div
      className={`${className} EditorPreview`}
      // Assumes HTML is sanitized (e.g., by TinyMCE or backend)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
