import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about LiveGoali — your destination for football coverage, live scores, match updates, statistics, predictions, and news from around the world.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">About LiveGoali</h1>
        <p className="text-white/75 mt-4 leading-relaxed">
          Welcome to <span className="text-white font-semibold">LiveGoali</span>, your destination for football coverage, live scores, match updates, statistics, predictions, and football news from around the world.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">Who We Are</h2>
          <div className="text-white/75 text-sm leading-relaxed space-y-3">
            <p>LiveGoali was created by football fans for football fans. Our mission is to provide a simple, fast, and reliable platform where supporters can follow their favorite teams, leagues, and competitions in real time.</p>
            <p>Whether you&apos;re tracking a live match, checking league standings, reviewing team statistics, or discussing football with other fans, LiveGoali aims to keep you connected to the game you love.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">What We Offer</h2>
          <p className="text-white/75 text-sm mb-3">At LiveGoali, we provide:</p>
          <ul className="list-disc list-inside space-y-1.5 text-white/75 text-sm mb-3">
            <li>Live football scores and match updates</li>
            <li>Match schedules and fixtures</li>
            <li>League tables and standings</li>
            <li>Team and player statistics</li>
            <li>Match predictions and analysis</li>
            <li>Football news and updates</li>
            <li>Fan discussions and comments</li>
            <li>Coverage of major leagues and international competitions</li>
          </ul>
          <p className="text-white/75 text-sm">Our goal is to make football information accessible and easy to follow for fans across the globe.</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">Our Mission</h2>
          <div className="text-white/75 text-sm leading-relaxed space-y-3">
            <p>Our mission is to deliver accurate, timely, and engaging football content that helps fans stay informed and enjoy every moment of the game.</p>
            <p>We continuously work to improve our platform by adding new features, enhancing performance, and creating a better experience for our community.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">Community First</h2>
          <div className="text-white/75 text-sm leading-relaxed space-y-3">
            <p>Football is more than a sport—it&apos;s a community. LiveGoali encourages respectful discussion and engagement among fans from different countries, clubs, and backgrounds.</p>
            <p>Users who create accounts can participate in comments, predictions, and other community features while helping build a positive football environment.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">Accuracy and Reliability</h2>
          <p className="text-white/75 text-sm leading-relaxed">We strive to provide accurate football information and updates. While we make every effort to keep our data current and reliable, some information may occasionally be delayed, incomplete, or subject to change.</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">Independence</h2>
          <p className="text-white/75 text-sm leading-relaxed">LiveGoali operates as an independent football information platform. Any trademarks, team names, league names, or logos belong to their respective owners.</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <h2 className="text-white font-bold mb-3">Our Vision</h2>
          <div className="text-white/75 text-sm leading-relaxed space-y-3">
            <p>We aim to become one of the most trusted football platforms by providing fans with real-time information, insightful content, and an enjoyable user experience.</p>
            <p>As football continues to evolve, LiveGoali will continue growing to serve supporters around the world.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-white font-bold mb-3">Contact Us</h2>
          <p className="text-white/75 text-sm mb-4">We welcome feedback, suggestions, and questions from our users.</p>
          <div className="space-y-1.5 text-sm">
            <p className="text-white/75">Website: <Link href="/" className="text-primary hover:underline">www.livegoali.com</Link></p>
            <p className="text-white/75">Email: <a href="mailto:hello@livegoali.com" className="text-primary hover:underline">hello@livegoali.com</a></p>
            <p className="text-white/75">Contact Page: <Link href="/contact" className="text-primary hover:underline">www.livegoali.com/contact</Link></p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-white/70 text-sm">Thank you for being part of the LiveGoali community.</p>
        <p className="text-white font-bold mt-2">LiveGoali — Football Lives Here.</p>
      </div>
    </div>
  );
}
