'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import DoctorSidebar from './DoctorSidebar';
import { readDoctorCookie, serializeDoctorCookie } from '@/lib/doctorCookie';

interface Doctor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  registrationStatus?: string | null;
}

export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const writeDoctorCookie = (profile: Doctor) => {
    document.cookie = `doctor=${serializeDoctorCookie(profile)}; path=/; max-age=${7 * 24 * 60 * 60}`;
  };

  const fetchProfile = (): Promise<Doctor | null> =>
    fetch('/api/doctors/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data?.success && data.data ? (data.data as Doctor) : null))
      .catch(() => null);

  useEffect(() => {
    let mounted = true;

    const cookieDoctor = readDoctorCookie();

    if (cookieDoctor) {
      // Render instantly from the cookie data we already have.
      setDoctor(cookieDoctor);
      setLoading(false);

      // Then fetch the latest profile from the backend and keep the cookie in
      // sync (the cookie only ever holds a slim, size-capped snapshot).
      fetchProfile().then((fresh) => {
        if (!mounted || !fresh) return;
        setDoctor(fresh);
        writeDoctorCookie(fresh);
      });
    } else {
      // No usable profile cookie — try to restore it from the API using the
      // doctorToken before giving up (e.g. an older oversized session).
      fetchProfile().then((fresh) => {
        if (!mounted) return;
        if (fresh) {
          setDoctor(fresh);
          writeDoctorCookie(fresh);
          setLoading(false);
        } else {
          router.push('/doctor-login');
        }
      });
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!doctor) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          {pathname === '/doctor-dashboard' && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">স্বাগতম, ডা. {doctor.name}</h1>
              <p className="text-gray-600 mt-2">
                ডাক্তার ড্যাশবোর্ড
                {doctor.specialization ? ` — ${doctor.specialization}` : ''}
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
