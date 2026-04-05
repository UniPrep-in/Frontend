"use client";

import { useEffect } from "react";

type ViewerFrameProps = {
  url: string;
};

export default function ViewerFrame({ url }: ViewerFrameProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key)) ||
        (event.ctrlKey && event.key === "u")
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const devtools = { open: false };
    const threshold = 160;
    const checkDevTools = window.setInterval(() => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          document.body.innerHTML =
            "<h1 style='color:white;text-align:center;margin-top:20%'>Access Restricted</h1>";
        }
      } else {
        devtools.open = false;
      }
    }, 1000);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(checkDevTools);
    };
  }, []);

  return (
    <main
      className="h-screen w-full bg-black"
      onContextMenu={(event) => event.preventDefault()}
    >
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
        className="h-full w-full"
      />
    </main>
  );
}
