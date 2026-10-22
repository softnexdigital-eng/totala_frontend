'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  HiChartBar,
  HiUserGroup,
  HiUser,
  HiUsers,
  HiLockClosed,
  HiCube,
  HiCalendar,
  HiDocumentText,
  HiLightBulb,
  HiTable,
  HiClipboardList,
  HiCurrencyDollar,
  HiDocumentReport,
  HiStar,
  HiX,
  HiMenu,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiTruck,
  HiOfficeBuilding,
  HiShieldCheck,
  HiBeaker,
} from 'react-icons/hi';

type MenuItem = { href: string; label: string; icon: typeof HiChartBar; key: string };

const ALL_MENU_ITEMS: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HiChartBar, key: 'dashboard' },
  { href: '/patients', label: 'Patients', icon: HiUserGroup, key: 'patients' },
  { href: '/doctors', label: 'Doctors', icon: HiUser, key: 'doctors' },
  { href: '/agents', label: 'Agents', icon: HiUsers, key: 'agents' },
  { href: '/permissions', label: 'Permissions', icon: HiLockClosed, key: 'permissions' },
  { href: '/packages', label: 'Manage Packages', icon: HiCube, key: 'packages' },
  { href: '/service-types', label: 'Service Types', icon: HiLightBulb, key: 'serviceTypes' },
  { href: '/tests', label: 'Tests', icon: HiLightBulb, key: 'tests' },
  { href: '/hospitals', label: 'Hospitals', icon: HiOfficeBuilding, key: 'hospitals' },
  { href: '/appointments', label: 'Manage Appointments', icon: HiCalendar, key: 'appointments' },
  { href: '/doctor-booking', label: 'Doctor Booking', icon: HiDocumentText, key: 'doctorBooking' },
  { href: '/tasks', label: 'Tasks', icon: HiClipboardList, key: 'tasks' },
  { href: '/payments', label: 'Payments', icon: HiCurrencyDollar, key: 'payments' },
  { href: '/bookings', label: 'Online Bookings', icon: HiCalendar, key: 'bookings' },
  { href: '/agent-booking-requests', label: 'Agent Booking Requests', icon: HiUser, key: 'agentBookingRequests' },
  { href: '/agents/ratings', label: 'Agent Ratings', icon: HiStar, key: 'agentRatings' },
  { href: '/audit', label: 'Audit Report', icon: HiDocumentReport, key: 'audit' },
  { href: '/security', label: 'Security', icon: HiShieldCheck, key: 'security' },
  { href: '/reports', label: 'Reports', icon: HiTable, key: 'reports' },
  { href: '/transport', label: 'Transport Bookings', icon: HiTruck, key: 'transport' },
  { href: '/medicine-orders', label: 'Medicine Orders', icon: HiBeaker, key: 'medicineOrders' },
];

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Overview',
    items: ALL_MENU_ITEMS.filter((item) => item.key === 'dashboard'),
  },
  {
    title: 'Management',
    items: ALL_MENU_ITEMS.filter((item) =>
      ['patients', 'doctors', 'agents', 'permissions', 'packages', 'tests', 'hospitals', 'serviceTypes'].includes(item.key)
    ),
  },
  {
    title: 'Bookings',
    items: ALL_MENU_ITEMS.filter((item) =>
      ['appointments', 'doctorBooking', 'tasks', 'payments', 'bookings', 'agentBookingRequests', 'agentRatings', 'transport', 'medicineOrders'].includes(item.key)
    ),
  },
  {
    title: 'Insights',
    items: ALL_MENU_ITEMS.filter((item) =>
      ['audit', 'reports', 'security'].includes(item.key)
    ),
  },
];

function SidebarContent({
  collapsed,
  onNavigate,
  onClose,
  permissions,
  isAdmin,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  permissions: Record<string, boolean>;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const normalizedPermissions = typeof permissions === 'object' && permissions !== null ? permissions : {};
  const allowedItems = isAdmin ? ALL_MENU_ITEMS : ALL_MENU_ITEMS.filter((item) => normalizedPermissions[item.key] === true);

  /* ------------------------------------------------- new-booking signal --- */
  // Poll for pending agent-booking requests. When the count rises we blink the
  // sidebar menu item and play a short beep so the super admin notices a new
  // landing-page booking without refreshing the page.
  const [pendingCount, setPendingCount] = useState(0);
  const [hasNewBooking, setHasNewBooking] = useState(false);
  const [lastCount, setLastCount] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNewBookingBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio may be blocked by browser policy — silent fail is fine.
    }
  };

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval>;

    const fetchPendingCount = async () => {
      try {
        const res = await fetch('/api/bookings', {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const count = json.data.filter((b: { status?: string }) => b.status === 'PENDING').length;
          if (mounted) {
            setPendingCount(count);
            if (lastCount !== null && count > lastCount) {
              setHasNewBooking(true);
              playNewBookingBeep();
            }
            setLastCount(count);
          }
        }
      } catch {
        // Silent — the sidebar should never break the layout if the API is down.
      }
    };

    fetchPendingCount();
    timer = setInterval(fetchPendingCount, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [lastCount]);

  const handleMenuClick = (key: string) => {
    if (key === 'agentBookingRequests') {
      setHasNewBooking(false);
    }
    onNavigate?.();
  };

  return (
    <>
      {/* Brand */}
      <div
        className={`flex h-20 shrink-0 items-center border-b border-white/10 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3"
          aria-label="DakDin dashboard"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
            <HiChartBar className="h-6 w-6 text-white" />
          </span>
          <span
            className={`whitespace-nowrap bg-gradient-to-r from-white to-blue-200 bg-clip-text text-xl font-bold tracking-tight text-transparent ${
              collapsed ? 'hidden' : 'block'
            }`}
          >
            DakDin
          </span>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <HiX className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Scrollable navigation */}
      <nav className="sidebar-scroll flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {menuSections.map((section, index) => {
          const sectionItems = section.items.filter((item) => allowedItems.some((allowed) => allowed.key === item.key));
          if (sectionItems.length === 0) return null;

          return (
            <div key={section.title}>
              {collapsed ? (
                index > 0 && <div className="mx-2 mb-2 border-t border-white/10" />
              ) : (
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isBookingRequests = item.key === 'agentBookingRequests';
                  const hasSignal = isBookingRequests && (hasNewBooking || pendingCount > 0);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleMenuClick(item.key)}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group relative flex items-center rounded-xl text-sm transition-all duration-200 ${
                        collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                      )}
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {hasSignal && (
                          <span
                            className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center"
                            style={{ animation: 'bookingPulse 1.2s infinite' }}
                          >
                            <span
                              className={`flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-black ${
                                hasNewBooking ? 'ring-offset-2 ring-offset-red-900 animate-ping' : ''
                              }`}
                            />
                            <span className="sr-only">{pendingCount} new booking request{pendingCount !== 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </span>
                      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                      {hasSignal && !collapsed && (
                        <span
                          className="ml-auto inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white"
                          style={{ animation: 'bookingPulse 1.2s infinite' }}
                        >
                          {pendingCount}
                        </span>
                      )}
                      {!collapsed && isActive && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <style jsx>{`
        @keyframes bookingPulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </>
  );
}

function SidebarFooter({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
}) {
  return (
    <div className="shrink-0 space-y-3 border-t border-white/10 p-3">
      {!collapsed && (
        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4">
          <p className="text-xs font-semibold text-white">Need help?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
            Contact support for assistance.
          </p>
        </div>
      )}

      {onToggleCollapsed && (
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={`flex w-full items-center rounded-lg border border-white/10 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? 'justify-center py-3' : 'gap-2 px-3 py-2.5'
          }`}
        >
          {collapsed ? (
            <HiChevronDoubleRight className="h-5 w-5" />
          ) : (
            <>
              <HiChevronDoubleLeft className="h-5 w-5" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function Sidebar({
  collapsed,
  toggleCollapsed,
  mobileOpen,
  setMobileOpen,
  permissions,
  isAdmin,
}: {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  permissions: Record<string, boolean>;
  isAdmin: boolean;
}) {
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed left-4 top-4 z-50 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-3 text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 lg:hidden"
      >
        <HiMenu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Desktop sidebar (collapsible) */}
      <aside
        className={`fixed hidden h-screen flex-col border-r border-white/5 bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white shadow-2xl transition-[width] duration-300 ease-in-out lg:flex ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <SidebarContent collapsed={collapsed} permissions={permissions} isAdmin={isAdmin} />
        <SidebarFooter collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {/* Mobile sidebar (drawer, always expanded) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          collapsed={false}
          onNavigate={() => setMobileOpen(false)}
          onClose={() => setMobileOpen(false)}
          permissions={permissions}
          isAdmin={isAdmin}
        />
      </aside>
    </>
  );
}
