import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task management',
  description: 'Task management for Mohammed Husain',
  icons: {
    icon: [
      { url: '/pull-logic-mark.svg', type: 'image/svg+xml' },
      { url: '/pull-logic-mark.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/pull-logic-mark.png',
    apple: '/pull-logic-mark.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/pull-logic-mark.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/pull-logic-mark.png?v=2" type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href="/pull-logic-mark.png?v=2" />
        <link rel="apple-touch-icon" href="/pull-logic-mark.png?v=2" />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#090D16] text-white selection:bg-indigo-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
