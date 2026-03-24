"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LectureChat from "./chat";

type Lecture = {
  id: string;
  title: string;
  description: string;
  subject: string;
  stream: string;
  youtube_url: string;
  thumbnail_url: string | null;
  is_live: boolean;
};

const supabase = createClient();

export default function LecturesView({ lectureId }: { lectureId: string }) {
  const [liveLecture, setLiveLecture] = useState<Lecture | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLecture = async () => {
      setLoading(true);

      const response = await fetch(`/api/lectures/${lectureId}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { lecture?: Lecture }
        | null;

      setLiveLecture(response.ok ? payload?.lecture ?? null : null);
      setLoading(false);
    };

    void fetchLecture();
  }, [lectureId]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUser({
          id: data.user.id,
          name: data.user.user_metadata?.name || "User",
        });
      }
    };

    void fetchUser();
  }, []);

  const getEmbedUrl = (url: string) => {
    try {
      const videoId = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    } catch {
      return url;
    }
  };

  const embedUrl = liveLecture ? getEmbedUrl(liveLecture.youtube_url) : "";

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Live Lecture</h2>

        {loading ? (
          <p className="text-gray-500">Loading lecture...</p>
        ) : liveLecture ? (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-black rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                title={liveLecture.title}
                loading="lazy"
                className="w-full h-[220px] md:h-[500px]"
                allowFullScreen
              />
              <div className="p-4 bg-white">
                <h3 className="font-semibold">{liveLecture.title}</h3>
                <p className="text-sm text-gray-500">
                  {liveLecture.description}
                </p>
              </div>
            </div>

            <div className="w-full md:w-80">
              {user ? (
                <LectureChat lectureId={liveLecture.id} user={user} />
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Lecture not available for your plan.</p>
        )}
      </div>
    </div>
  );
}
