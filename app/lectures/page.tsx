"use client";
import Navbar from "../components/ui/Navbar";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Footer from "../components/Footer";

type Lecture = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  is_live: boolean;
};

export default function Lecture() {
  const supabase = createClient();

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectures = async () => {
      const { data, error } = await supabase
        .from("live_lectures")
        .select("id, title, thumbnail_url, is_live")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLectures(data);
      }

      setLoading(false);
    };

    fetchLectures();
  }, []);

  return (
    <main>
      <Navbar />

      <div className="p-4 md:p-8">
        <h1 className="text-xl font-semibold mb-6">Lectures</h1>

        {loading ? (
          <p className="text-gray-500">Loading lectures...</p>
        ) : (
          <>
            {/* LIVE SECTION */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4">Live Lectures</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {lectures
                  .filter((lecture) => lecture.is_live)
                  .map((lecture) => (
                    <a
                      key={lecture.id}
                      href={`/lectures/${lecture.id}`}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      <div className="relative h-40 bg-gray-200">
                        <img
                          src={
                            lecture.thumbnail_url ||
                            "https://via.placeholder.com/300"
                          }
                          className="w-full h-full object-cover"
                        />

                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          LIVE
                        </span>
                      </div>

                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-2">
                          {lecture.title}
                        </p>
                      </div>
                    </a>
                  ))}
              </div>
            </div>

            {/* RECORDED SECTION */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recorded Lectures</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {lectures
                  .filter((lecture) => !lecture.is_live)
                  .map((lecture) => (
                    <a
                      key={lecture.id}
                      href={`/recorded/${lecture.id}`}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      <div className="relative h-40 bg-gray-200">
                        <img
                          src={
                            lecture.thumbnail_url ||
                            "https://via.placeholder.com/300"
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-2">
                          {lecture.title}
                        </p>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}