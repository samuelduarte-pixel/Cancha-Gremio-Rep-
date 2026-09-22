import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';

// =============================================
// App Layout (with sidebar)
// =============================================

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Sidebar />
      <div className="app-main-content" style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Topbar title={title} />
        <main className="app-main" style={{
          flex: 1,
          padding: '20px 28px',
          overflowY: 'auto',
          width: '100%',
        }}>
          <Breadcrumbs />
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}