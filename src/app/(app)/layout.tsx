import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Topbar />
      <main
        className="bg-paper"
        style={{ minHeight: "calc(100vh - var(--topbar-height))" }}
      >
        {children}
      </main>
    </>
  );
}
