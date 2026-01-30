"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { EDITOR_MENUBAR, EDITOR_PLUGIN, EDITOR_TOOLBAR } from "@/lib/utils";
import { Editor } from "@tinymce/tinymce-react";
import React from "react";

interface ReusableEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textareaName?: string;
}

export default function ReusableEditor({
  value,
  onChange,
  placeholder = "Email template",
  textareaName = "body",
}: ReusableEditorProps) {
  const { theme, systemTheme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<string>("light");

  // Sync TinyMCE theme with system or selected theme
  useEffect(() => {
    if (theme === "system") {
      setResolvedTheme(systemTheme || "light");
    } else {
      setResolvedTheme(theme as string);
    }
  }, [theme, systemTheme]);

  return (
    <Editor
      key={resolvedTheme} // force re-mount on theme change
      init={{
        plugins: EDITOR_PLUGIN,
        convert_urls: false,
        promotion: false,
        branding: false,
        browser_spellcheck: true,
        placeholder: placeholder,
        visual: false,
        menubar: EDITOR_MENUBAR,
        toolbar: EDITOR_TOOLBAR,
        mobile: {
          menubar: EDITOR_MENUBAR,
        },
        contextmenu: false,
        content_style: `
          body {
            color: ${resolvedTheme === "dark" ? "#f1f5f9" : "#1e293b"};
            background-color: ${resolvedTheme === "dark" ? "#000000" : "#ffffff"};
          }
          p { margin: auto; }
        `,
        skin: resolvedTheme === "dark" ? "oxide-dark" : "oxide",
        content_css: resolvedTheme === "dark" ? "dark" : "default",
      }}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY}
      textareaName={textareaName}
      value={value}
      onEditorChange={(newValue: string) => onChange(newValue)}
    />
  );
}
