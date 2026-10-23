
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginEmail = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEmail(loginEmail);
        setStep('otp');
        toast.success('OTP sent to your email!');
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const otp = formData.get('otp') as string;

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Login successful!');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(result.message || 'OTP verification failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#f7fcf9] p-0 md:p-4 lg:p-6 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="min-h-screen md:min-h-[calc(100vh-48px)] w-full overflow-hidden rounded-none md:rounded-[28px] border border-[#dfeee5] bg-white shadow-sm">

        <div className="grid min-h-screen md:min-h-[calc(100vh-48px)] lg:grid-cols-[1.02fr_0.98fr]">

          {/* =========================================================
              LEFT BRANDING SECTION
          ========================================================== */}
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#f5fcf7] via-[#ffffff] to-[#e5f8ea] lg:block">

            {/* Decorative circles */}
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#dff5e5] opacity-50 blur-3xl" />
            <div className="absolute right-[-100px] top-[35%] h-80 w-80 rounded-full bg-[#e4f7e9] opacity-60 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col px-14 py-12 xl:px-20">

              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#159447]">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                  >
                    <path
                      d="M16 4C9.373 4 4 8.925 4 15c0 3.56 1.84 6.73 4.68 8.72V28l4.35-2.17c.96.24 1.96.37 2.97.37 6.627 0 12-4.925 12-11S22.627 4 16 4Z"
                      stroke="white"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 10v10M11 15h10"
                      stroke="white"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <h1 className="text-[40px] font-extrabold leading-none tracking-[-1.5px] text-[#159447]">
                    dakdin
                  </h1>
                  <p className="mt-1 text-[13px] font-semibold tracking-[0.8px] text-[#59635e]">
                    HELP CENTER MANAGEMENT
                  </p>
                </div>
              </div>

              {/* Main Text */}
              <div className="mt-20 max-w-[560px]">
                <h2 className="text-[42px] font-bold leading-[1.25] tracking-[-1px] text-[#17221c] xl:text-[48px]">
                  সেবায় গতিশীলতা,
                  <br />
                  ব্যবস্থাপনায় সহজতা
                </h2>

                <p className="mt-6 max-w-[500px] text-[17px] leading-8 text-[#66716b]">
                  ডাকদিন হেল্প সেন্টার ম্যানেজমেন্ট সফটওয়্যার দিয়ে
                  গ্রাহক সেবা হোক আরও দ্রুত, সহজ ও কার্যকর।
                </p>
              </div>

              {/* Features */}
              <div className="mt-12 space-y-6">

                <Feature
                  icon={<HeadsetIcon />}
                  title="টিকিট ও ইনকোয়ারি ব্যবস্থাপনা"
                  description="সব ইনকোয়ারি এক জায়গায়"
                />

                <Feature
                  icon={<UsersIcon />}
                  title="এজেন্ট ও টিম ম্যানেজমেন্ট"
                  description="টিমের কার্যক্রম সহজে পর্যবেক্ষণ করুন"
                />

                <Feature
                  icon={<ChartIcon />}
                  title="রিপোর্ট ও অ্যানালিটিক্স"
                  description="ডেটা ভিত্তিক সিদ্ধান্ত নিন সহজে"
                />

                <Feature
                  icon={<SettingsIcon />}
                  title="স্মার্ট অটোমেশন"
                  description="অটোমেশন দিয়ে সেবা দিন আরও দ্রুত"
                />

              </div>

              {/* Healthcare Illustration */}
              <div className="absolute bottom-0 left-0 right-0 h-[240px] overflow-hidden">

                {/* Ground */}
                <div className="absolute bottom-0 left-[-5%] h-[100px] w-[110%] rounded-[50%] bg-[#b9e9c8]" />

                <div className="absolute bottom-[-45px] left-[-10%] h-[100px] w-[120%] rounded-[50%] bg-[#7bd297]" />

                {/* Hospital */}
                <div className="absolute bottom-[35px] left-[50%] -translate-x-1/2">
                  <div className="relative h-[125px] w-[135px] rounded-t-md bg-[#40b96a]">
                    <div className="absolute -top-10 left-[38px] h-10 w-[60px] rounded-t-md bg-[#36ad60]" />

                    {/* Cross */}
                    <div className="absolute left-[50%] top-[28px] -translate-x-1/2">
                      <div className="absolute left-[14px] top-0 h-[42px] w-[14px] bg-white" />
                      <div className="absolute left-0 top-[14px] h-[14px] w-[42px] bg-white" />
                    </div>

                    {/* Windows */}
                    <div className="absolute bottom-0 left-3 h-14 w-7 rounded-t bg-[#278e50]" />
                    <div className="absolute bottom-12 left-6 h-5 w-5 bg-[#8cdda2]" />
                    <div className="absolute bottom-12 right-6 h-5 w-5 bg-[#8cdda2]" />
                  </div>
                </div>

                {/* Small buildings */}
                <div className="absolute bottom-[34px] left-[17%] h-[70px] w-[60px] bg-[#69ca87]">
                  <div className="absolute left-3 top-4 h-3 w-3 bg-[#b3e9c3]" />
                  <div className="absolute left-8 top-4 h-3 w-3 bg-[#b3e9c3]" />
                  <div className="absolute left-3 top-10 h-3 w-3 bg-[#b3e9c3]" />
                </div>

                <div className="absolute bottom-[34px] right-[17%] h-[85px] w-[70px] bg-[#62c981]">
                  <div className="absolute left-3 top-4 h-3 w-3 bg-[#b3e9c3]" />
                  <div className="absolute left-8 top-4 h-3 w-3 bg-[#b3e9c3]" />
                  <div className="absolute left-3 top-10 h-3 w-3 bg-[#b3e9c3]" />
                </div>

                {/* Trees */}
                <Tree className="left-[7%]" />
                <Tree className="left-[11%]" />
                <Tree className="right-[9%]" />
                <Tree className="right-[14%]" />

                {/* Ambulance */}
                <div className="absolute bottom-[25px] left-[24%]">
                  <div className="relative h-10 w-[82px] rounded-lg border-2 border-[#159447] bg-white shadow-sm">
                    <div className="absolute -right-3 bottom-0 h-7 w-7 rounded-full border-4 border-[#168e48] bg-white" />
                    <div className="absolute left-2 top-2 h-4 w-7 rounded bg-[#d8f1df]" />

                    <div className="absolute left-[35px] top-[7px]">
                      <div className="absolute left-2 top-0 h-7 w-2 bg-[#159447]" />
                      <div className="absolute left-[-1px] top-3 h-2 w-7 bg-[#159447]" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* =========================================================
              RIGHT LOGIN SECTION
          ========================================================== */}
          <section className="flex items-center justify-center bg-[#fbfdfc] px-5 py-10 sm:px-8 lg:px-12 xl:px-20">

            <div className="w-full max-w-[560px]">

              <div className="rounded-[25px] border border-[#e6ebe8] bg-white px-7 py-10 shadow-[0_12px_50px_rgba(26,70,42,0.08)] sm:px-10 sm:py-12 lg:px-12">

                {/* Header */}
                <div className="text-center">

                  {/* Mobile-only dakdin logo (desktop has full branding section) */}
                  <div className="mx-auto mb-4 flex items-center gap-3 lg:hidden">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#159447]">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M16 4C9.373 4 4 8.925 4 15c0 3.56 1.84 6.73 4.68 8.72V28l4.35-2.17c.96.24 1.96.37 2.97.37 6.627 0 12-4.925 12-11S22.627 4 16 4Z"
                          stroke="white"
                          strokeWidth="2.4"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 10v10M11 15h10"
                          stroke="white"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold leading-none tracking-[-1px] text-[#159447]">
                      dakdin
                    </h1>
                  </div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf8ed]">
                    {step === 'login' ? (
                      <HeadsetIcon size={31} />
                    ) : (
                      <ShieldIcon size={31} />
                    )}
                  </div>

                  <h2 className="mt-5 text-[30px] font-bold text-[#17221c]">
                    {step === 'login' ? 'স্বাগতম!' : 'OTP যাচাই করুন'}
                  </h2>

                  <p className="mt-2 text-[16px] text-[#7a837e]">
                    {step === 'login'
                      ? 'আপনার অ্যাকাউন্টে লগইন করুন'
                      : 'আপনার ইমেইলে পাঠানো OTP দিন'}
                  </p>
                </div>

                {/* =====================================================
                    LOGIN FORM
                ====================================================== */}
                {step === 'login' ? (
                  <form
                    onSubmit={handleLogin}
                    className="mt-10 space-y-6"
                  >

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-[15px] font-semibold text-[#26312b]"
                      >
                        ইমেইল / মোবাইল
                      </label>

                      <div className="relative">
                        <UserIcon />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="আপনার ইমেইল বা মোবাইল নম্বর দিন"
                          className="h-[58px] w-full rounded-xl border border-[#d8dfdb] bg-white pl-12 pr-4 text-[15px] text-[#222] outline-none transition-all placeholder:text-[#a4aba7] focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-[15px] font-semibold text-[#26312b]"
                      >
                        পাসওয়ার্ড
                      </label>

                      <div className="relative">
                        <LockIcon />

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="আপনার পাসওয়ার্ড দিন"
                          className="h-[58px] w-full rounded-xl border border-[#d8dfdb] bg-white pl-12 pr-12 text-[15px] text-[#222] outline-none transition-all placeholder:text-[#a4aba7] focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#747d78] hover:text-[#159447]"
                          aria-label="Toggle password visibility"
                        >
                          <EyeIcon />
                        </button>
                      </div>
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between gap-3">

                      <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#69736e]">
                        <input
                          type="checkbox"
                          className="h-[19px] w-[19px] cursor-pointer accent-[#159447]"
                        />
                        আমাকে মনে রাখুন
                      </label>

                      <button
                        type="button"
                        className="text-[14px] font-semibold text-[#159447] hover:underline"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>

                    {/* Login */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-[60px] w-full items-center justify-center gap-3 rounded-xl bg-[#159b4d] text-[17px] font-bold text-white shadow-lg shadow-[#159b4d]/20 transition-all hover:bg-[#118a43] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LoginIcon />

                      {isLoading
                        ? 'OTP পাঠানো হচ্ছে...'
                        : 'লগইন করুন'}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-1">
                      <div className="h-px flex-1 bg-[#e2e6e4]" />
                      <span className="text-[14px] text-[#969d99]">
                        অথবা
                      </span>
                      <div className="h-px flex-1 bg-[#e2e6e4]" />
                    </div>

                  
                  </form>
                ) : (

                  /* =====================================================
                      OTP FORM
                  ====================================================== */

                  <form
                    onSubmit={handleVerifyOTP}
                    className="mt-10 space-y-6"
                  >

                    <div className="rounded-xl bg-[#f3faf5] px-5 py-4 text-center">
                      <p className="text-[14px] text-[#66716b]">
                        OTP পাঠানো হয়েছে
                      </p>

                      <p className="mt-1 break-all font-semibold text-[#159447]">
                        {email}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="otp"
                        className="mb-2 block text-[15px] font-semibold text-[#26312b]"
                      >
                        ৬ সংখ্যার OTP দিন
                      </label>

                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        className="h-[68px] w-full rounded-xl border border-[#d8dfdb] bg-white text-center text-[30px] font-bold tracking-[12px] text-[#159447] outline-none transition-all placeholder:text-[#c4cbc7] placeholder:tracking-[8px] focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-[60px] w-full items-center justify-center gap-3 rounded-xl bg-[#159b4d] text-[17px] font-bold text-white shadow-lg shadow-[#159b4d]/20 transition-all hover:bg-[#118a43] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldIcon size={21} />

                      {isLoading
                        ? 'যাচাই করা হচ্ছে...'
                        : 'OTP যাচাই করুন'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('login')}
                      className="w-full text-center text-[14px] font-semibold text-[#159447] hover:underline"
                    >
                      ← লগইন পেজে ফিরে যান
                    </button>

                  </form>
                )}

                {/* Footer */}
                <div className="mt-10 border-t border-[#edf0ee] pt-7 text-center">
                  <p className="text-[13px] text-[#747c78]">
                    © 2026 Dakdin. All rights reserved.
                  </p>

                  <p className="mt-2 text-[18px] font-bold text-[#159447]">
                    dakdin
                  </p>
                </div>

              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   FEATURE COMPONENT
============================================================ */

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#eaf8ed] text-[#159447]">
        {icon}
      </div>

      <div>
        <h3 className="text-[16px] font-bold text-[#27312b]">
          {title}
        </h3>

        <p className="mt-1 text-[14px] text-[#78817c]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   TREE
============================================================ */

function Tree({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute bottom-[30px] ${className}`}>
      <div className="mx-auto h-16 w-5 bg-[#4da866]" />

      <div className="relative h-14 w-14 rounded-full bg-[#61c77d]">
        <div className="absolute -left-3 top-4 h-10 w-10 rounded-full bg-[#70cf8a]" />
        <div className="absolute -right-3 top-4 h-10 w-10 rounded-full bg-[#54bd73]" />
      </div>
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function UserIcon() {
  return (
    <svg
      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747d78]"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M20 21a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747d78]"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.5" r="1" fill="currentColor" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M10 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 19V5a2 2 0 0 0-2-2h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 3l8 3v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeadsetIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#159447]"
    >
      <path
        d="M4 14v-2a8 8 0 0 1 16 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Zm13 0h3v4a1 1 0 0 1-1 1h-2v-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M17 19c0 1.1-1.8 2-4 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#159447]"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 5a3 3 0 0 1 0 6M18 14c1.8.7 3 2.4 3 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#159447]"
    >
      <path
        d="M4 20V10M10 20V4M16 20v-7M22 20H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#159447]"
    >
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2A2 2 0 0 0 5.8 17.8l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11.6h-.2a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 4.2l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 0h.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 21 7.6h.2a2 2 0 0 1 0 4H21a2 2 0 0 0-1.6 3.4Z"
        transform="scale(.9) translate(1.3 1.3)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

