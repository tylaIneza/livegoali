import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "LiveGoali Cookie Policy — how we use cookies and similar technologies on our platform.",
};

const cookieTypes = [
  {
    name: "Essential Cookies",
    desc: "These cookies are necessary for the Website to function properly. They enable core features such as user authentication, session management, and security. You cannot opt out of these cookies.",
    examples: ["Session tokens", "Authentication cookies", "Security cookies"],
    required: true,
  },
  {
    name: "Analytics Cookies",
    desc: "These cookies help us understand how visitors interact with our Website by collecting anonymous usage data. This information helps us improve our platform and content.",
    examples: ["Google Analytics", "Page view tracking", "Traffic source data"],
    required: false,
  },
  {
    name: "Advertising Cookies",
    desc: "These cookies are used to deliver relevant advertisements to you. They track your visits across websites to measure ad effectiveness and provide personalised advertising.",
    examples: ["Google AdSense", "DoubleClick cookies", "Ad performance tracking"],
    required: false,
  },
  {
    name: "Preference Cookies",
    desc: "These cookies remember your settings and preferences to provide a more personalised experience on your next visit.",
    examples: ["Language preferences", "Theme settings", "Saved filters"],
    required: false,
  },
];

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Cookie Policy</h1>
        <p className="text-gray-500 text-sm">Last Updated: June 23, 2026</p>
        <p className="text-gray-400 mt-4 leading-relaxed">
          This Cookie Policy explains how LiveGoali uses cookies and similar tracking technologies when you visit{" "}
          <Link href="/" className="text-[#00FF84] hover:underline">www.livegoali.com</Link>.
          By continuing to use our Website, you consent to the use of cookies as described in this policy.
        </p>
      </div>

      <div className="space-y-6">

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">What Are Cookies?</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, remember your preferences, and provide information to website owners. Cookies cannot execute programs or deliver viruses to your device.
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-5">Types of Cookies We Use</h2>
          <div className="space-y-5">
            {cookieTypes.map((type, i) => (
              <div key={type.name}>
                {i > 0 && <div className="w-full h-px bg-white/5 mb-5" />}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-white text-sm font-semibold">{type.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${type.required ? "bg-red-500/10 text-red-400" : "bg-white/5 text-gray-400"}`}>
                    {type.required ? "Required" : "Optional"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-2">{type.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {type.examples.map((ex) => (
                    <span key={ex} className="text-xs bg-white/5 text-gray-500 px-2 py-1 rounded-lg">{ex}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Third-Party Cookies</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Some cookies on our Website are placed by third-party services, including Google (Analytics and AdSense). These third parties may collect information about your online activities across different websites.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            We do not control third-party cookies. Please refer to the respective privacy policies of these providers for more information on how they use cookies.
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">How to Control Cookies</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            You can control and manage cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400 text-sm mb-3">
            <li>View cookies stored on your device</li>
            <li>Delete cookies individually or in bulk</li>
            <li>Block cookies from specific or all websites</li>
            <li>Set preferences for first-party and third-party cookies</li>
          </ul>
          <p className="text-gray-500 text-xs">
            Note: disabling certain cookies may affect the functionality of our Website, including login features and personalised content.
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Changes to This Policy</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated effective date. Continued use of our Website after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </div>

        <div className="rounded-2xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-6">
          <h2 className="text-white font-bold mb-3">Contact Us</h2>
          <p className="text-gray-400 text-sm mb-3">If you have questions about our use of cookies, please contact us:</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-400">Email: <a href="mailto:support@livegoali.com" className="text-[#00FF84] hover:underline">support@livegoali.com</a></p>
            <p className="text-gray-400">Contact: <Link href="/contact" className="text-[#00FF84] hover:underline">www.livegoali.com/contact</Link></p>
          </div>
        </div>

      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm">
          Also see our <Link href="/privacy" className="text-[#00FF84] hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-[#00FF84] hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
