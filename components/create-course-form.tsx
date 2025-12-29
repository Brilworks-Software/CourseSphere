"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ImageUploadWithCrop from "./image-upload";
import { COURSE_CATEGORIES } from "@/app/util/course_category";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUserContext } from "@/app/provider/user-context";
import { PlusCircle } from "lucide-react";

export function CreateCourseForm() {
  const { user } = useUserContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // thumbnail and category states (start empty for creation)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");

  // New fields for is_free and price
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");

  const selectedCategory = COURSE_CATEGORIES.find(
    (c) => c.value === primaryCategory
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate all required fields
    if (!title.trim()) {
      setError("Course title is required.");
      setLoading(false);
      return;
    }
    if (!description.trim()) {
      setError("Course description is required.");
      setLoading(false);
      return;
    }
    if (!thumbnailUrl) {
      setError("Course thumbnail is required.");
      setLoading(false);
      return;
    }
    if (!primaryCategory) {
      setError("Primary category is required.");
      setLoading(false);
      return;
    }
    if (!subCategory) {
      setError("Sub-category is required.");
      setLoading(false);
      return;
    }
    if (typeof isActive !== "boolean") {
      setError("Course active status is required.");
      setLoading(false);
      return;
    }
    if (typeof isFree !== "boolean") {
      setError("Course free/paid status is required.");
      setLoading(false);
      return;
    }
    // Validate price if not free
    if (!isFree && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      setError("Please enter a valid price for paid courses.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          is_active: isActive,
          thumbnail_url: thumbnailUrl === "" ? null : thumbnailUrl,
          primary_category: primaryCategory === "" ? null : primaryCategory,
          sub_category: subCategory === "" ? null : subCategory,
          instructor_id: user?.id,
          organization_id: user?.organization_id,
          is_free: isFree,
          price: isFree ? 0 : Number(price),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create course");
      }

      const data = await response.json();
      setLoading(false);
      router.push(`/courses/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Show organization creation prompt if user has no organization
  if (!user?.organization_id) {
    return (
      <div className="text-center py-16">
        <div className="mb-4">
          <span className="inline-block rounded-full bg-muted p-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </span>
        </div>
        <p className="text-muted-foreground mb-2 text-lg font-medium">
          You need to create an Organization first
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Before creating a course, please create your organization.
        </p>
        <Button onClick={() => router.push("/organization")}>
          Create your Organization
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-card border-border rounded-lg shadow-lg p-6"
    >
      {error && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div>
        <Label
          htmlFor="title"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Course Title *
        </Label>
        <Input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter course title"
        />
      </div>

      <div>
        <Label
          htmlFor="description"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Description *
        </Label>
        <Textarea
          id="description"
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter course description"
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
        {/* Hidden input for required validation */}
        <input
          type="text"
          value={thumbnailUrl}
          required
          readOnly
          style={{ display: "none" }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full">
          <Label className="block text-sm font-medium mb-1">Category *</Label>
          <Select
            value={primaryCategory}
            onValueChange={(val) => {
              setPrimaryCategory(val);
              setSubCategory("");
            }}
            disabled={loading}
            required
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
          <Label className="block text-sm font-medium mb-1">
            Sub-category *
          </Label>
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

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Checkbox
            id="is_free"
            checked={isFree}
            onCheckedChange={(v) => setIsFree(Boolean(v))}
            className="h-4 w-4 text-accent focus:ring-accent border-muted rounded"
            disabled={loading}
            required
          />
          <Label
            htmlFor="is_free"
            className="ml-2 block text-sm text-muted-foreground"
          >
            Free Course
          </Label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="is_active"
            checked={isActive}
            onCheckedChange={(v) => setIsActive(Boolean(v))}
            className="h-4 w-4 text-accent focus:ring-accent border-muted rounded"
            disabled={loading}
            required
          />
          <Label
            htmlFor="is_active"
            className="ml-2 block text-sm text-muted-foreground"
          >
            Course is active
          </Label>
        </div>
      </div>

      {/* Price input, only enabled if not free */}
      <div>
        <Label
          htmlFor="price"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Price (in ₹) {isFree ? "" : "*"}
        </Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="1"
          value={isFree ? "" : price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter course price"
          disabled={isFree || loading}
          required={!isFree}
        />
      </div>

      <div className="flex space-x-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Course"}
        </Button>
        <Button type="button" onClick={() => router.back()} variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}
