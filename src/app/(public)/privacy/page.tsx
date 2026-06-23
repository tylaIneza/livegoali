import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LiveGoali Privacy Policy — how we collect, use, and protect your personal data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us when you create an account, such as your name, email address, and password. We also collect information automatically when you use our services, including your IP address, browser type, device information, and usage data such as pages visited, matches watched, and interactions on the platform.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to provide, maintain, and improve our services; process your account registration and authenticate your identity; send you service-related notifications and updates; analyse usage patterns to improve the platform; and comply with legal obligations. We do not sell your personal data to third parties.`,
  },
  {
    title: "3. Cookies",
    content: `We use cookies and similar tracking technologies to enhance your experience on LiveGoali. Cookies help us remember your preferences, keep you logged in, and understand how you use our platform. You can control cookies through your browser settings, though disabling them may affect some features.`,
  },
  {
    title: "4. Data Sharing",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your data with trusted service providers who assist us in operating our website and platform (such as hosting, analytics, and authentication providers), provided they agree to keep this information confidential. We may also disclose information when required by law.`,
  },
  {
    title: "5. Data Security",
    content: `We implement industry-standard security measures to protect your personal information from unauthorised access, disclosure, alteration, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "6. Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide our services. You may request deletion of your account and associated data at any time by contacting us at support@livegoali.com.`,
  },
  {
    title: "7. Your Rights",
    content: `You have the right to access, correct, or delete your personal data. You may also object to or restrict certain processing of your data. To exercise these rights, please contact us at support@livegoali.com. We will respond to your request within 30 days.`,
  },
  {
    title: "8. Children's Privacy",
    content: `LiveGoali is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.`,
  },
  {
    title: "9. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated effective date. Your continued use of LiveGoali after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    title: "10. Contact Us",
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us at support@livegoali.com or visit our Contact page.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Effective date: January 1, 2025 &nbsp;·&nbsp; Last updated: June 2025</p>
        <p className="text-gray-400 mt-4 leading-relaxed">
          At LiveGoali, we are committed to protecting your privacy. This Privacy Policy explains how we collect,
          use, and safeguard your information when you visit and use our platform.
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
