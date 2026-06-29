import type { ReactNode } from 'react';
import { Sidebar } from '@/components/concept/sidebar';
import { ToastProvider } from '@/components/concept/toast';
import './concept.css';

export const metadata = {
  title: 'ClickBook · Concept',
};

export default function ConceptLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cb-scope prem-concept">
      <ToastProvider>
        <div className="app">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </ToastProvider>
    </div>
  );
}
