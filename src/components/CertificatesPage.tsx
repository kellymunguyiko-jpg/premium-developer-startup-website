import { Award, ExternalLink, ShieldCheck } from "lucide-react";

export function CertificatesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <Award className="h-6 w-6 text-green-600" />
          Certificates
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Get verified developer certificates
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-green-50 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black">Certificates Dev</h2>
          <p className="mt-2 max-w-lg text-sm text-green-50">
            Earn professional certificates for your skills. Open the certificates
            portal to start or claim your certificate.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Programming language certificates</li>
            <li>• Shareable verified credentials</li>
            <li>• Built for developers on DevSpace Pro</li>
          </ul>
          <a
            href="https://certificatesdev.netlify.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-green-200 transition hover:bg-green-700 dark:shadow-green-900/30"
          >
            Get certificates
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-slate-400">
            Opens certificatesdev.netlify.app
          </p>
        </div>
      </div>
    </div>
  );
}
