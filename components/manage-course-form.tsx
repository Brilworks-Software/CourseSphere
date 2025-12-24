"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import ImageUploadWithCrop from "./image-upload";
import { COURSE_CATEGORIES } from "@/app/util/course_category";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function ManageCourseForm({ course }: { course: Course }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [isActive, setIsActive] = useState(course.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // keep track of the thumbnail URL from the image uploader
  // use empty string as default to simplify form serialization and updates
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    (course as any).thumbnail_url ?? ""
  );

  // add category state (primary and sub)
  const [primaryCategory, setPrimaryCategory] = useState<string>(
    (course as any).primary_category ?? ""
  );
  const [subCategory, setSubCategory] = useState<string>(
    (course as any).sub_category ?? ""
  );

  // derive selected primary category to show its children as sub-options
  const selectedCategory = COURSE_CATEGORIES.find(
    (c) => c.value === primaryCategory
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          is_active: isActive,
          thumbnail_url: thumbnailUrl === "" ? null : thumbnailUrl,
          // include category fields (use DB column names)
          primary_category: primaryCategory === "" ? null : primaryCategory,
          sub_category: subCategory === "" ? null : subCategory,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update course");
      }

      router.refresh();
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Textarea
          id="title"
          rows={2}
          required
          title="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          title="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <ImageUploadWithCrop
          value={thumbnailUrl}
          onChange={(url) => setThumbnailUrl(url ?? "")}
          showPreview={true}
          disabled={loading}
          aspectRatio={"landscape"}
        />
      </div>

      {/* Category selects: choose primary category first, then sub-category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full">
          <Label className="block text-sm font-medium mb-1">Category</Label>
          <Select
            value={primaryCategory}
            onValueChange={(val) => {
              setPrimaryCategory(val);
              // reset sub-category when primary changes
              setSubCategory("");
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
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

        <div className="w-full">
          <Label className="block text-sm font-medium mb-1">Sub-category</Label>
          <Select
            value={subCategory}
            onValueChange={setSubCategory}
            disabled={!primaryCategory || loading}
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(Boolean(checked))}
        />
        <Label htmlFor="is_active" className="mb-0">
          Course is active
        </Label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Course"
        )}
      </Button>
    </form>
  );
}
