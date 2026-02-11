"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Props = {
  params: { id: string };
};

type Stream = {
  title?: string;
  description?: string;
  youtube_video_id?: string | null;
  youtube_video_url?: string | null;
  is_live?: boolean;
  live?: boolean;
  status?: string;
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

// Client-side fallback component for when id is not available at build time
function ClientSideStream() {
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
    fetch(`/api/admin/courses/live-stream/${encodeURIComponent(id)}`)
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
        <div className="mt-4 mx-auto h-96" style={{ maxWidth: 1200 }}>
          <div style={{ width: "100%", aspectRatio: "16/9" }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              width="100%"
              height="100%"
              allowFullScreen
            />
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

export default async function Page({ params }: Props) {
  const id = params?.id;

  // If id is missing or invalid, render client-side fallback
  if (!id || id === "undefined") {
    return <ClientSideStream />;
  }

  let res: Response;
  try {
    res = await fetch(`/api/admin/courses/live-stream/${id}`);
  } catch (e) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Network error</h2>
        <p className="text-sm text-muted-foreground">
          Failed to fetch stream data.
        </p>
      </div>
    );
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Live stream not found</h2>
        <p className="text-sm text-muted-foreground">
          {errBody?.error ?? `Request failed: ${res.status}`}
        </p>
      </div>
    );
  }

  const stream = await res.json();

  const youtubeId =
    getYouTubeId(stream.youtube_video_id) ??
    getYouTubeId(stream.youtube_video_url);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{stream.title}</h1>
      {youtubeId ? (
        <div className="mt-4 mx-auto h-96" style={{ maxWidth: 1200 }}>
          <div style={{ width: "100%", aspectRatio: "16/9" }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              width="100%"
              height="100%"
              allowFullScreen
            />
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
