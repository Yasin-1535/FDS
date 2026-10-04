import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Predict & Retain — Workforce Intelligence & Attrition Analytics',
  description:
    'Data-driven HR workforce intelligence and employee retention analytics platform evaluating attrition risk factors.',
  keywords: ['HR Analytics', 'Employee Attrition', 'Workforce Intelligence', 'Retention Risk', 'Data Science'],
  authors: [{ name: 'Predict & Retain Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
