import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';

export function Layout() {
  return (
    <div className="flex w-full min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}
