

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lecture = {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string | null;
};

type RecordedPlayerProps = {
  lectureId: string;
};

const supabase = createClient();

export default function RecordedPlayer({ lectureId }: RecordedPlayerProps) {
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [recommendations, setRecommendations] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLecture = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("live_lectures")
        .select("id, title, description, youtube_url, thumbnail_url")
        .eq("id", lectureId)
        .single();

      if (!error && data) {
        setCurrentLecture(data);
      }

      setLoading(false);
    };

    fetchLecture();
  }, [lectureId]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const { data, error } = await supabase
        .from("live_lectures")
        .select("id, title, description, youtube_url, thumbnail_url")
        .neq("id", lectureId)
        .limit(10);

      if (!error && data) {
        setRecommendations(data);
      }
    };

    fetchRecommendations();
  }, [lectureId]);

  const getEmbedUrl = (url: string) => {
    try {
      const videoId = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    } catch {
      return url;
    }
  };

  const embedUrl = currentLecture
    ? getEmbedUrl(currentLecture.youtube_url)
    : "";

  if (loading) {
    return <p className="text-gray-500">Loading lecture...</p>;
  }

  if (!currentLecture) {
    return <p className="text-gray-500">Lecture not found</p>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* PLAYER */}
      <div className="flex-1">
        <div className="bg-black rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            title={currentLecture.title}
            loading="lazy"
            className="w-full h-[220px] md:h-[500px]"
            allowFullScreen
          />
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold">
            {currentLecture.title}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {currentLecture.description}
          </p>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="w-full md:w-80 space-y-4 max-h-[500px] overflow-y-auto">
        {recommendations.map((lecture) => (
          <div
            key={lecture.id}
            onClick={() => {
              setCurrentLecture(lecture);
            }}
            className="flex gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
          >
            <img
              src={
                lecture.thumbnail_url ||
                `https://img.youtube.com/vi/${
                  new URL(lecture.youtube_url).searchParams.get("v")
                }/hqdefault.jpg`
              }
              className="w-24 h-16 object-cover rounded"
            />

            <div>
              <p className="text-sm font-medium line-clamp-2">
                {lecture.title}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}