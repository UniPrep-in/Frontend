"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, TriangleAlert } from "lucide-react";
import Loader from "@/app/components/ui/loader";

type ViewSolutionsGateProps = {
  attemptId: string;
};

const BUTTON_CLASS_NAME =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800";
const CONSUMED_BUTTON_CLASS_NAME =
  "inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500";

function getConsumedKey(attemptId: string) {
  return `mock-solution-consumed:${attemptId}`;
}

function getPendingKey(attemptId: string) {
  return `mock-solution-pending:${attemptId}`;
}

function getActiveKey(attemptId: string) {
  return `mock-solution-active:${attemptId}`;
}

export default function ViewSolutionsGate({
  attemptId,
}: ViewSolutionsGateProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [hasConsumedSolutionAccess, setHasConsumedSolutionAccess] = useState(false);
  const solutionsHref = `/attempts/${attemptId}/solutions`;

  const storageKeys = useMemo(
    () => ({
      consumed: getConsumedKey(attemptId),
      pending: getPendingKey(attemptId),
      active: getActiveKey(attemptId),
    }),
    [attemptId],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    sessionStorage.removeItem(storageKeys.pending);
    sessionStorage.removeItem(storageKeys.active);
    setHasConsumedSolutionAccess(localStorage.getItem(storageKeys.consumed) === "1");
    router.prefetch(solutionsHref);
  }, [router, solutionsHref, storageKeys]);

  useEffect(() => {
    if (!isModalOpen || hasConsumedSolutionAccess) {
      return;
    }

    router.prefetch(solutionsHref);
  }, [hasConsumedSolutionAccess, isModalOpen, router, solutionsHref]);

  function handleOpen() {
    if (hasConsumedSolutionAccess || isContinuing) {
      return;
    }

    setIsModalOpen(true);
  }

  function handleContinue() {
    if (typeof window === "undefined" || isContinuing) {
      return;
    }

    setIsContinuing(true);
    sessionStorage.setItem(storageKeys.pending, "1");
    setIsModalOpen(false);
    router.push(solutionsHref);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={hasConsumedSolutionAccess || isContinuing}
        className={
          hasConsumedSolutionAccess ? CONSUMED_BUTTON_CLASS_NAME : BUTTON_CLASS_NAME
        }
      >
        <BookOpenCheck className="h-4 w-4" />
        {hasConsumedSolutionAccess ? "Solutions Already Viewed" : "View Solutions"}
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <TriangleAlert className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Important
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Solutions can be opened only once
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Once you open the solutions for this attempt, they cannot be opened again
                  after you leave this screen. Continue only if you are ready to review
                  them now.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isContinuing}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={isContinuing}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue to Solutions
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isContinuing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-100/95 px-4 backdrop-blur-sm">
          <Loader
            title="Opening solutions"
            subtitle="Preparing your review screen."
          />
        </div>
      ) : null}
    </>
  );
}
