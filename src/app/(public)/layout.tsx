export const dynamic = "force-dynamic";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ViewTracker } from "@/components/ViewTracker";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ViewTracker type="site" />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
