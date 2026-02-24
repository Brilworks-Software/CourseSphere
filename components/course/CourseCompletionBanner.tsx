"use client";
import { PartyPopper, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CourseCompletionBannerProps {
  onViewCertificate: () => void;
  onDownloadCertificate?: () => void;
}

export default function CourseCompletionBanner({
  onViewCertificate,
  onDownloadCertificate,
}: CourseCompletionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative flex items-center gap-4 rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 px-5 py-4">
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
        <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
          🎉 Congratulations! You've completed this course!
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your certificate is ready. Download it and share your achievement.
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onDownloadCertificate}
        >
          <Download className="w-4 h-4" />
          Download
        </Button>

        {/* <Button
          size="sm"
          className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
          onClick={onViewCertificate}
        >
          View Certificate
        </Button> */}
      </div>
    </div>
  );
}
