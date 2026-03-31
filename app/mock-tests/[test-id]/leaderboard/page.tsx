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

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Leaderboard</h1>

        {currentUser && (
          <div className="flex w-full items-center justify-between gap-2 rounded-xl border bg-emerald-300 px-4 py-3 text-black sm:w-fit sm:px-6 sm:py-4">
            <div>Your Rank</div>
            <div>
              #
              {currentUser.rank}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex w-full gap-2 sm:w-fit">
          <button
            onClick={() => setFilter("today")}
            className={`w-full rounded px-4 py-3 text-sm sm:w-auto sm:px-6 sm:py-4 sm:text-base ${
              filter === "today" ? "bg-blue-300 border rounded-xl text-black" : ""
            }`}
          >
            Today, Resets at 12:00 IST
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <div className="grid min-w-[640px] grid-cols-4 border-b border-neutral-800 bg-black px-4 py-3 text-sm text-white">
          <div>Rank</div>
          <div>User</div>
          <div>Score</div>
          <div>Time</div>
        </div>

        {loading ? (
          <div className="p-6 text-center text bg-white">Loading leaderboard...</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white">
            No attempts yet. Be the first to take this test
          </div>
        ) : (
          <>
            {data.slice(0, 10).map((row) => (
              <div
                key={row.user_id}
                className={`grid min-w-[640px] grid-cols-4 border-b border-gray-200 bg-white px-4 py-3 ${
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
                className="grid min-w-[640px] grid-cols-4 border-b border-gray-300 bg-neutral-200 px-4 py-3"
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