import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ImageUploadWithCrop from "../image-upload";
import { COURSE_CATEGORIES } from "@/app/util/course_category";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { RefObject } from "react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { toast } from "sonner"; // or wherever your toast comes from

const MarkdownEditor = dynamic(() => import("@/components/MarkdownEditor"), { ssr: false });

const MAX_WORDS = 3000;

function stripHtml(html: string) {
  if (!html) return "";
  // Remove HTML tags and decode HTML entities
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface BasicDetailsStepProps {
  title: string;
  setTitle: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  primaryCategory: string;
  setPrimaryCategory: (v: string) => void;
  subCategory: string;
  setSubCategory: (v: string) => void;
  thumbnailUrl: string;
  setThumbnailUrl: (v: string) => void;
  loading: boolean;
  titleRef: RefObject<HTMLInputElement | null>;
  descriptionRef: RefObject<HTMLTextAreaElement | null>;
  primarySelectRef: RefObject<HTMLButtonElement | null>;
  // requirements and expectations removed
}

export function BasicDetailsStep({
  title, setTitle, subtitle, setSubtitle, description, setDescription,
  language, setLanguage, level, setLevel, primaryCategory, setPrimaryCategory,
  subCategory, setSubCategory, thumbnailUrl, setThumbnailUrl, loading,
  titleRef, descriptionRef, primarySelectRef,
  // requirements, setRequirements, expectations, setExpectations removed
}: BasicDetailsStepProps) {
  const selectedCategory = COURSE_CATEGORIES.find((c: any) => c.value === primaryCategory);
  const plainText = useMemo(() => stripHtml(description), [description]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);

  return (
    <form
      onSubmit={e => e.preventDefault()}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="title">Course title</Label>
        <Input
          id="title"
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          ref={titleRef}
        />
        <div className="text-xs text-muted-foreground mt-1">Your title should be a mix of attention-grabbing, informative, and optimized for search</div>
      </div>
      <div>
        <Label htmlFor="subtitle">Course subtitle</Label>
        <Input
          id="subtitle"
          type="text"
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          maxLength={120}
        />
        <div className="text-xs text-muted-foreground mt-1">Use 1 or 2 related keywords, and mention 3-4 of the most important areas that you've covered during your course.</div>
      </div>
      <div>
        <Label htmlFor="description">Course description</Label>
        <div>
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="Write a detailed course description..."
            textareaName="description"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-muted-foreground">
              Description should have minimum 200 words.
            </div>
            <div className={`text-xs ${wordCount > MAX_WORDS ? "text-red-500" : "text-muted-foreground"}`}>
              {wordCount} / {MAX_WORDS} words
            </div>
          </div>
        </div>
        {/* Hidden input for form validation */}
        <input
          type="text"
          value={description}
          required
          readOnly
          ref={descriptionRef as any}
          style={{ display: "none" }}
        />
      </div>
      <div className="space-y-4">
        <Label className="block text-sm font-medium mb-1">Category *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              value={primaryCategory}
              onValueChange={(val) => {
                setPrimaryCategory(val);
                setSubCategory("");
              }}
              disabled={loading}
              required
            >
              <SelectTrigger className="w-full" ref={primarySelectRef}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {COURSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={subCategory}
              onValueChange={setSubCategory}
              disabled={!primaryCategory || loading}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub-category" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {selectedCategory?.children?.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value}>
                    {sub.label}
                  </SelectItem>
                )) ?? null}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Basic info</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Select Level --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="all_levels">All Levels</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Course image</Label>
        <ImageUploadWithCrop
          value={thumbnailUrl}
          onChange={url => setThumbnailUrl(url ?? "")}
          showPreview={true}
          disabled={loading}
          aspectRatio={"landscape"}
        />
        <input type="text" value={thumbnailUrl} required readOnly style={{ display: "none" }} />
      </div>
      {/* requirements and expectations fields removed */}
    </form>
  );
}
