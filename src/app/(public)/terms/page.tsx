import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LiveGoali Terms of Service — the rules and guidelines for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Terms of Service</h1>
        <p className="text-white/70 text-sm">Last Updated: June 23, 2026</p>
        <p className="text-white/75 mt-4 leading-relaxed">
          Welcome to LiveGoali (&ldquo;LiveGoali&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing or using{" "}
          <Link href="/" className="text-primary hover:underline">www.livegoali.com</Link>{" "}
          (the &ldquo;Website&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use our Website.
        </p>
      </div>

      <div className="space-y-6">
        {[
          {
            title: "1. About LiveGoali",
            content: (
              <p>LiveGoali is a football information platform that provides live scores, match schedules, statistics, standings, news, commentary, and related football content. Certain match streams, media, or external content may be provided by third-party services.</p>
            ),
          },
          {
            title: "2. Eligibility",
            content: (
              <p>You must be at least 13 years old to use our Website. By using LiveGoali, you represent that you meet this requirement and have the legal capacity to agree to these Terms.</p>
            ),
          },
          {
            title: "3. User Accounts",
            content: (
              <>
                <p className="mb-3">Some features such as favorites and community participation may require registration.</p>
                <p className="mb-2">You agree to:</p>
                <ul className="list-disc list-inside space-y-1 text-white/75 text-sm">
                  <li>Provide accurate information.</li>
                  <li>Maintain the security of your account.</li>
                  <li>Keep your password confidential.</li>
                  <li>Notify us immediately of unauthorized access.</li>
                </ul>
                <p className="mt-3">You are responsible for all activities conducted through your account.</p>
              </>
            ),
          },
          {
            title: "4. Acceptable Use",
            content: (
              <>
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 text-white/75 text-sm mb-3">
                  <li>Violate any applicable laws or regulations.</li>
                  <li>Upload malicious software or harmful code.</li>
                  <li>Attempt unauthorized access to our systems.</li>
                  <li>Interfere with the operation of the Website.</li>
                  <li>Post unlawful, abusive, defamatory, or offensive content.</li>
                  <li>Infringe upon copyrights, trademarks, or other intellectual property rights.</li>
                </ul>
                <p>We reserve the right to suspend or terminate accounts that violate these rules.</p>
              </>
            ),
          },
          {
            title: "5. Third-Party Content and Services",
            content: (
              <>
                <p className="mb-3">LiveGoali may contain links, embeds, advertisements, widgets, or content provided by third parties.</p>
                <p>We do not control or guarantee the accuracy, legality, availability, or quality of third-party content. Your interactions with third-party websites and services are solely between you and those providers.</p>
              </>
            ),
          },
          {
            title: "6. Live Match Information",
            content: (
              <>
                <p className="mb-3">Live scores, statistics, schedules, lineups, standings, and match-related information are provided for informational purposes only.</p>
                <p>While we strive for accuracy, we do not guarantee that all information will always be complete, current, or error-free.</p>
              </>
            ),
          },
          {
            title: "7. Copyright Policy",
            content: (
              <>
                <p className="mb-3">LiveGoali respects intellectual property rights.</p>
                <p className="mb-2">If you believe that any content available through our Website infringes your copyright, please contact us with:</p>
                <ul className="list-disc list-inside space-y-1 text-white/75 text-sm mb-3">
                  <li>Your contact information.</li>
                  <li>Identification of the copyrighted work.</li>
                  <li>Identification of the allegedly infringing material.</li>
                  <li>A statement that you believe the use is unauthorized.</li>
                </ul>
                <p>Upon receiving a valid notice, we may investigate and remove content where appropriate.</p>
              </>
            ),
          },
          {
            title: "8. User-Generated Content",
            content: (
              <>
                <p className="mb-3">Users may submit opinions and other content.</p>
                <p className="mb-3">By submitting content, you grant LiveGoali a non-exclusive, worldwide, royalty-free license to display, reproduce, distribute, and publish such content on the Website.</p>
                <p>You remain responsible for any content you submit.</p>
              </>
            ),
          },
          {
            title: "9. Intellectual Property",
            content: (
              <>
                <p className="mb-3">All trademarks, logos, branding, designs, text, graphics, software, and content on LiveGoali are owned by LiveGoali or its licensors and are protected by applicable intellectual property laws.</p>
                <p>You may not copy, reproduce, distribute, modify, or exploit our content without written permission.</p>
              </>
            ),
          },
          {
            title: "10. Advertising",
            content: (
              <>
                <p className="mb-3">The Website may display advertisements and sponsored content.</p>
                <p>We are not responsible for the products, services, or claims made by advertisers.</p>
              </>
            ),
          },
          {
            title: "11. Disclaimer of Warranties",
            content: (
              <>
                <p className="mb-3">The Website is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis.</p>
                <p className="mb-2">We make no warranties regarding:</p>
                <ul className="list-disc list-inside space-y-1 text-white/75 text-sm mb-3">
                  <li>Availability of the Website.</li>
                  <li>Accuracy of information.</li>
                  <li>Uninterrupted operation.</li>
                  <li>Fitness for a particular purpose.</li>
                </ul>
                <p>Your use of the Website is at your own risk.</p>
              </>
            ),
          },
          {
            title: "12. Limitation of Liability",
            content: (
              <p>To the fullest extent permitted by law, LiveGoali and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Website.</p>
            ),
          },
          {
            title: "13. Indemnification",
            content: (
              <>
                <p className="mb-2">You agree to indemnify and hold harmless LiveGoali, its owners, affiliates, employees, and partners from any claims, damages, liabilities, or expenses arising from:</p>
                <ul className="list-disc list-inside space-y-1 text-white/75 text-sm">
                  <li>Your use of the Website.</li>
                  <li>Your violation of these Terms.</li>
                  <li>Your violation of any third-party rights.</li>
                </ul>
              </>
            ),
          },
          {
            title: "14. Termination",
            content: (
              <p>We reserve the right to suspend or terminate access to the Website at any time, with or without notice, for conduct that we believe violates these Terms or applicable law.</p>
            ),
          },
          {
            title: "15. Changes to These Terms",
            content: (
              <>
                <p className="mb-3">We may update these Terms periodically.</p>
                <p>Continued use of the Website after changes become effective constitutes acceptance of the revised Terms.</p>
              </>
            ),
          },
          {
            title: "16. Governing Law",
            content: (
              <p>These Terms shall be governed by and interpreted in accordance with the laws applicable in the jurisdiction where LiveGoali operates, without regard to conflict-of-law principles.</p>
            ),
          },
          {
            title: "17. Contact Information",
            content: (
              <div className="space-y-1">
                <p className="font-semibold text-white">LiveGoali</p>
                <p>Website: <Link href="/" className="text-primary hover:underline">www.livegoali.com</Link></p>
                <p>Email: <a href="mailto:hello@livegoali.com" className="text-primary hover:underline">hello@livegoali.com</a></p>
                <p>Contact Page: <Link href="/contact" className="text-primary hover:underline">www.livegoali.com/contact</Link></p>
              </div>
            ),
          },
          {
            title: "18. Acceptance of Terms",
            content: (
              <p>By accessing or using LiveGoali, you acknowledge that you have read, understood, and agreed to these Terms of Service.</p>
            ),
          },
        ].map((s) => (
          <div key={s.title} className="rounded-2xl border border-white/8 bg-card p-6">
            <h2 className="text-white font-bold mb-3">{s.title}</h2>
            <div className="text-white/75 text-sm leading-relaxed">{s.content}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-white/70 text-sm">
          Questions? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
