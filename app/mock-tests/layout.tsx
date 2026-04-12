import { MockTestsNavigationLoaderProvider } from "./MockTestsNavigationLoader";

export default function MockTestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockTestsNavigationLoaderProvider>{children}</MockTestsNavigationLoaderProvider>
  );
}
