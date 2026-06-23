import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LiveGoali Terms of Service — the rules and guidelines for using our platform.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using LiveGoali, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our platform. We reserve the right to update these terms at any time, and your continued use of the platform constitutes acceptance of any changes.`,
  },
  {
    title: "2. Use of the Platform",
    content: `LiveGoali grants you a limited, non-exclusive, non-transferable licence to access and use the platform for personal, non-commercial purposes. You agree not to use the platform for any unlawful purpose, to interfere with or disrupt the platform's functionality, to attempt to gain unauthorised access to any part of the service, or to reproduce, distribute, or resell any content from the platform.`,
  },
  {
    title: "3. Account Registration",
    content: `To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when registering and keep this information up to date. Notify us immediately of any unauthorised use of your account.`,
  },
  {
    title: "4. Content and Streaming",
    content: `LiveGoali provides access to live football streams, statistics, predictions, and related content. We do not guarantee the availability, quality, or accuracy of any stream or content. Streams may be subject to regional restrictions. Any content you access through the platform is for personal viewing only and may not be recorded, redistributed, or rebroadcast.`,
  },
  {
    title: "5. User-Generated Content",
    content: `By posting comments, chat messages, or other content on LiveGoali, you grant us a non-exclusive, royalty-free licence to use, display, and moderate that content. You agree not to post content that is abusive, harassing, defamatory, obscene, or in violation of any third-party rights. We reserve the right to remove any content and suspend or terminate accounts that violate these guidelines.`,
  },
  {
    title: "6. Intellectual Property",
    content: `All content, trademarks, logos, and intellectual property on LiveGoali are owned by LiveGoali or its licensors. Nothing in these terms grants you any right to use our intellectual property without our prior written consent. Unauthorised use of our content or trademarks is strictly prohibited.`,
  },
  {
    title: "7. Disclaimer of Warranties",
    content: `LiveGoali is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components. Your use of the platform is at your own risk.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `To the fullest extent permitted by law, LiveGoali shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the platform, even if we have been advised of the possibility of such damages.`,
  },
  {
    title: "9. Termination",
    content: `We reserve the right to suspend or terminate your account and access to LiveGoali at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties. You may also delete your account at any time by contacting us.`,
  },
  {
    title: "10. Governing Law",
    content: `These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms or your use of the platform shall be resolved through good-faith negotiation. If unresolved, disputes shall be subject to the exclusive jurisdiction of the competent courts.`,
  },
  {
    title: "11. Contact",
    content: `If you have any questions about these Terms of Service, please contact us at support@livegoali.com or visit our Contact page.`,
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Effective date: January 1, 2025 &nbsp;·&nbsp; Last updated: June 2025</p>
        <p className="text-gray-400 mt-4 leading-relaxed">
          Please read these Terms of Service carefully before using LiveGoali. These terms govern your access
          to and use of our platform, services, and content.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border border-white/8 bg-[#121821] p-6">
            <h2 className="text-white font-bold mb-3">{s.title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm">
          Questions? <a href="/contact" className="text-[#00FF84] hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
