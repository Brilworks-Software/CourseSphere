"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ImageUploadWithCrop from "@/components/image-upload";
import { COURSE_CATEGORIES } from "@/app/util/course_category";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useUserContext } from "@/app/provider/user-context";
import Loader from "@/components/loader";

/* -------------------------------- types -------------------------------- */

type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  thumbnail_url?: string;
  categories: string[];
  subcategories: string[];
  is_active: boolean;
  updated_at: string;
};

/* ----------------------------- main page -------------------------------- */

export default function OrganizationSettingsPage() {
  // Render Toaster at the root for toast notifications
  // (should only be rendered once per page, but safe here for this page)
  // Add local state for dialog open

  // Toaster for notifications
  // Place at the top-level of the page component
  // (If already rendered globally, you may remove this, but per instructions, add here)
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const { user } = useUserContext();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [stagedCategories, setStagedCategories] = useState<string[]>([]);
  const [stagedSubcategories, setStagedSubcategories] = useState<string[]>([]);
  const [editSection, setEditSection] = useState<
    null | "overview" | "categories" | "other"
  >(null);

  // Helper: fetch organization if user has organization_id
  const fetchOrganization = async () => {
    if (!user?.organization_id) {
      setLoading(false);
      setOrg(null);
      return;
    }
    setLoading(true);
    const res = await fetch(
      "/api/admin/organization?organization_id=" + user.organization_id
    );
    const data = await res.json();
    setOrg(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organization_id]);

  useEffect(() => {
    setStagedCategories(org?.categories ?? []);
    setStagedSubcategories(org?.subcategories ?? []);
  }, [org?.categories, org?.subcategories]);

  // Helper: get subcategories for selected categories only
  const subCategoryOptions = COURSE_CATEGORIES.filter((c) =>
    stagedCategories.includes(c.value)
  ).flatMap((c) => c.children || []);

  // PATCH: update organization
  const updateOrganization = async (payload: Partial<Organization>) => {
    setSaving(true);
    const res = await fetch("/api/admin/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        organization_id: user?.organization_id,
      }),
    });
    if (!res.ok) {
      toast.error("Update failed", {
        description: "Could not update organization.",
      });
      setSaving(false);
      return;
    }
    await fetchOrganization();
    toast.success("Changes saved");
    setSaving(false);
  };

  // POST: create organization
  const createOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name required");
      return;
    }
    setCreating(true);
    // Use generateAvatarUrl if orgName is available
    const { generateAvatarUrl, DEFAULT_AVATAR_URL } = require("@/lib/utils");
    const logo_url = orgName.trim()
      ? generateAvatarUrl(orgName.trim())
      : DEFAULT_AVATAR_URL;
    const res = await fetch("/api/admin/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName.trim(),
        owner_id: user?.id,
        logo_url,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to create organization");
      setCreating(false);
      return;
    }
    toast.success("Organization created");
    // Reload page to update user context (organization_id)
    globalThis.location.reload();
  };

  // Helper: revert staged values to org values
  const revertStaged = () => {
    setStagedCategories(org?.categories ?? []);
    setStagedSubcategories(org?.subcategories ?? []);
  };

  // If loading, show nothing
  if (loading) return <Loader />;

  // If user has no organization, show creation form
  if (!user?.organization_id) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              disabled={creating}
            />
            <Button
              disabled={creating || !orgName.trim()}
              onClick={createOrganization}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Banner/Thumbnail */}
      <div className="relative w-full superUltraWide-container  bg-muted mb-8">
        <div className="w-full rounded-2xl ">
          {org?.thumbnail_url ? (
            <img
              src={org.thumbnail_url}
              alt="Banner"
              className="object-contain w-full h-full rounded-2xl "
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No banner image
            </div>
          )}
        </div>
        {/* Banner edit icon (shows on hover) */}
        <div className="absolute top-3 right-4 group">
          <button
            className="bg-card border border-primary shadow-2xl text-primary rounded-full p-2 "
            title="Edit banner"
            onClick={() => setBannerDialogOpen(true)}
            type="button"
          >
            <Pencil size={20} />
          </button>
          <span className="sr-only">Edit banner</span>
        </div>
        {/* Logo - circular, overlaps banner and card */}
        <div className="absolute left-10 -bottom-23 flex items-center gap-6">
          <div className="relative group">
            <img
              src={org?.logo_url || ""}
              alt="Logo"
              className="w-36 h-36 rounded-full border-2 border-primary shadow-2xl object-cover bg-card "
            />
            {/* Logo edit icon (shows on hover) */}
            <button
              className="absolute bottom-2 -right-1.75 bg-card border border-primary shadow-2xl text-primary rounded-full p-2"
              title="Edit logo"
              onClick={() => setLogoDialogOpen(true)}
              type="button"
            >
              <Pencil size={18} />
            </button>
            <span className="sr-only">Edit logo</span>
          </div>
          <div className="flex flex-col gap-1 justify-center mt-12">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{org?.name}</h1>
            </div>
            {/* <span className="text-muted-foreground text-sm">{org?.slug}</span> */}
            <span className="text-xs text-muted-foreground">
              Last updated{" "}
              {org?.updated_at
                ? new Date(org.updated_at).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>
        {/* Banner ImageUploadWithCrop */}
        <ImageUploadWithCrop
          open={bannerDialogOpen}
          onOpenChange={setBannerDialogOpen}
          value={org?.thumbnail_url ?? null}
          aspectRatio="superWidescreen"
          showPreview={false}
          onChange={(url) => {
            if (url) updateOrganization({ thumbnail_url: url });
          }}
          className="hidden"
          label=""
        />
        {/* Logo ImageUploadWithCrop */}
        <ImageUploadWithCrop
          open={logoDialogOpen}
          onOpenChange={setLogoDialogOpen}
          value={org?.logo_url ?? null}
          aspectRatio="square"
          showPreview={false}
          onChange={(url) => {
            if (url) updateOrganization({ logo_url: url });
          }}
          className="hidden"
          label=""
        />
      </div>
      <div className="mt-36" />
      {/* Tabs and rest of the content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {/* Main info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Main information</CardTitle>
              {editSection !== "overview" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSection("overview")}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={org?.name || ""}
                  onChange={(e) => setOrg({ ...org!, name: e.target.value })}
                  readOnly={editSection !== "overview"}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={org?.slug || ""}
                  onChange={(e) => setOrg({ ...org!, slug: e.target.value })}
                  readOnly={editSection !== "overview"}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={org?.description || ""}
                  onChange={(e) =>
                    setOrg({ ...org!, description: e.target.value })
                  }
                  readOnly={editSection !== "overview"}
                />
              </div>
              {editSection === "overview" && (
                <div className="flex gap-2">
                  <Button
                    disabled={saving}
                    onClick={() => {
                      updateOrganization({
                        name: org?.name,
                        slug: org?.slug,
                        description: org?.description,
                      });
                      setEditSection(null);
                    }}
                  >
                    Save changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      fetchOrganization();
                      setEditSection(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Measures provided</CardTitle>
              {editSection !== "categories" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSection("categories")}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {COURSE_CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant={
                      stagedCategories.includes(cat.value)
                        ? "default"
                        : "outline"
                    }
                    className={
                      editSection === "categories"
                        ? "cursor-pointer"
                        : "opacity-60 cursor-not-allowed"
                    }
                    onClick={() => {
                      if (editSection !== "categories") return;
                      let updatedCategories: string[];
                      if (stagedCategories.includes(cat.value)) {
                        updatedCategories = stagedCategories.filter(
                          (v) => v !== cat.value
                        );
                        // Remove subcategories belonging to this category
                        const subcats = new Set(
                          (cat.children ?? []).map((s) => s.value)
                        );
                        setStagedSubcategories(
                          stagedSubcategories.filter((v) => !subcats.has(v))
                        );
                      } else {
                        updatedCategories = [...stagedCategories, cat.value];
                      }
                      setStagedCategories(updatedCategories);
                    }}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
              {subCategoryOptions.length > 0 && (
                <>
                  <Label>Subcategories</Label>
                  <div className="flex flex-wrap gap-2">
                    {subCategoryOptions.map((sub) => (
                      <Badge
                        key={sub.value}
                        variant={
                          stagedSubcategories.includes(sub.value)
                            ? "default"
                            : "outline"
                        }
                        className={
                          editSection === "categories"
                            ? "cursor-pointer"
                            : "opacity-60 cursor-not-allowed"
                        }
                        onClick={() => {
                          if (editSection !== "categories") return;
                          const updated = stagedSubcategories.includes(
                            sub.value
                          )
                            ? stagedSubcategories.filter((v) => v !== sub.value)
                            : [...stagedSubcategories, sub.value];
                          setStagedSubcategories(updated);
                        }}
                      >
                        {sub.label}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
              {editSection === "categories" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    disabled={
                      saving ||
                      (JSON.stringify(stagedCategories) ===
                        JSON.stringify(org?.categories ?? []) &&
                        JSON.stringify(stagedSubcategories) ===
                          JSON.stringify(org?.subcategories ?? []))
                    }
                    onClick={() => {
                      updateOrganization({
                        categories: stagedCategories,
                        subcategories: stagedSubcategories,
                      });
                      setEditSection(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      revertStaged();
                      setEditSection(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="other" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Website & status</CardTitle>
              {editSection !== "other" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSection("other")}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Website</Label>
                <Input
                  value={org?.website || ""}
                  onChange={(e) => setOrg({ ...org!, website: e.target.value })}
                  readOnly={editSection !== "other"}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Organization active</Label>
                <Switch
                  checked={org?.is_active || false}
                  onCheckedChange={(v) => {
                    if (editSection === "other")
                      updateOrganization({ is_active: v });
                  }}
                  disabled={editSection !== "other"}
                />
              </div>
              {editSection === "other" && (
                <div className="flex gap-2">
                  <Button
                    disabled={saving}
                    onClick={() => {
                      updateOrganization({ website: org?.website });
                      setEditSection(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      fetchOrganization();
                      setEditSection(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
