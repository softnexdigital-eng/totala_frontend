'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MENU_ITEMS = [
  { href: '/doctor-dashboard', label: 'Dashboard', icon: '📊' },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    document.cookie = 'doctorToken=; path=/; max-age=0';
    document.cookie = 'doctor=; path=/; max-age=0';
    router.push('/doctor-login');
  };

  return (
    <aside
      className={`h-screen sticky top-0 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between transition-all duration-300 z-50 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header & Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
              D
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent truncate">
              DakDin <span className="text-xs text-blue-400 font-medium border border-blue-500/30 px-1.5 py-0.5 rounded">Doctor</span>
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
            D
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none ${
            isCollapsed ? 'mx-auto mt-2' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {!isCollapsed && (
          <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Navigation Menu
          </p>
        )}

        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="text-lg shrink-0 transition-transform group-hover:scale-110">
                {item.icon}
              </span>

              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all group relative ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
