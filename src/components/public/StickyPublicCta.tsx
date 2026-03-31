import { BRAND } from "@/lib/constants/brand";

export function StickyPublicCta() {
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/90 p-3 shadow-2xl backdrop-blur">
        <a
          href={BRAND.contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
        >
          WhatsApp
        </a>
        <a
          href={BRAND.contact.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-brand-gray-mid px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Instagram
        </a>
      </div>
    </div>
  );
}
