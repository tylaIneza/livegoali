import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ViewTracker } from "@/components/ViewTracker";
import { AdBanner } from "@/components/AdBanner";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ViewTracker type="site" />
      <Navbar />
      {/* Header ad */}
      <div className="max-w-[1400px] mx-auto w-full px-4 pt-2">
        <AdBanner placement="HEADER" className="h-16 sm:h-20" />
      </div>
      <main className="flex-1">{children}</main>
      {/* Footer ad */}
      <div className="max-w-[1400px] mx-auto w-full px-4 pb-2">
        <AdBanner placement="FOOTER" className="h-16 sm:h-20" />
      </div>
      <Footer />
    </div>
  );
}
