import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LiveGoali Privacy Policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last Updated: June 23, 2026</p>
        <p className="text-gray-400 mt-4 leading-relaxed">
          Welcome to LiveGoali (&ldquo;LiveGoali&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit or use{" "}
          <Link href="/" className="text-[#00FF84] hover:underline">www.livegoali.com</Link>{" "}
          (the &ldquo;Website&rdquo;).
        </p>
        <p className="text-gray-400 mt-3 leading-relaxed">
          By using our Website, you agree to the practices described in this Privacy Policy.
        </p>
      </div>

      <div className="space-y-6">

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">1. Information We Collect</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-4">
            <div>
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-2">Information You Provide</p>
              <p className="mb-2">We may collect information that you voluntarily provide, including:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Name</li>
                <li>Email address</li>
                <li>Username</li>
                <li>Password (stored securely and encrypted)</li>
                <li>Comments and predictions</li>
                <li>Messages submitted through our contact forms</li>
              </ul>
            </div>
            <div>
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-2">Information Collected Automatically</p>
              <p className="mb-2">When you visit LiveGoali, we may automatically collect:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Operating system</li>
                <li>Referring website</li>
                <li>Pages visited</li>
                <li>Date and time of visits</li>
                <li>Usage statistics</li>
              </ul>
            </div>
            <div>
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-2">Cookies and Similar Technologies</p>
              <p className="mb-2">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Improve user experience</li>
                <li>Remember preferences</li>
                <li>Analyze traffic and usage</li>
                <li>Personalize content</li>
                <li>Support advertising services</li>
              </ul>
              <p>You may disable cookies through your browser settings, although some features of the Website may not function properly.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-400 text-sm mb-2">We may use your information to:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
            <li>Provide and maintain our services</li>
            <li>Create and manage user accounts</li>
            <li>Enable commenting and community features</li>
            <li>Respond to inquiries and support requests</li>
            <li>Improve Website performance and functionality</li>
            <li>Detect fraud and security issues</li>
            <li>Comply with legal obligations</li>
            <li>Display relevant advertising</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">3. Google AdSense and Advertising</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>LiveGoali may display advertisements provided by Google and other advertising partners.</p>
            <p>Advertising partners may use cookies, web beacons, and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1 mb-1">
              <li>Serve personalized advertisements</li>
              <li>Measure advertising effectiveness</li>
              <li>Improve advertising experiences</li>
            </ul>
            <p>Google may use the DoubleClick cookie to serve ads based on users&apos; visits to this and other websites.</p>
            <p>Users may learn more about Google&apos;s advertising practices and opt-out options through Google&apos;s advertising settings.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">4. Analytics Services</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>We may use analytics services such as Google Analytics to understand how visitors use our Website.</p>
            <p>These services may collect information including:</p>
            <ul className="list-disc list-inside space-y-1 mb-1">
              <li>Pages viewed</li>
              <li>Time spent on pages</li>
              <li>Device information</li>
              <li>Geographic information</li>
              <li>Referral sources</li>
            </ul>
            <p>This information helps us improve our services and user experience.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">5. Sharing of Information</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>We do not sell personal information.</p>
            <p>We may share information with:</p>
            <ul className="list-disc list-inside space-y-1 mb-1">
              <li>Service providers who help operate our Website</li>
              <li>Analytics providers</li>
              <li>Advertising partners</li>
              <li>Legal authorities when required by law</li>
              <li>Business partners involved in Website operations</li>
            </ul>
            <p>Any sharing is limited to what is reasonably necessary for the stated purposes.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">6. Data Security</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>We implement reasonable technical and organizational measures to protect your information from unauthorized access, disclosure, alteration, or destruction.</p>
            <p>However, no internet transmission or storage system can be guaranteed to be completely secure.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">7. User Content</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>Comments, predictions, and other content submitted by users may be publicly visible.</p>
            <p>Please avoid posting sensitive personal information in public areas of the Website.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">8. Third-Party Websites</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>Our Website may contain links to third-party websites.</p>
            <p>We are not responsible for the privacy practices, content, or policies of external websites. We encourage users to review the privacy policies of any third-party sites they visit.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">9. Children&apos;s Privacy</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>LiveGoali is not directed toward children under the age of 13.</p>
            <p>We do not knowingly collect personal information from children under 13. If we become aware that such information has been collected, we will take reasonable steps to remove it.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">10. Your Rights</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>Depending on your location and applicable laws, you may have rights regarding your personal information, including:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access to your data</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of personal data</li>
              <li>Restriction of processing</li>
              <li>Data portability</li>
              <li>Objection to certain processing activities</li>
            </ul>
            <p>To exercise these rights, please contact us.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">11. Data Retention</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>We retain personal information only for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-1 mb-1">
              <li>Provide our services</li>
              <li>Meet legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce agreements</li>
            </ul>
            <p>When information is no longer needed, we will delete or anonymize it where practical.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">12. International Users</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>Your information may be processed and stored in countries other than your own.</p>
            <p>By using the Website, you consent to the transfer and processing of information as described in this Privacy Policy.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">13. Changes to This Privacy Policy</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>We may update this Privacy Policy periodically.</p>
            <p>Any changes will be posted on this page with an updated &ldquo;Last Updated&rdquo; date.</p>
            <p>Continued use of the Website after changes become effective constitutes acceptance of the revised Privacy Policy.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-6">
          <h2 className="text-white font-bold mb-3">14. Contact Us</h2>
          <p className="text-gray-400 text-sm mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold text-white">LiveGoali</p>
            <p className="text-gray-400">Website: <Link href="/" className="text-[#00FF84] hover:underline">www.livegoali.com</Link></p>
            <p className="text-gray-400">Email: <a href="mailto:support@livegoali.com" className="text-[#00FF84] hover:underline">support@livegoali.com</a></p>
            <p className="text-gray-400">Contact Page: <Link href="/contact" className="text-[#00FF84] hover:underline">www.livegoali.com/contact</Link></p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">15. Consent</h2>
          <p className="text-gray-400 text-sm leading-relaxed">By accessing or using LiveGoali, you acknowledge that you have read, understood, and agreed to this Privacy Policy.</p>
        </div>

      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm">
          Questions? <Link href="/contact" className="text-[#00FF84] hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
