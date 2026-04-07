"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SolutionsAccessGateProps = {
  attemptId: string;
  children: React.ReactNode;
};

function getConsumedKey(attemptId: string) {
  return `mock-solution-consumed:${attemptId}`;
}

function getPendingKey(attemptId: string) {
  return `mock-solution-pending:${attemptId}`;
}

function getActiveKey(attemptId: string) {
  return `mock-solution-active:${attemptId}`;
}

export default function SolutionsAccessGate({
  attemptId,
  children,
}: SolutionsAccessGateProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const cleanupArmedRef = useRef(false);

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

    const hasPendingAccess = sessionStorage.getItem(storageKeys.pending) === "1";
    const hasActiveAccess = sessionStorage.getItem(storageKeys.active) === "1";
    const hasConsumedAccess = localStorage.getItem(storageKeys.consumed) === "1";

    if (hasPendingAccess) {
      sessionStorage.removeItem(storageKeys.pending);
      sessionStorage.setItem(storageKeys.active, "1");
      localStorage.setItem(storageKeys.consumed, "1");
      setIsAllowed(true);
      return;
    }

    if (hasActiveAccess) {
      setIsAllowed(true);
      return;
    }

    if (hasConsumedAccess) {
      router.replace("/mock-tests");
      return;
    }

    router.replace(`/attempts/${attemptId}/result`);
  }, [attemptId, router, storageKeys]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      cleanupArmedRef.current = true;
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      if (typeof window === "undefined") {
        return;
      }

      if (!cleanupArmedRef.current) {
        return;
      }

      sessionStorage.removeItem(storageKeys.active);
    };
  }, [storageKeys]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
