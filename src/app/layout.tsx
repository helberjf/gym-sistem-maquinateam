import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/constants/brand';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Academia de Luta`,
    template: `%s | ${BRAND.name}`,
  },
  description: `${BRAND.slogan} Muay Thai, Kickboxing, Funcional e Boxe Team em Juiz de Fora - MG.`,
  keywords: [
    'academia de luta',
    'muay thai',
    'kickboxing',
    'boxe',
    'juiz de fora',
    'maquina team',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: BRAND.name,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
