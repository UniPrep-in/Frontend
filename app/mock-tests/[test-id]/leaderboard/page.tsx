"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Navbar from "@/app/components/ui/Navbar";
import Footer from "@/app/components/Footer";

const supabase = createClient();

type LeaderboardRow = {
  user_id: string;
  email: string;
  avatar_url: string | null;
  score: number;
  time_taken: number;
  rank: number;
};

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today"); // all | today
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const params = useParams();
  const testId = params["test-id"] as string;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      if (!testId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_leaderboard", {
        test_uuid: testId,
        filter_type: filter,
      });

      if (error) {
        console.error(error);
      } else {
        setData(data || []);
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [filter, testId]);

  const currentUser = data.find((row) => row.user_id === currentUserId);

  return (
    <main className="min-h-screen bg-neutral-100 text-black">
        <div>
            <Navbar />
        </div>

        <div className="mx-auto max-w-6xl py-12">
            {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>

        {currentUser && (
          <div className="bg-emerald-300 border text-black rounded-xl px-6 py-4 flex gap-2 justify-between">
            <div>Your Rank</div>
            <div>
              #
              {currentUser.rank}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("today")}
            className={`px-6 py-4 rounded ${
              filter === "today" ? "bg-blue-300 border rounded-xl text-black" : "bg-gray-800"
            }`}
          >
            Today, Resets at 12:00 IST
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-black rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 border-b border-white text-white text-sm">
          <div>Rank</div>
          <div>User</div>
          <div>Score</div>
          <div>Time</div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-400">Loading leaderboard...</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No attempts yet. Be the first to take this test
          </div>
        ) : (
          <>
            {data.slice(0, 10).map((row) => (
              <div
                key={row.user_id}
                className={`grid grid-cols-4 px-4 py-3 border-b border-gray-800 ${
                  row.user_id === currentUserId
                    ? "bg-neutral-200 border-neutral-300"
                    : ""
                }`}
              >
                <div className="font-bold">
                  {row.rank === 1 && "First"}
                  {row.rank === 2 && "Second"}
                  {row.rank === 3 && "Third"}
                  {row.rank > 3 && `#${row.rank}`}
                </div>
                <div className="flex items-center gap-2">
                  <span>{row.email?.split("@")[0]}</span>
                </div>
                <div>{row.score}</div>
                <div>{Math.floor(row.time_taken / 60)}m</div>
              </div>
            ))}

            {/* Skeleton rows to fill up to 10 */}
            {Array.from({ length: Math.max(0, 10 - data.length) }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="grid grid-cols-4 bg-neutral-200 px-4 py-3 border-b border-gray-300"
              >
                <div className="h-4 bg-neutral-300 animate-pulse rounded w-10" />
                <div className="h-4 bg-neutral-300 animate-pulse rounded w-24" />
                <div className="h-4 bg-neutral-300 animate-pulse rounded w-12" />
                <div className="h-4 bg-neutral-300 animate-pulse rounded w-12" />
              </div>
            ))}
          </>
        )}
      </div>
        </div>

      <div>
        <Footer />
      </div>
    </main>
  );
}