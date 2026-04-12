"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Loader from "@/app/components/ui/loader";

const STORAGE_KEY = "uniprep-mock-tests-loader";

type MockTestsNavigationLoaderContextValue = {
  isVisible: boolean;
  showLoader: () => void;
  hideLoader: () => void;
};

const MockTestsNavigationLoaderContext =
  createContext<MockTestsNavigationLoaderContextValue | null>(null);

function MockTestsLoaderShell() {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center">
      <Loader
        title="Preparing Test"
        subtitle="Please wait while we get everything ready."
      />
    </div>
  );
}

function MockTestsNavigationLoaderOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <MockTestsLoaderShell />
    </div>
  );
}

export function MockTestsNavigationLoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      setIsVisible(window.sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setIsVisible(false);
    }
  }, []);

  const showLoader = useCallback(() => {
    setIsVisible(true);

    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures
    }
  }, []);

  const hideLoader = useCallback(() => {
    setIsVisible(false);

    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = useMemo(
    () => ({
      isVisible,
      showLoader,
      hideLoader,
    }),
    [hideLoader, isVisible, showLoader],
  );

  return (
    <MockTestsNavigationLoaderContext.Provider value={value}>
      {children}
      {isVisible ? <MockTestsNavigationLoaderOverlay /> : null}
    </MockTestsNavigationLoaderContext.Provider>
  );
}

export function useMockTestsNavigationLoader() {
  const context = useContext(MockTestsNavigationLoaderContext);

  if (!context) {
    throw new Error(
      "useMockTestsNavigationLoader must be used within MockTestsNavigationLoaderProvider",
    );
  }

  return context;
}

export function MockTestsRouteReady() {
  const { hideLoader } = useMockTestsNavigationLoader();

  useEffect(() => {
    hideLoader();
  }, [hideLoader]);

  return null;
}

export function MockTestsRouteFallbackLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <MockTestsLoaderShell />
    </div>
  );
}
