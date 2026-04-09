/**
 * Embedding Generation Component
 * Allows manual regeneration of embeddings for a lesson or course
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmbeddingGeneratorProps {
  courseId?: string;
  lessonId?: string;
  courseName?: string;
  lessonName?: string;
  showText?: boolean;
}

interface RegenerateStats {
  processed: number;
  succeeded: number;
  failed: number;
  totalVectors: number;
  totalChunks: number;
  executionTimeMs: number;
}

export function EmbeddingGenerator({
  courseId,
  lessonId,
  courseName = "Course",
  lessonName = "Lesson",
  showText = true,
}: EmbeddingGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RegenerateStats | null>(null);

  const handleGenerateEmbeddings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setStats(null);

    try {
      // Get admin key from environment or localStorage
      const adminKey = "supersecret";

      if (!adminKey) {
        setError("Admin API Key is required");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/regenerate-embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          courseId: courseId || undefined,
          lessonId: lessonId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate embeddings");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setStats(data.stats);
      setLoading(false);

      // Auto-close dialog after 3 seconds on success
      setTimeout(() => {
        setIsOpen(false);
        // Reset state
        setSuccess(false);
        setStats(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
        className="gap-2"
        title="Generate/Regenerate embeddings for semantic search"
      >
        <Zap size={16} />
        {showText && "Generate Embeddings"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Embeddings</DialogTitle>
            <DialogDescription>
              Generate vector embeddings for{" "}
              {courseId ? `${courseName}` : `${lessonName}`}. This enables
              semantic search in the AI chat feature.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info Box */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will chunk your transcripts and generate embeddings for
                semantic search. It may take a few minutes for large courses.
              </AlertDescription>
            </Alert>

            {/* Processing Status */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Generating embeddings...
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  This may take several minutes depending on the amount of
                  content.
                </p>
              </div>
            )}

            {/* Success Status */}
            {success && stats && (
              <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    Embeddings Generated Successfully!
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Processed:</strong> {stats.processed} transcripts
                  </p>
                  <p>
                    <strong>Succeeded:</strong> {stats.succeeded} /{" "}
                    {stats.processed}
                  </p>
                  <p>
                    <strong>Total Chunks:</strong> {stats.totalChunks}
                  </p>
                  <p>
                    <strong>Vectors Created:</strong> {stats.totalVectors}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {(stats.executionTimeMs / 1000).toFixed(2)}s
                  </p>
                </div>
              </div>
            )}

            {/* Error Status */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              {success ? "Close" : "Cancel"}
            </Button>
            {!success && (
              <Button
                onClick={handleGenerateEmbeddings}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate Embeddings
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
