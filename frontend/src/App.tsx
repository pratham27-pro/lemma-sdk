import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Ingest } from './pages/Ingest';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';
import { Themes } from './pages/Themes';
import { AllSignals } from './pages/AllSignals';
import { Docs } from './pages/Docs';
import { Reports } from './pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing page — no sidebar */}
          <Route path="/" element={<Landing />} />

          {/* App — with sidebar layout */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/new" element={<Ingest />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="themes" element={<Themes />} />
            <Route path="signals" element={<AllSignals />} />
            <Route path="docs" element={<Docs />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
