'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { validateEmail, validateOTP } from '@/lib/validation';
import { DOCTOR_SPECIALITIES, DOCTOR_TITLES, DOCTOR_GENDER_OPTIONS } from '@/lib/doctorSpecialities';

interface DoctorRegistrationData {
  name: string;
  title: string;
  titleOther: string;
  specialty: string;
  specialtyOther: string;
  gender: string;
  profileImage: string;
  mobileNumber: string;
  email: string;
  verificationCode: string;
  phone: string;
  bmdcRegNo: string;
  description: string;
  degree: string;
  agreeToTerms: boolean;
  password: string;
  confirmPassword: string;
}

export default function DoctorRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<DoctorRegistrationData>({
    name: '',
    title: '',
    titleOther: '',
    specialty: '',
    specialtyOther: '',
    gender: '',
    profileImage: '',
    mobileNumber: '',
    email: '',
    verificationCode: '',
    phone: '',
    bmdcRegNo: '',
    description: '',
    degree: '',
    agreeToTerms: false,
    password: '',
    confirmPassword: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showBkash, setShowBkash] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof DoctorRegistrationData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Changing the email invalidates any previous OTP verification — the user
    // must request and verify a new code for the new address.
    if (field === 'email' && value !== formData.email) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpError('');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    handleInputChange('title', val);
    if (val !== 'Other') {
      handleInputChange('titleOther', '');
    }
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    handleInputChange('specialty', val);
    if (val !== 'Other Speciality (not mentioned in the list)') {
      handleInputChange('specialtyOther', '');
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('অনুগ্রহ্য করে ছবি ফাইল আপলোড করুন');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ ৫MB এর বেশি হতে পারে না');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleInputChange('profileImage', dataUrl);
      setPreviewImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('88')) {
      val = val.substring(2);
    }
    handleInputChange('mobileNumber', val);
  };

  const handleSendOtp = async () => {
    const email = formData.email.trim();
    if (!email) {
      toast.error('ইমেল ঠিকানা লিখুন');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('বৈধ ইমেল ঠিকানা লিখুন');
      return;
    }

    setSendingOtp(true);
    setOtpError('');

    try {
      const response = await fetch('/api/doctors/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        toast.success('OTP আপনার ইমেলে পাঠানো হয়েছে');
      } else {
        setOtpError(data.message || 'OTP পাঠাতে ব্যর্থ');
        toast.error(data.message || 'OTP পাঠাতে ব্যর্থ');
      }
    } catch {
      setOtpError('OTP পাঠাতে ব্যর্থ');
      toast.error('OTP পাঠাতে ব্যর্থ');
    }
    setSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    const code = formData.verificationCode.trim();
    if (!code) {
      toast.error('OTP কোড লিখুন');
      return;
    }
    if (!validateOTP(code)) {
      toast.error('OTP কোডটি ৬ অংকের হতে হবে');
      return;
    }

    setVerifying(true);
    setOtpError('');

    try {
      const response = await fetch('/api/doctors/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          verificationCode: code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailVerified(true);
        toast.success('ইমেল ভেরিফাই সফল');
      } else {
        setOtpError(data.message || 'OTP ভেরিফাই ব্যর্থ');
        toast.error(data.message || 'OTP ভেরিফাই ব্যর্থ');
      }
    } catch {
      setOtpError('OTP ভেরিফাই ব্যর্থ');
      toast.error('OTP ভেরিফাই ব্যর্থ');
    }
    setVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast.error('অনুমোদন করতে চেকবক্সটি চেক করুন');
      return;
    }

    if (!emailVerified) {
      toast.error('ইমেল ভেরিফাই করুন');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('নাম লিখুন');
      return;
    }

    if (!formData.specialty && !formData.specialtyOther) {
      toast.error('স্পেশালটি নির্বাচন করুন');
      return;
    }

    if (!formData.gender) {
      toast.error('লিঙ্গ নির্বাচন করুন');
      return;
    }

    if (!formData.mobileNumber || formData.mobileNumber.length < 10) {
      toast.error('ভ্যালিড মোবাইল নম্বর লিখুন');
      return;
    }

    if (!formData.bmdcRegNo.trim()) {
      toast.error('BMDC রেজিস্ট্রেশন নম্বর লিখুন');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর দীর্ঘ হতে হবে');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('পাসওয়ার্ড ও নিশ্চিত পাসওয়ার্ড মিলছে না');
      return;
    }

    setIsSubmitting(true);

    const specialtyValue = formData.specialty === 'Other Speciality (not mentioned in the list)'
      ? formData.specialtyOther
      : formData.specialty;

    const titleValue = formData.title === 'Other'
      ? formData.titleOther
      : formData.title;

    try {
      const response = await fetch('/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          title: titleValue,
          specialty: specialtyValue,
          gender: formData.gender.toLowerCase(),
          profileImage: formData.profileImage,
          mobileNumber: `+88${formData.mobileNumber}`,
          email: formData.email.trim().toLowerCase(),
          phone: formData.mobileNumber,
          bmdcRegNo: formData.bmdcRegNo.trim(),
          description: formData.description.trim(),
          degree: formData.degree.trim(),
          verificationCode: formData.verificationCode,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationSuccess(true);
        setShowBkash(false);
        toast.success('ডাক্তার রেজিস্ট্রেশন সফল!');
      } else {
        toast.error(data.message || 'রেজিস্ট্রেশন ব্যর্থ');
      }
    } catch {
      toast.error('রেজিস্ট্রেশন ব্যর্থ');
    }
    setIsSubmitting(false);
  };

  const getDisplayMobileNumber = () => {
    return formData.mobileNumber.replace(/^88/, '');
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">রেজিস্ট্রেশন সফল!</h2>
          <p className="text-gray-600">
            আপনার নিবন্ধন সফলভাবে জমা হয়েছে। সুপার অ্যাডমিন অনুমোদন দিলে আপনি
            রেজিস্ট্রেশনে দেওয়া ইমেল ও পাসওয়ার্ড দিয়ে ডাক্তার ড্যাশবোর্ডে লগইন
            করতে পারবেন।
          </p>
          <button
            onClick={() => router.push('/doctor-login')}
            className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ডাক্তার লগইন পেজে যান
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            হোম পৃষ্ঠায় ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">ডাক্তার রেজিস্ট্রেশন ফর্ম</h1>
        <p className="text-gray-600 mb-8">
          স্বাগতম! Doctorola.com-এ আপনার ডাক্তার রেজিস্ট্রেশন করতে নিচের ফর্মটি পূরণ করুন।
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                নাম *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                শিরোনাম / গণনীয়
              </label>
              <select
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {DOCTOR_TITLES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {formData.title === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  অন্যান্য শিরোনাম
                </label>
                <input
                  type="text"
                  value={formData.titleOther}
                  onChange={(e) => handleInputChange('titleOther', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="আপনার শিরোনামটি লিখুন"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                স্পেশালটি *
              </label>
              <select
                value={formData.specialty}
                onChange={handleSpecialtyChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">স্পেশালটি নির্বাচন করুন</option>
                {DOCTOR_SPECIALITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {formData.specialty === 'Other Speciality (not mentioned in the list)' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  অন্যান্য স্পেশালটি
                </label>
                <input
                  type="text"
                  value={formData.specialtyOther}
                  onChange={(e) => handleInputChange('specialtyOther', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="আপনার স্পেশালটি লিখুন"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                লিঙ্গ *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">লিঙ্গ নির্বাচন করুন</option>
                {DOCTOR_GENDER_OPTIONS.slice(1).map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ডিগ্রি ও অন্যান্য বিশদাংক
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="যেমন: MBBS, FCPS ইত্যাদি"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              প্রোফাইল ছবি
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                ছবি আপলোড করুন
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
              )}
            </div>
            <input
              type="hidden"
              value={formData.profileImage}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                মোবাইল নম্বর *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                  +88 01
                </span>
                <input
                  type="tel"
                  value={getDisplayMobileNumber()}
                  onChange={handleMobileNumberChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="XXXXXXXXX"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ফোন নম্বর
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+88XXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ইমেল ঠিকানা *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
                required
                disabled={otpSent}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ভেরিফিকেশন কোড *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="৬ অংকের কোড"
                  maxLength={6}
                  disabled={emailVerified || !otpSent}
                />
                {!otpSent && !emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !formData.email.trim() || !validateEmail(formData.email)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {sendingOtp ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
                  </button>
                )}
                {otpSent && !emailVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifying || !formData.verificationCode}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {verifying ? 'ভেরিফাই...' : 'ভেরিফাই'}
                  </button>
                )}
                {emailVerified && (
                  <div className="inline-flex items-center px-3 bg-green-100 text-green-800 rounded-lg text-sm">
                    ✓ ভেরিফাইড
                  </div>
                )}
              </div>
              {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BMDC রেজিস্ট্রেশন নম্বর *
              </label>
              <input
                type="text"
                value={formData.bmdcRegNo}
                onChange={(e) => handleInputChange('bmdcRegNo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="BMDC Registration Number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                পাসওয়ার্ড *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="কমপক্ষে ৬ অক্ষর"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                এই পাসওয়ার্ড দিয়ে অনুমোদনের পর ডাক্তার ড্যাশবোর্ডে লগইন করতে পারবেন।
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="পাসওয়ার্ড আবার লিখুন"
                minLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ব্যাক্তিগত বিবরণী (পেশাগত বিবরণী)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="আপনার পেশাগত জীবনের সংক্ষিপ্ত বর্ণনা লিখুন..."
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="mt-1 mr-3"
                required
              />
             
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !formData.agreeToTerms || !emailVerified}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isSubmitting ? 'জমা হচ্ছে...' : 'রেজিস্টার করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
