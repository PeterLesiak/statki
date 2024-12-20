import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';

import './globals.css';

const globalFont = Lexend();

export const metadata: Metadata = {
    title: 'Statki',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl">
            <body className={globalFont.className}>{children}</body>
        </html>
    );
}
