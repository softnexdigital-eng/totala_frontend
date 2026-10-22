'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { serializeDoctorCookie } from '@/lib/doctorCookie';

export default function DoctorLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/doctors/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('লগিন সফল!');
        document.cookie = `doctorToken=${result.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        // Slim, size-capped profile — browsers drop cookies over ~4096 bytes,
        // and the raw API payload can contain a 70KB+ base64 profile image.
        document.cookie = `doctor=${serializeDoctorCookie(result.data.doctor)}; path=/; max-age=${7 * 24 * 60 * 60}`;
        router.push('/doctor-dashboard');
        router.refresh();
      } else {
        toast.error(result.message || 'লগিন ব্যর্থ');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ডাক্তার লগইন
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            আপনার ড্যাশবোর্ডে প্রবেশ করতে ইমেল ও পাসওয়ার্ড দিয়ে লগইন করুন
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ইমেল
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            একাউন্ট নেই?{' '}
            <a href="/doctors/register" className="text-blue-600 hover:text-blue-800 font-medium">
              ডাক্তার রেজিস্ট্রেশন করুন
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
