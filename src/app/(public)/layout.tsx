import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { StickyPublicCta } from '@/components/public/StickyPublicCta';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-18">{children}</main>
      <Footer />
      <StickyPublicCta />
    </div>
  );
}
