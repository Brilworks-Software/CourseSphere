"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Stream = {
  title?: string;
  description?: string;
  youtube_video_id?: string | null;
  youtube_video_url?: string | null;
};

function getYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const value = String(urlOrId).trim();
  if (!value.includes("/")) return value || null;
  try {
    const u = new URL(value);
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  } catch (e) {
    return null;
  }
}

export function ClientFallback() {
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<Stream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === "undefined") {
      setError("Invalid stream id");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/live-stream?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setStream(data);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to fetch stream data");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Live stream not found</h2>
      </div>
    );
  }

  const youtubeId =
    getYouTubeId(stream.youtube_video_id) ??
    getYouTubeId(stream.youtube_video_url);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{stream.title}</h1>
      {youtubeId ? (
        <div className="mt-4">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              width="100%"
              height="750"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-muted-foreground">
          No video available for this stream.
        </div>
      )}

      {stream.description ? (
        <div className="mt-2">{stream.description}</div>
      ) : null}
    </div>
  );
}
