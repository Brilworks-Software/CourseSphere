import React from "react";
import dynamic from "next/dynamic";
import { ClientFallback } from "./ClientFallback";

type Props = {
  params: { id: string };
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

export default async function Page({ params }: Props) {
  const id = params?.id;

  // Guard against missing/invalid id (sometimes 'undefined' is passed as a string)
  if (!id || id === "undefined") {
    // Render client-side fallback which reads the id using useParams on the client
    return <ClientFallback />;
  }

  let res: Response;
  try {
    res = await fetch(`/api/live-stream?stream_id=${encodeURIComponent(id)}`);
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

  // determine if stream is live (support a few common field names)
  const isLive = Boolean(
    stream.is_live || stream.live || stream.status === "live",
  );

  const youtubeId =
    getYouTubeId(stream.youtube_video_id) ??
    getYouTubeId(stream.youtube_video_url);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{stream.title}</h1>
      {youtubeId ? (
        <div className="mt-4 mx-auto h-96" style={{ maxWidth: 1200 }}>
          {/* container enforces 16:9 aspect ratio and scales to maxWidth */}
          <div style={{ width: "100%", aspectRatio: "16/9" }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              width="100%"
              height="100%"
              allowFullScreen
            />
            <iframe
  width="100%"
  height="450"
  src="https://www.youtube.com/embed/rnXIjl_Rzy4?autoplay=1"
  frameBorder="0"
  allow="autoplay; encrypted-media"
  allowFullScreen>
</iframe>
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
