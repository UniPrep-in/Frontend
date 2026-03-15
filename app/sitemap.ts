import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const BASE_URL = "https://www.uniprep.in";

function getPages(dir: string, basePath = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let pages: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("[") || entry.name === "api" || entry.name === "components") continue;
      pages = pages.concat(getPages(fullPath, `${basePath}/${entry.name}`));
    }

    if (entry.isFile() && entry.name === "page.tsx") {
      pages.push(basePath === "" ? "/" : basePath);
    }
  }

  return pages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = path.join(process.cwd(), "app");

  const routes = getPages(appDir);

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
