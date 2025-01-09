import { Lexend } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import * as motion from 'motion/react-client';

import './globals.css';

const globalFont = Lexend({ subsets: ['latin'] });

// prettier-ignore
export const metadata: Metadata = {
  title: 'Statki - Zagraj Teraz',
  description: 'Graj w statki online za darmo! Prosta obsługa, szybkie rozgrywki i rywalizacja z przyjaciółmi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={globalFont.className}>
        <motion.div
          animate={{
            transition: { ease: 'linear', duration: 8, repeat: Infinity },
            backgroundPosition: '0px 300px',
          }}
          className="fixed -z-[1] h-full w-full bg-orange-500 bg-[size:300px]"
          style={{ backgroundImage: `url('/images/background.webp')` }}
        />

        {children}
      </body>
    </html>
  );
}
