import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '../components/layout/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRDISK — CRM, Chat Live & Smart Dialer SaaS',
  description: 'CRM Kanban, WhatsApp Live Chat, Discador Automático WebRTC e Agentes de IA Autônomos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-background text-slate-100 antialiased min-h-screen selection:bg-primary/25 selection:text-primary`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
