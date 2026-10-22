'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { HiChevronDoubleLeft, HiChevronDoubleRight, HiOutlineLogout } from 'react-icons/hi';
import { useSidebar } from '@/components/layout/SidebarContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/doctors': 'Doctors',
  '/agents': 'Agents',
  '/appointments': 'Appointments',
  '/doctor-booking': 'Doctor Booking',
  '/packages': 'Manage Packages',
  '/tests': 'Tests',
  '/tasks': 'Tasks',
  '/payments': 'Payments',
  '/bookings': 'Online Bookings',
  '/agent-booking-requests': 'Agent Booking Requests',
  '/agents/ratings': 'Agent Ratings',
  '/audit': 'Audit Report',
  '/security': 'Security & Fraud Shield',
  '/reports': 'Reports',
};

export default function Header() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const title = pageTitles[pathname] || '';

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
      <div className="flex justify-between items-center px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="lg:hidden w-10" />
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Minimise sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Minimise sidebar'}
            aria-expanded={!collapsed}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 lg:flex"
          >
            {collapsed ? (
              <HiChevronDoubleRight className="h-5 w-5" />
            ) : (
              <HiChevronDoubleLeft className="h-5 w-5" />
            )}
          </button>
          {title && (
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back, Admin
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <HiOutlineLogout className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
