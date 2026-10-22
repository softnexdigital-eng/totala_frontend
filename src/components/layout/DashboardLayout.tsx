'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import AgentSidebar from '@/components/layout/AgentSidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';

interface Agent {
  id: string;
  name: string;
  email?: string;
  phone: string;
  permissions?: Record<string, boolean>;
}

const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/patients': 'patients',
  '/doctors': 'doctors',
  '/agents': 'agents',
  '/permissions': 'permissions',
  '/packages': 'packages',
  '/service-types': 'serviceTypes',
  '/appointments': 'appointments',
  '/doctor-booking': 'doctorBooking',
  '/tests': 'tests',
  '/hospitals': 'hospitals',
  '/reports': 'reports',
  '/tasks': 'tasks',
  '/payments': 'payments',
  '/audit': 'audit',
  '/security': 'security',
  '/bookings': 'bookings',
  '/agents/ratings': 'agentRatings',
  '/transport': 'transport',
};

function DashboardShell({
  children,
  showAdminSidebar,
  showAgentSidebar,
  agentPermissions,
  isAdmin,
}: {
  children: React.ReactNode;
  showAdminSidebar: boolean;
  showAgentSidebar: boolean;
  agentPermissions: Record<string, boolean>;
  isAdmin: boolean;
}) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const contentOffset = showAdminSidebar ? (collapsed ? 'lg:ml-20' : 'lg:ml-72') : '';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showAdminSidebar && (
        <Sidebar
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          permissions={agentPermissions}
          isAdmin={isAdmin}
        />
      )}
      {showAgentSidebar && <AgentSidebar permissions={agentPermissions} />}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${contentOffset}`}
      >
        {showAdminSidebar && <Header />}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
        {showAdminSidebar && <Footer />}
      </div>
    </div>
  );
}


export default function DashboardLayoutClient({
  children,
  hasAdminToken,
}: {
  children: React.ReactNode;
  hasAdminToken: boolean;
}) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const agentCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('agent='));

    if (!agentCookie) {
      setLoading(false);
      return;
    }

    try {
      const agentData: Agent = JSON.parse(decodeURIComponent(agentCookie.split('=')[1]));
      setAgent(agentData);
    } catch {
      setAgent(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetch('/api/agents/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success && data.data) {
          const fresh = data.data as Agent;
          setAgent(fresh);
          document.cookie = `agent=${encodeURIComponent(JSON.stringify(fresh))}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const permissions = agent?.permissions || {};
    const isAdmin = hasAdminToken || pathname.startsWith('/permissions');
    const requiredPermission = ROUTE_PERMISSION_MAP[pathname];

    if (!isAdmin && requiredPermission && permissions[requiredPermission] !== true) {
      router.replace('/agent-dashboard');
    }
  }, [loading, pathname, hasAdminToken, agent, router]);

  const isAgentRoute = pathname.startsWith('/agent-dashboard');
  const isAdminOnlyRoute = pathname.startsWith('/permissions');

  const showAgentSidebar = Boolean(isAgentRoute);
  const showAdminSidebar = !isAgentRoute;
  const isAdmin = (hasAdminToken && !agent) || pathname.startsWith('/permissions');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <DashboardShell
        showAdminSidebar={showAdminSidebar}
        showAgentSidebar={showAgentSidebar}
        agentPermissions={agent?.permissions || {}}
        isAdmin={isAdmin}
      >
        {children}
      </DashboardShell>
    </SidebarProvider>
  );
}
