"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EnrollButton({
  courseId,
  userId,
  isFree,
  price,
}: {
  courseId: string;
  userId: string;
  isFree?: boolean;
  price?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const handleEnroll = async () => {
    setLoading(true);
    try {
      await fetch("/api/student/courses/enroll", {
        method: "POST",
        body: JSON.stringify({ courseId, userId }),
        headers: { "Content-Type": "application/json" },
      });
      // reload to reflect enrollment immediately
      window.location.reload();
    } catch (err) {
      setLoading(false);
      // NOTE: could integrate toast/notification here
    }
  };

  return (
    <Button type="button" className="w-full" onClick={handleEnroll} disabled={loading}>
      {loading ? "Enrolling..." : isFree ? "Enroll for Free" : price ? `Enroll — ₹${price}` : "Enroll in Course"}
    </Button>
  );
}
