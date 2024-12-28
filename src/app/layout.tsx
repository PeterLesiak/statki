import { Lexend } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const globalFont = Lexend();

export const metadata: Metadata = {
  title: 'Statki - Zagraj Teraz',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={globalFont.className}>
        <div
          className="h-screen bg-orange-500 bg-[size:300px]"
          style={{ backgroundImage: `url('/images/background.png')` }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
