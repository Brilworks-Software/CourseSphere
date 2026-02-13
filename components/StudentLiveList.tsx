"use client";
import Link from "next/link";
import { useUserContext } from "@/app/provider/user-context";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {};

const StudentLiveList = (props: Props) => {
  const { user } = useUserContext();
  const [streams, setStreams] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;

    const fetchStreams = async () => {
      setLoading(true);
      setError(null);
      try {
        // call API to get streams for courses where this student is enrolled
        const res = await fetch(
          `/api/live-stream?student_id=${user.id}&only_live=true`,
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err?.error || `Request failed: ${res.status}`);
          setStreams([]);
        } else {
          const data = await res.json();
          setStreams(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        setError(e?.message || String(e));
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, [user?.id]);

  const getYoutubeThumbnail = (videoId?: string, url?: string) => {
    // Prefer direct videoId if available
    if (videoId && typeof videoId === "string" && videoId.length === 11) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    // Fallback: extract from URL
    if (url) {
      try {
        const regExp =
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
        const match = url.match(regExp);
        if (match && match[1]) {
          return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
      } catch {}
    }
    return null;
  };

  if (!user)
    return (
      <div className="text-sm text-muted-foreground">
        Please sign in to see your live streams.
      </div>
    );

  if (loading)
    return (
      <div className="text-sm text-muted-foreground">
        Loading live streams...
      </div>
    );

  if (error) return <div className="text-sm text-destructive">{error}</div>;

  if (streams.length === 0)
    return (
      <div className="text-sm text-muted-foreground">
        No ongoing live streams for your courses.
      </div>
    );

  return (
    <Carousel
      className="w-full"
      showArrows={true}
      header={
        <h4 className="text-xl font-bold text-foreground">Live Streams</h4>
      }
    >
      <CarouselContent>
        {streams.map((s: any) => (
          <CarouselItem key={s.id} className="md:basis-1/2 lg:basis-1/4">
            <Link href={`/courses/live-stream/${s.id}`} className="block">
              <Card className="hover:shadow-sm transition overflow-hidden">
                {getYoutubeThumbnail(
                  s.youtube_video_id,
                  s.youtube_video_url,
                ) && (
                  <img
                    src={
                      getYoutubeThumbnail(
                        s.youtube_video_id,
                        s.youtube_video_url,
                      )!
                    }
                    alt="YouTube Thumbnail"
                    className="w-full h-40 object-cover rounded-t"
                    style={{ borderBottom: "1px solid #eee" }}
                  />
                )}
                <CardHeader className="flex items-start justify-between gap-4 py-3 px-4">
                  <div>
                    <CardTitle className="font-semibold text-xl">
                      {s.title}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {s.description ?? ""}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground flex flex-col items-end">
                    <div className="mb-2">
                      {s.scheduled_start_at
                        ? new Date(s.scheduled_start_at).toLocaleString()
                        : ""}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="text-sm text-muted-foreground">
                    Instructor: {s.instructor?.first_name ?? ""}{" "}
                    {s.instructor?.last_name ?? ""}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default StudentLiveList;
