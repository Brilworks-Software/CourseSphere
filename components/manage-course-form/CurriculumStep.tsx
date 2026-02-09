"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  Video,
  Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UploadCloud, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";

interface CurriculumStepProps {
  courseId: string;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}
interface Lesson {
  id: string;
  title: string;
  section_id: string;
  order_index: number;
  video_url?: string | null;
  duration?: number | null;
}

export function CurriculumStep({ courseId }: CurriculumStepProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitleEdit, setSectionTitleEdit] = useState("");
  const [showLessonDialog, setShowLessonDialog] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitleEdit, setLessonTitleEdit] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Video upload state per lesson
  const [videoUploadState, setVideoUploadState] = useState<{
    [lessonId: string]: {
      show: boolean;
      file: File | null;
      uploading: boolean;
      progress: number;
      error: string | null;
      success: boolean;
    };
  }>({});

  // Track which section is expanded
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  async function fetchSections() {
    setLoading(true);
    try {
      const secRes = await fetch(`/api/admin/courses/sections/${courseId}`);
      const secData = await secRes.json();
      // Normalize so each section has a lessons array
      setSections(
        Array.isArray(secData)
          ? secData.map((s: any) => ({ ...s, lessons: s.lessons ?? [] }))
          : [],
      );
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Fetch only one section (for partial refresh)
  async function fetchSection(sectionId: string) {
    try {
      const res = await fetch(`/api/admin/courses/sections/${courseId}`);
      const all = await res.json();
      // Find the updated section in the returned list and normalize lessons
      if (Array.isArray(all)) {
        const updated = all.find((s: any) => s.id === sectionId);
        if (updated) {
          setSections((prev) =>
            prev.map((sec) =>
              sec.id === sectionId
                ? { ...updated, lessons: updated.lessons ?? [] }
                : sec,
            ),
          );
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    fetchSections();
  }, [courseId]);

  // Add Section
  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/sections/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSectionTitle,
          description: newSectionDesc,
        }),
      });
      if (!res.ok) throw new Error("Failed to create section");
      setShowSectionDialog(false);
      setNewSectionTitle("");
      setNewSectionDesc("");
      await fetchSections();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Edit Section
  async function handleEditSection(sectionId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/sections/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, title: sectionTitleEdit }),
      });
      if (!res.ok) throw new Error("Failed to update section");
      setEditingSectionId(null);
      await fetchSection(sectionId);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Delete Section
  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Delete this section and all its lessons?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/sections/${courseId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      });
      if (!res.ok) throw new Error("Failed to delete section");
      setSections((prev) => prev.filter((sec) => sec.id !== sectionId));
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Add Lesson
  async function handleAddLesson(e: React.FormEvent, sectionId: string) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/courses/sections/lessons/${sectionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId, title: newLessonTitle }),
        },
      );
      if (!res.ok) throw new Error("Failed to create lesson");
      setShowLessonDialog(null);
      setNewLessonTitle("");
      await fetchSection(sectionId); // Only refresh this section
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Edit Lesson Title
  async function handleEditLesson(sectionId: string, lessonId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/courses/sections/lessons/${lessonId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: lessonTitleEdit }),
        },
      );
      if (!res.ok) throw new Error("Failed to update lesson");
      setEditingLessonId(null);
      await fetchSection(sectionId);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Delete Lesson
  async function handleDeleteLesson(sectionId: string, lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/courses/sections/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) throw new Error("Failed to delete lesson");
      await fetchSection(sectionId);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Open/close upload UI for a lesson
  const toggleVideoUpload = (lessonId: string, show: boolean) => {
    setVideoUploadState((prev) => ({
      ...prev,
      [lessonId]: {
        show,
        file: null,
        uploading: false,
        progress: 0,
        error: null,
        success: false,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-destructive">{error}</div>}

      {/* Skeleton Loader */}
      {loading ? (
        <div>
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="border rounded-lg p-4 mb-4 bg-muted">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-6 w-64" />
              </div>
              <div className="space-y-2 ml-4">
                {[...Array(2)].map((_, lidx) => (
                  <div
                    key={lidx}
                    className="flex items-center border rounded p-2 bg-background"
                  >
                    <Skeleton className="h-5 w-40 mr-4" />
                    <Skeleton className="h-5 w-16 mr-2" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                ))}
                <Skeleton className="h-8 w-32 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Accordion for Sections */}
          <Accordion
            type="single"
            collapsible
            value={expandedSection ?? undefined}
            onValueChange={setExpandedSection}
          >
            {sections.map((section) => {
              const isOpen = expandedSection === section.id;
              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className={`mb-3  rounded-lg overflow-hidden`}
                >
                  <div
                    className={`flex items-center justify-between w-full px-4 py-3 transition-all `}
                  >
                    <AccordionTrigger
                      className={`flex-1 min-w-0 py-0 w-full  hover:no-underline`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Layers className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-lg truncate">
                          {section.title}
                        </span>
                        {section.description && (
                          <span className="ml-2 text-xs text-muted-foreground italic truncate">
                            {section.description}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSectionId(section.id);
                            setSectionTitleEdit(section.title);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" /> Edit Section Title
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSection(section.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Section
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <AccordionContent>
                    {/* Edit section title inline */}
                    {editingSectionId === section.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEditSection(section.id);
                        }}
                        className="flex gap-2 mx-2"
                      >
                        <Input
                          value={sectionTitleEdit}
                          onChange={(e) => setSectionTitleEdit(e.target.value)}
                          className="w-full"
                          required
                          minLength={3}
                        />
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSectionId(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    )}
                    {/* Lessons List */}
                    <div className="space-y-2 p-3">
                      {(section.lessons ?? []).map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex flex-col border rounded-lg p-3 bg-background shadow-sm hover:shadow-md transition-shadow mb-2"
                        >
                          <div className="flex items-center w-full">
                            <div className="flex-1 flex items-center gap-2">
                              {lesson.video_url && (
                                <Video className="w-4 h-4 text-primary" />
                              )}
                              <span className="font-medium">
                                {lesson.title}
                              </span>
                            </div>
                            {/* Video Upload/Change Button OUTSIDE More menu */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="mr-2 flex items-center gap-1"
                              onClick={() =>
                                toggleVideoUpload(
                                  lesson.id,
                                  !videoUploadState[lesson.id]?.show,
                                )
                              }
                            >
                              {lesson.video_url ? (
                                <>
                                  <RefreshCcw className="w-4 h-4" /> Change
                                  Video
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" /> Upload
                                  Video
                                </>
                              )}
                            </Button>
                            {/* More menu for Edit/Delete */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingLessonId(lesson.id);
                                    setLessonTitleEdit(lesson.title);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                  Lesson Title
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteLesson(section.id, lesson.id)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  Lesson
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {/* Edit lesson title form */}
                          {editingLessonId === lesson.id && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleEditLesson(section.id, lesson.id);
                              }}
                              className="flex gap-2 w-full mt-2"
                            >
                              <Input
                                value={lessonTitleEdit}
                                onChange={(e) =>
                                  setLessonTitleEdit(e.target.value)
                                }
                                minLength={3}
                                required
                              />
                              <Button type="submit" size="sm">
                                Save
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingLessonId(null)}
                              >
                                Cancel
                              </Button>
                            </form>
                          )}
                          {/* Video upload UI for this lesson */}
                          {videoUploadState[lesson.id]?.show && (
                            <div className="mt-3 border rounded-lg p-4 bg-muted">
                              <MediaUploader
                                type="video"
                                label="Upload Lesson Video"
                                onUploaded={async (
                                  publicUrl: string,
                                  uploadUrl?: string,
                                ) => {
                                  // Save both publicUrl and uploadUrl to lesson
                                  setVideoUploadState((prev) => ({
                                    ...prev,
                                    [lesson.id]: {
                                      ...prev[lesson.id],
                                      uploading: true,
                                      error: null,
                                      success: false,
                                    },
                                  }));
                                  try {
                                    const response = await fetch(
                                      `/api/admin/courses/lesson/${lesson.id}`,
                                      {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          video_url: publicUrl,
                                          uploadUrl: uploadUrl || null,
                                        }),
                                      },
                                    );
                                    if (!response.ok) {
                                      const data = await response.json();
                                      throw new Error(
                                        data.error || "Failed to update lesson",
                                      );
                                    }
                                    setVideoUploadState((prev) => ({
                                      ...prev,
                                      [lesson.id]: {
                                        ...prev[lesson.id],
                                        uploading: false,
                                        error: null,
                                        success: true,
                                      },
                                    }));
                                    await fetchSections();
                                  } catch (err: any) {
                                    setVideoUploadState((prev) => ({
                                      ...prev,
                                      [lesson.id]: {
                                        ...prev[lesson.id],
                                        uploading: false,
                                        error: err.message,
                                      },
                                    }));
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  toggleVideoUpload(lesson.id, false)
                                }
                                disabled={
                                  videoUploadState[lesson.id]?.uploading
                                }
                                className="mt-2"
                              >
                                Cancel
                              </Button>
                              {videoUploadState[lesson.id]?.uploading && (
                                <div className="mt-2 text-xs text-muted-foreground text-center">
                                  Uploading...
                                </div>
                              )}
                              {videoUploadState[lesson.id]?.error && (
                                <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
                                  <XCircle className="w-5 h-5" />
                                  {videoUploadState[lesson.id]?.error}
                                </div>
                              )}
                              {videoUploadState[lesson.id]?.success && (
                                <div className="mt-2 flex items-center gap-2 text-success text-sm">
                                  <CheckCircle2 className="w-5 h-5 text-primary" />
                                  Video uploaded and lesson updated!
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                Note: All files should be at least 720p and less
                                than 4.0 GB.
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Add Lesson Button */}
                      {showLessonDialog === section.id ? (
                        <form
                          onSubmit={(e) => handleAddLesson(e, section.id)}
                          className="flex gap-2 mt-2"
                        >
                          <Input
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            placeholder="New Lecture Title"
                            required
                            minLength={3}
                          />
                          <Button type="submit" disabled={loading}>
                            <Plus className="w-4 h-4 mr-1" /> Add Lecture
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLessonDialog(null)}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <Button
                          // variant="secondary"
                          size="sm"
                          className="mt-2 w-full flex items-center gap-2"
                          onClick={() => setShowLessonDialog(section.id)}
                        >
                          <Plus className="w-4 h-4" /> Add Lecture
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          {/* Add Section Button */}
          <Button
            variant="secondary"
            className="w-full flex items-center gap-2 py-6 text-lg "
            onClick={() => setShowSectionDialog(true)}
          >
            <Plus className="w-5 h-5" /> Section
          </Button>
          {/* Section Dialog */}
          <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Section</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSection} className="space-y-2">
                <Input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Enter a Title"
                  required
                  minLength={3}
                  maxLength={80}
                />
                <div>
                  <label className="text-sm font-medium">
                    What will students be able to do at the end of this section?
                  </label>
                  <Input
                    value={newSectionDesc}
                    onChange={(e) => setNewSectionDesc(e.target.value)}
                    placeholder="Enter a Learning Objective"
                    maxLength={200}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    Add Section
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSectionDialog(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
