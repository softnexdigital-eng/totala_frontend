'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Hospital {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface HospitalFormProps {
  hospitalData?: Hospital;
}

export default function HospitalForm({ hospitalData }: HospitalFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: hospitalData?.name || '',
    type: hospitalData?.type || 'Hospital',
    isActive: hospitalData?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = hospitalData ? `/api/hospitals/${hospitalData.id}` : '/api/hospitals';
      const method = hospitalData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(hospitalData ? 'Hospital updated!' : 'Hospital created!');
        router.push('/hospitals');
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hospital Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Hospital">Hospital</option>
          <option value="Clinic">Clinic</option>
          <option value="Diagnostic Center">Diagnostic Center</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Active
        </label>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : hospitalData ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
