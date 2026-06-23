import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "DMCA Policy",
  description: "LiveGoali DMCA Policy — how to report copyright infringement on our platform.",
};

export default function DmcaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-4xl font-black text-white">DMCA Policy</h1>
        </div>
        <p className="text-white/70 text-sm">Last Updated: June 23, 2026</p>
        <p className="text-white/75 mt-4 leading-relaxed">
          LiveGoali respects the intellectual property rights of others and expects users of our platform to do the same.
          In accordance with the Digital Millennium Copyright Act (DMCA), we respond to valid notices of copyright infringement.
        </p>
      </div>

      <div className="space-y-6">

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Reporting Copyright Infringement</h2>
          <p className="text-white/75 text-sm leading-relaxed mb-3">
            If you believe that content available on LiveGoali infringes your copyright, you may submit a DMCA takedown notice to our designated agent. To be valid, your notice must include the following:
          </p>
          <ol className="space-y-2.5 text-white/75 text-sm">
            {[
              "Your full legal name, address, telephone number, and email address.",
              "A description of the copyrighted work you claim has been infringed.",
              "A description of where the allegedly infringing material is located on our Website (include the specific URL or page).",
              "A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.",
              "A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.",
              "Your physical or electronic signature.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/5 text-white/70 text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-6">
          <h2 className="text-white font-bold mb-3">Submit a DMCA Notice</h2>
          <p className="text-white/75 text-sm mb-4">Send your completed DMCA notice to our legal team:</p>
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold text-white">LiveGoali — Legal Department</p>
            <p className="text-white/75">Email: <a href="mailto:legal@livegoali.com" className="text-[#00FF84] hover:underline">legal@livegoali.com</a></p>
            <p className="text-white/75">Website: <Link href="/" className="text-[#00FF84] hover:underline">www.livegoali.com</Link></p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Counter-Notice</h2>
          <p className="text-white/75 text-sm leading-relaxed mb-3">
            If you believe your content was removed or disabled as a result of a mistake or misidentification, you may submit a counter-notice. Your counter-notice must include:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-white/75 text-sm mb-3">
            <li>Your full name, address, telephone number, and email address.</li>
            <li>Identification of the material that was removed and its original location.</li>
            <li>A statement under penalty of perjury that you have a good faith belief the content was removed by mistake.</li>
            <li>A statement that you consent to the jurisdiction of the relevant courts.</li>
            <li>Your physical or electronic signature.</li>
          </ul>
          <p className="text-white/75 text-sm">Send counter-notices to: <a href="mailto:legal@livegoali.com" className="text-[#00FF84] hover:underline">legal@livegoali.com</a></p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Repeat Infringers</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            LiveGoali reserves the right to terminate the accounts of users who are found to be repeat infringers of copyright or other intellectual property rights.
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#121821] p-6">
          <h2 className="text-white font-bold mb-3">Disclaimer</h2>
          <p className="text-white/75 text-sm leading-relaxed">
            Submitting a false or misleading DMCA notice may result in legal liability. If you are unsure whether content infringes your copyright, we recommend consulting a legal professional before submitting a notice.
          </p>
        </div>

      </div>

      <div className="mt-10 text-center">
        <p className="text-white/70 text-sm">
          Questions? <Link href="/contact" className="text-[#00FF84] hover:underline">Contact us</Link> · <Link href="/terms" className="text-[#00FF84] hover:underline">Terms of Service</Link> · <Link href="/privacy" className="text-[#00FF84] hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
