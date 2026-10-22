'use client';

import DoctorRegistrationForm from '@/app/doctors/register/doctor-registration-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <DoctorRegistrationForm />
      </div>
    </div>
  );
}
