'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Search,
  MapPin,
  Stethoscope,
  UserRound,
  Pill,
  Droplet,
  FlaskConical,
  Bandage,
  HeartPulse,
  FileText,
  Car,
  Siren,
  Flame,
  Ambulance,
  Phone,
  Clock3,
  Menu,
  X,
  ShieldCheck,
  Megaphone,
  Mail,
  ShoppingCart,
  CheckCircle2,
  Heart,
  Thermometer,
  Newspaper,
  Users,
  Navigation,
  Video,
  Star,
  Building2,
  HeartHandshake,
  BadgeCheck,
  MessageCircle,
  UserPlus,
  CalendarDays,
  ChevronRight,
  Home,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AgentCard from '@/components/booking/AgentCard';
import BookNowModal from '@/components/booking/BookNowModal';
import TransportBookingModal from '@/components/booking/TransportBookingModal';
import SecurityShield from '@/components/security/SecurityShield';
import { AgentCardSkeleton, DropdownSkeleton } from '@/components/ui/Skeleton';
import type { AgentProfile, ServiceType } from '@/types';

/* =========================================================
   CONSTANTS
   Put your images in /public/images/ (names below). Any missing
   image falls back to a soft green placeholder, never a broken icon.
========================================================= */

// Hero image: save it as /public/images/hero-bg.png
const HERO_BG = '/images/hero-bg.png';
const PREGNANT_MOTHER_IMG =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTN81imzCSGPN9B6PDUDIFkyP8SsqqMBlAzrIzVzC3ung&s=10';
const FIRST_AID_BOX_IMG =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStPEJuvpU9ugu3IKz_NQ5m6ui-zn69mSvzvlBmwTfjtQ&s=10';

const BRAND = '#0b5d3b'; // dark green used for buttons / headings

// ⚠️ Replace with your REAL hotline number before going live.
const HOTLINE = { display: '+880 1300 000000', tel: '+8801300000000' };

// Hides the scrollbar on horizontal swipe rows (mobile app feel).
const NO_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

// Big action buttons shown right under the hero image.
const HERO_ACTIONS = [
  { key: 'doctor', label: 'ডাক্তার দেখান', sub: 'ভিডিও/ফোনে ডাক্তারের পরামর্শ', icon: Stethoscope, color: 'bg-emerald-600', service: 'ডাক্তার অ্যাপয়েন্টমেন্ট' },
  { key: 'medicine', label: 'ওষুধ চাই', sub: 'প্রেসক্রিপশন অনুযায়ী ওষুধ সংগ্রহ', icon: Pill, color: 'bg-teal-600', service: 'ওষুধ সংগ্রহ' },
  { key: 'ambulance', label: 'অ্যাম্বুলেন্স / পরিবহন', sub: 'রোগী নিয়ে যাওয়ার সহায়তা', icon: Ambulance, color: 'bg-rose-500', service: 'transport' },
] as const;
const MAP_EMBED =
  'https://www.openstreetmap.org/export/embed.html?bbox=90.36%2C24.72%2C90.45%2C24.79&layer=mapnik&marker=24.7539%2C90.4073';
const MAP_LINK =
  'https://www.openstreetmap.org/?mlat=24.7539&mlon=90.4073#map=14/24.7539/90.4073';

const NAV_LINKS = [
  { label: 'হোম', href: '#top' },
  { label: 'সেবা সমূহ', href: '#services' },
  { label: 'অনলাইন ডাক্তার', href: '#online-doctor' },
  { label: 'জরুরি সেবা', href: '#emergency' },
  { label: 'স্বাস্থ্য টিপস', href: '#tips' },
  { label: 'যোগাযোগ', href: '#contact' },
];

/**
 * Category chips shown in the navbar on mobile (swipe sideways).
 * `service` = booking service name, 'transport' = transport modal,
 * `href` = scroll to a section.
 */
const NAV_CATEGORIES: {
  label: string;
  icon: LucideIcon;
  service?: string;
  href?: string;
  tint: string;
}[] = [
  { label: 'ডাক্তার', icon: Stethoscope, service: 'ডাক্তার অ্যাপয়েন্টমেন্ট', tint: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'হাসপাতাল', icon: Building2, service: 'হাসপাতাল / ক্লিনিক', tint: 'bg-sky-50 text-sky-700 border-sky-100' },
  { label: 'ওষুধ', icon: Pill, service: 'ঔষধ / ফার্মেসি', tint: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'টেস্ট', icon: FlaskConical, service: 'ডায়াগনস্টিক', tint: 'bg-violet-50 text-violet-700 border-violet-100' },
  { label: 'রক্ত', icon: Droplet, service: 'রক্ত / ব্লাড ব্যাংক', tint: 'bg-rose-50 text-rose-600 border-rose-100' },
  { label: 'হোম সার্ভিস', icon: HeartPulse, service: 'স্বাস্থ্যসেবা', tint: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'অ্যাম্বুলেন্স', icon: Car, service: 'transport', tint: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'জরুরি', icon: Siren, href: '#emergency', tint: 'bg-rose-50 text-rose-600 border-rose-100' },
];

type Tone = 'green' | 'blue' | 'red' | 'teal' | 'amber' | 'violet';

const TONES: Record<Tone, { card: string; icon: string; arrow: string; badge: string }> = {
  green: { card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white', icon: 'bg-emerald-600', arrow: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  blue: { card: 'border-sky-100 bg-gradient-to-br from-sky-50 to-white', icon: 'bg-sky-500', arrow: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  red: { card: 'border-rose-100 bg-gradient-to-br from-rose-50 to-white', icon: 'bg-rose-500', arrow: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
  teal: { card: 'border-teal-100 bg-gradient-to-br from-teal-50 to-white', icon: 'bg-teal-600', arrow: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
  amber: { card: 'border-amber-100 bg-gradient-to-br from-amber-50 to-white', icon: 'bg-amber-500', arrow: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  violet: { card: 'border-violet-100 bg-gradient-to-br from-violet-50 to-white', icon: 'bg-violet-600', arrow: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
};

// `pos` = image focus point. Use 'object-top' when faces are near the top.
const SERVICES = [
  { title: 'ডাক্তার / চিকিৎসা', subtitle: 'অনলাইনে ডাক্তার পরামর্শ ও অ্যাপয়েন্টমেন্ট', icon: Stethoscope, tone: 'green' as Tone, image: '/images/subjects/doctor-consultation.jpg', badge: 'অনলাইন পরামর্শ', pos: 'object-top' },
  { title: 'হাসপাতাল / ক্লিনিক', subtitle: 'হাসপাতাল, ক্লিনিক ও রোগী সহায়তা', icon: Building2, tone: 'blue' as Tone, image: '/images/subjects/hospital.jpg', badge: 'হাসপাতাল সহায়তা', pos: 'object-center' },
  { title: 'ঔষধ / ফার্মেসি', subtitle: 'প্রেসক্রিপশন অনুযায়ী ওষুধ সংগ্রহ', icon: Pill, tone: 'green' as Tone, image: '/images/subjects/pharmacy.jpg', badge: 'ওষুধ সংগ্রহ', pos: 'object-center' },
  { title: 'জরুরি সেবা', subtitle: 'জরুরি সময়ে দ্রুত সহায়তা ও যোগাযোগ', icon: Ambulance, tone: 'red' as Tone, image: '/images/subjects/emergency.jpg', badge: 'জরুরি সহায়তা', pos: 'object-center' },
  { title: 'ডায়াগনস্টিক', subtitle: 'টেস্ট, ল্যাব ও রিপোর্ট সংগ্রহ', icon: FlaskConical, tone: 'violet' as Tone, image: '/images/subjects/diagnostic.jpg', badge: 'টেস্ট ও রিপোর্ট', pos: 'object-center' },
  { title: 'রক্ত / ব্লাড ব্যাংক', subtitle: 'রক্ত সংগ্রহ ও প্রয়োজনীয় সমন্বয়', icon: Droplet, tone: 'red' as Tone, image: '/images/subjects/blood.jpg', badge: 'রক্ত সহায়তা', pos: 'object-center' },
  { title: 'স্বাস্থ্যসেবা', subtitle: 'সালাইন, ইনজেকশন, ড্রেসিং ও BP চেক', icon: HeartPulse, tone: 'teal' as Tone, image: '/images/subjects/home-health.jpg', badge: 'হোম সার্ভিস', pos: 'object-center' },
  { title: 'জরুরি পরিবহন', subtitle: 'রোগী পরিবহন ও হাসপাতালে যাওয়ার সহায়তা', icon: Car, tone: 'amber' as Tone, image: '/images/subjects/ambulance.jpg', badge: 'পরিবহন', pos: 'object-center' },
];

/** Shape of a doctor returned by GET /api/public/doctors (serialized by the
 *  backend `serializeDoctor`, which always exposes both the dashboard and the
 *  mobile field spellings). */
type OnlineDoctor = {
  id: string;
  name: string;
  title?: string;
  specialization?: string;
  specialty?: string;
  fee?: number | null;
  consultationFee?: number | null;
  hospital?: string;
  chamber?: string;
  visitingDays?: string;
  visitingTime?: string;
  profileImage?: string;
  imageUrl?: string;
  isActive?: boolean;
  registrationStatus?: string;
};

const HEALTH_SUBJECTS = [
  { title: 'মা ও নারী স্বাস্থ্য', desc: 'গর্ভাবস্থা, মাসিক, প্রসূতি ও নারী স্বাস্থ্য নিয়ে তথ্য ও পরামর্শ।', image: '/images/subjects/women-health.jpg', icon: Heart },
  { title: 'শিশু স্বাস্থ্য', desc: 'শিশুর জ্বর, সর্দি-কাশি, পুষ্টি ও সাধারণ স্বাস্থ্য সম্পর্কে জানুন।', image: '/images/subjects/child-health.jpg', icon: UserRound },
  { title: 'হৃদযন্ত্র ও রক্তচাপ', desc: 'হৃদস্বাস্থ্য, রক্তচাপ ও জীবনযাপন সম্পর্কে প্রাথমিক তথ্য।', image: '/images/subjects/heart-health.jpg', icon: HeartPulse },
  { title: 'চর্ম ও সাধারণ স্বাস্থ্য', desc: 'ত্বক, দৈনন্দিন স্বাস্থ্য সমস্যা ও কখন চিকিৎসকের পরামর্শ নেবেন।', image: '/images/subjects/skin-health.jpg', icon: ShieldCheck },
];

const DISTINGUISHED_OPINIONS = [
  { name: 'বিশিষ্ট ব্যক্তির নাম', role: 'সমাজসেবক / উদ্যোক্তা', text: 'মানুষের প্রয়োজনের সময়ে স্বাস্থ্যসেবার সঠিক পথ খুঁজে পেতে এমন একটি উদ্যোগ গুরুত্বপূর্ণ।', image: '/images/people/person-1.jpg' },
  { name: 'বিশিষ্ট ব্যক্তির নাম', role: 'শিক্ষাবিদ / পেশাজীবী', text: 'স্থানীয় মানুষের জন্য প্রযুক্তির মাধ্যমে স্বাস্থ্যসেবা আরও সহজ করার উদ্যোগ প্রশংসনীয়।', image: '/images/people/person-2.jpg' },
  { name: 'বিশিষ্ট ব্যক্তির নাম', role: 'জনপ্রতিনিধি / সমাজকর্মী', text: 'সঠিক তথ্য ও প্রয়োজনীয় সহায়তা মানুষকে দ্রুত সঠিক সেবার কাছে পৌঁছে দিতে পারে।', image: '/images/people/person-3.jpg' },
];

const DOCTOR_OPINIONS = [
  { name: 'ডা. আপনার নাম', specialty: 'মেডিসিন বিশেষজ্ঞ', text: 'অনলাইন পরামর্শ রোগীকে প্রাথমিকভাবে সঠিক দিকনির্দেশনা দিতে এবং প্রয়োজন হলে দ্রুত চিকিৎসা নিতে সাহায্য করতে পারে।', image: '/images/doctors/doctor-4.jpg' },
  { name: 'ডা. আপনার নাম', specialty: 'গাইনি ও প্রসূতি বিশেষজ্ঞ', text: 'বিশেষ করে ফলোআপ ও সাধারণ স্বাস্থ্য পরামর্শের ক্ষেত্রে অনলাইন consultation রোগীর জন্য সময় ও যাতায়াতের চাপ কমাতে পারে।', image: '/images/doctors/doctor-5.jpg' },
  { name: 'ডা. আপনার নাম', specialty: 'শিশু রোগ বিশেষজ্ঞ', text: 'অভিভাবকরা শিশুর সাধারণ সমস্যায় প্রাথমিক পরামর্শ নিয়ে কখন সরাসরি চিকিৎসা প্রয়োজন তা বুঝতে পারেন।', image: '/images/doctors/doctor-6.jpg' },
];

/**
 * Hub cards. To use your own photos, drop them in /public/images/hub/ and
 * change the `image` paths.
 */
const HUB_SERVICES = [
  { title: 'ডাক্তার বুকিং', desc: 'এজেন্ট আপনার হয়ে অনলাইনে ডাক্তার বুক করে দেন।', icon: Stethoscope, tone: 'green' as Tone, image: '/images/subjects/hub-doctor.jpg', pos: 'object-top', book: 'ডাক্তার অ্যাপয়েন্টমেন্ট' },
  { title: 'অনলাইন পরামর্শে সহায়তা', desc: 'ফোন/ভিডিও কলে ডাক্তারের সাথে কথা বলতে পাশে থাকেন।', icon: Video, tone: 'blue' as Tone, image: '/images/subjects/emergency.jpg', pos: 'object-center', book: 'অনলাইন ডাক্তার' },
  { title: 'ফুল অ্যাসিস্ট্যান্স', desc: 'ডাক্তার দেখানো থেকে ওষুধ ও রিপোর্ট পর্যন্ত পূর্ণ সহায়তা।', icon: HeartHandshake, tone: 'teal' as Tone, image: '/images/subjects/hub-assist.jpg', pos: 'object-center', book: 'ফুল অ্যাসিস্ট্যান্স' },
  { title: 'অন্যান্য সেবা', desc: 'রক্ত সংগ্রহ, সালাইন, ইনজেকশন ও পেশেন্ট ট্রান্সপোর্ট।', icon: Ambulance, tone: 'amber' as Tone, image: '/images/subjects/hub-other.jpg', pos: 'object-center', book: 'অন্যান্য সেবা' },
];

const EMERGENCY = [
  { name: 'পুলিশ (জরুরি)', number: '999', note: 'জাতীয় জরুরি সেবা', icon: ShieldCheck, color: 'bg-blue-900' },
  { name: 'ফায়ার সার্ভিস (জরুরি)', number: '16163', note: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স', icon: Flame, color: 'bg-red-600' },
  { name: 'অ্যাম্বুলেন্স (জরুরি)', number: '1990', note: 'জরুরি অ্যাম্বুলেন্স সেবা', icon: Ambulance, color: 'bg-blue-800' },
  { name: 'স্বাস্থ্য বাতায়ন (হটলাইন)', number: '16263', note: 'স্বাস্থ্য সেবা ও পরামর্শ', icon: Phone, color: 'bg-emerald-600' },
];

const PREGNANCY_TIPS = [
  'পর্যাপ্ত পানি পান করুন',
  'নিয়মিত স্বাস্থ্য পরীক্ষা করুন',
  'পুষ্টিকর খাবার গ্রহণ করুন',
  'যেকোনো সমস্যা হলে ডাক্তারের পরামর্শ নিন',
];

const FIRST_AID_TIPS = [
  { text: 'জ্বর হলে বিশ্রাম নিন ও পানি পান করুন', icon: Thermometer },
  { text: 'কাটা-ছেঁড়ায় পরিষ্কার পানি দিয়ে ধুয়ে ব্যান্ডেজ করুন', icon: Bandage },
  { text: 'পেট খারাপ হলে ORS পান করুন', icon: Droplet },
  { text: 'হালকা মাথা ঘোরা/দুর্বলতায় বিশ্রাম নিন', icon: Heart },
];

const FIRST_AID_BOX = [
  'নাপা (জ্বর/ব্যথার জন্য)',
  'ব্যান্ডেজ ও গজ',
  'ORS স্যালাইন',
  'প্যারাসিটামল/অ্যান্টাসিড (সাধারণ)',
  'ডিজিটাল থার্মোমিটার (ঐচ্ছিক)',
];

const NEWS = [
  { title: 'গর্ভাবস্থায় পুষ্টি ও যত্ন: যা মনে রাখা দরকার', date: '২৩ সেপ্টেম্বর ২০২৬', tag: 'মাতৃস্বাস্থ্য', tagColor: 'bg-emerald-100 text-emerald-700', image: '/images/news-1.jpg' },
  { title: 'ডেঙ্গু প্রতিরোধে করণীয় ও সতর্কতা', date: '২২ সেপ্টেম্বর ২০২৬', tag: 'সতর্কতা', tagColor: 'bg-rose-100 text-rose-700', image: '/images/news-2.jpg' },
  { title: 'শিশু সর্দি-কাশি: ঘরে বসে প্রাথমিক যত্ন', date: '১৮ সেপ্টেম্বর ২০২৬', tag: 'শিশু স্বাস্থ্য', tagColor: 'bg-sky-100 text-sky-700', image: '/images/news-3.jpg' },
  { title: 'সুস্থ থাকার জন্য দৈনন্দিন খাবার তালিকা', date: '১৫ সেপ্টেম্বর ২০২৬', tag: 'পুষ্টি ও স্বাস্থ্য', tagColor: 'bg-lime-100 text-lime-700', image: '/images/news-4.jpg' },
  { title: 'বাড়িতে প্রসব পরবর্তী মায়ের যত্ন', date: '১০ সেপ্টেম্বর ২০২৬', tag: 'মাতৃস্বাস্থ্য', tagColor: 'bg-emerald-100 text-emerald-700', image: '/images/news-5.jpg' },
];

const ONLINE_STEPS = [
  { title: 'সেবা বা ডাক্তার বাছুন', desc: 'সার্চ বার থেকে "ডাক্তার অ্যাপয়েন্টমেন্ট" সিলেক্ট করুন।', icon: Search },
  { title: 'বুকিং রিকোয়েস্ট দিন', desc: 'নাম, ফোন নম্বর ও সমস্যার কথা লিখে রিকোয়েস্ট পাঠান।', icon: FileText },
  { title: 'আমরা যোগাযোগ করব', desc: 'আমাদের টিম আপনাকে ফোন করে ডাক্তারের সময় নিশ্চিত করবে।', icon: Phone },
  { title: 'ভিডিও/ফোনে পরামর্শ নিন', desc: 'নির্ধারিত সময়ে ঘরে বসেই ডাক্তারের সাথে কথা বলুন।', icon: Video },
];

// নমুনা তথ্য — আসল রিভিউ পেলে এগুলো বদলে দিন
const DOCTOR_REVIEWS = [
  { name: 'রহিমা বেগম', place: 'ত্রিশাল, ময়মনসিংহ', text: 'বাড়িতে বসেই ডাক্তারের সাথে কথা বলতে পেরেছি। সময় ও যাতায়াত দুটোই বেঁচেছে।', rating: 5 },
  { name: 'আব্দুল করিম', place: 'ফুলবাড়িয়া, ময়মনসিংহ', text: 'অনলাইন পরামর্শ নেওয়ার প্রক্রিয়াটা সহজ ছিল এবং প্রয়োজনে টিম পাশে ছিল।', rating: 5 },
  { name: 'সালমা খাতুন', place: 'গফরগাঁও, ময়মনসিংহ', text: 'ডাক্তার ধৈর্য নিয়ে সমস্যা শুনেছেন এবং পরবর্তী করণীয় বুঝিয়ে দিয়েছেন।', rating: 5 },
];

/* =========================================================
   HELPERS
========================================================= */

/** Strip risky characters and cap the length of anything typed into search. */
const sanitizeQuery = (value: string) =>
  value.replace(/[<>{}[\]\\`$]/g, '').slice(0, 60);

/** Hardened fetch: same-origin, must be OK + JSON, abortable. */
async function fetchJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error('request failed');
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('unexpected response');
  return res.json();
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

/** Image with shimmer while loading and a soft fallback if it fails. */
function SafeImage({
  src,
  alt,
  className = '',
  sizes,
  priority = false,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallback?: React.ReactNode;
}) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);

  // Image may already be loaded before hydration (SSR + priority).
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setState('ok');
  }, []);

  if (state === 'error') {
    return (
      <>
        {fallback ?? (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100" />
        )}
      </>
    );
  }

  return (
    <>
      {state === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-slate-200/70" />
      )}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={`${className} transition-opacity duration-500 ${
          state === 'ok' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}

/**
 * OverlayCard — the whole card is the photo. A dark gradient at the bottom keeps
 * the white title + subtitle readable on any image. Compact on mobile, roomy on
 * desktop. Used by both the "সেবা সমূহ" grid and the hub grid.
 */
function OverlayCard({
  title,
  subtitle,
  image,
  icon: Icon,
  tone,
  badge,
  position = 'object-center',
  onClick,
}: {
  title: string;
  subtitle: string;
  image: string;
  icon: LucideIcon;
  tone: Tone;
  badge?: string;
  position?: string;
  onClick?: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block aspect-[5/4] w-full overflow-hidden rounded-2xl bg-slate-200 text-left shadow-sm ring-1 ring-black/5 transition duration-300 active:scale-[0.98] sm:aspect-[4/3] sm:hover:-translate-y-1 sm:hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <SafeImage
        src={image}
        alt={title}
        sizes="(max-width: 1024px) 50vw, 25vw"
        className={`object-cover ${position} transition duration-500 group-hover:scale-105`}
        fallback={
          <div className={`absolute inset-0 flex items-center justify-center ${t.icon} text-white`}>
            <Icon className="h-9 w-9 opacity-90 sm:h-12 sm:w-12" />
          </div>
        }
      />

      {/* readability gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {badge && (
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:py-1 sm:text-xs ${t.icon}`}
        >
          {badge}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 p-2.5 sm:gap-2 sm:p-4">
        <div className="min-w-0">
          <h3 className="text-[13px] font-black leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] sm:text-base sm:leading-snug lg:text-lg">
            {title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-white/90 drop-shadow sm:line-clamp-2 sm:text-xs">
            {subtitle}
          </p>
        </div>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white shadow-lg sm:h-9 sm:w-9 ${t.icon}`}
        >
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
        </span>
      </div>
    </button>
  );
}

/* =========================================================
   PAGE
========================================================= */
export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [transportVehicle, setTransportVehicle] = useState<string | null>(null);

  // Which section is on screen — drives the bottom tab bar highlight.
  const [activeSection, setActiveSection] = useState('top');

  // Search bar: service types shown in the dropdown. Selecting one opens the
  // booking request modal (no agent selection from the landing page).
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [serviceQuery, setServiceQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookingService, setBookingService] = useState<string | null>(null);
  // Doctor picked in the "Online Doctors" section → forwarded to the modal.
  const [bookingDoctor, setBookingDoctor] = useState<{ id: string; name: string } | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Public agents
  useEffect(() => {
    const controller = new AbortController();
    fetchJson('/api/public-agents', controller.signal)
      .then((data) => {
        if (isRecord(data) && data.success && Array.isArray(data.data)) {
          setAgents(
            (data.data as unknown[]).filter(
              (a): a is AgentProfile => isRecord(a) && a.id != null
            )
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAgents(false);
      });
    return () => controller.abort();
  }, []);

  // Active service types (public, no auth)
  useEffect(() => {
    const controller = new AbortController();
    fetchJson('/api/public/service-types', controller.signal)
      .then((data) => {
        if (isRecord(data) && data.success && Array.isArray(data.data)) {
          setServiceTypes(
            (data.data as unknown[]).filter(
              (s): s is ServiceType => isRecord(s) && s.id != null && typeof s.name === 'string'
            )
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadingServiceTypes(false);
      });
    return () => controller.abort();
  }, []);

  // Online doctors shown in the "আজকের জন্য অনলাইন ডাক্তার" section.
  // Live data from GET /api/public/doctors (active doctors only).
  const [onlineDoctors, setOnlineDoctors] = useState<OnlineDoctor[]>([]);
  const [loadingOnlineDoctors, setLoadingOnlineDoctors] = useState(true);
  // The public API returns every active doctor (hundreds), so the section only
  // renders the first few and lets the visitor reveal more.
  const [visibleOnlineDoctors, setVisibleOnlineDoctors] = useState(6);
  const ONLINE_DOCTORS_PAGE_SIZE = 6;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson('/api/public/doctors', controller.signal)
      .then((data) => {
        if (isRecord(data) && data.success && Array.isArray(data.data)) {
          setOnlineDoctors(
            (data.data as unknown[]).filter(
              (d): d is OnlineDoctor =>
                isRecord(d) &&
                typeof d.id === 'string' &&
                typeof d.name === 'string' &&
                d.name.trim() !== '' &&
                d.isActive !== false &&
                // Only approved doctors are publicly bookable.
                String(d.registrationStatus ?? 'APPROVED').toUpperCase() ===
                  'APPROVED'
            )
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOnlineDoctors(false);
      });
    return () => controller.abort();
  }, []);

  // Close the dropdown when clicking / tapping outside the search bar.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Highlight the right bottom-tab while scrolling.
  useEffect(() => {
    const ids = ['online-doctor', 'services']; // checked bottom → top
    let ticking = false;
    const update = () => {
      ticking = false;
      let current = 'top';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          current = id;
          break;
        }
      }
      setActiveSection(current);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeAgents = agents.filter((agent) => agent.isActive !== false);

  const filteredServices = serviceTypes.filter((service) =>
    String(service.name ?? '')
      .toLowerCase()
      .includes(serviceQuery.trim().toLowerCase())
  );

  const openBooking = (name: string) => {
    setServiceQuery(name);
    setDropdownOpen(false);
    setBookingService(name);
    // A generic service booking must not carry over a previously picked doctor.
    setBookingDoctor(null);
  };

  /** Open the booking modal for a specific doctor (Online Doctors section). */
  const openDoctorBooking = (doctor: OnlineDoctor) => {
    setServiceQuery('ডাক্তার অ্যাপয়েন্টমেন্ট');
    setDropdownOpen(false);
    setBookingService('ডাক্তার অ্যাপয়েন্টমেন্ট');
    setBookingDoctor({ id: doctor.id, name: doctor.name });
  };

  /** Fee of a doctor — the API exposes it as `fee` and/or `consultationFee`. */
  const doctorFee = (doctor: OnlineDoctor): number | null => {
    const fee = Number(doctor.consultationFee ?? doctor.fee);
    return Number.isFinite(fee) && fee > 0 ? fee : null;
  };

  /** Speciality label of a doctor — `specialization` or its `specialty` alias. */
  const doctorSpecialty = (doctor: OnlineDoctor): string =>
    (doctor.specialization || doctor.specialty || '').trim();

  /**
   * Profile image of a doctor. `next/image` refuses remote hosts that are not
   * whitelisted in next.config.mjs, so only local paths and the allowed hosts
   * are rendered — anything else falls back to the placeholder instead of
   * throwing a "Invalid src prop" error.
   */
  const doctorImage = (doctor: OnlineDoctor): string | null => {
    const raw = (doctor.profileImage || doctor.imageUrl || '').trim();
    if (!raw) return null;
    if (raw.startsWith('/')) return raw;
    if (!/^https:\/\//i.test(raw)) return null;
    try {
      const { hostname } = new URL(raw);
      const allowed = [
        'res.cloudinary.com',
        'images.unsplash.com',
        'vromonguide.com',
        'blogger.googleusercontent.com',
        'encrypted-tbn0.gstatic.com',
        // Doctor profile images are hosted on daktarinfo.com.
        'daktarinfo.com',
      ];
      return allowed.includes(hostname) || hostname.endsWith('.daktarinfo.com')
        ? raw
        : null;
    } catch {
      return null;
    }
  };

  // Search button: exact match opens the modal, otherwise reveal the dropdown.
  const handleSearch = () => {
    const exact = serviceTypes.find(
      (service) =>
        String(service.name).toLowerCase() === serviceQuery.trim().toLowerCase()
    );
    if (exact) {
      setDropdownOpen(false);
      setBookingService(exact.name);
      return;
    }
    setDropdownOpen(true);
  };

  const focusSearch = () => {
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => searchInputRef.current?.focus(), 350);
  };

  const handleServiceCard = (item: (typeof SERVICES)[number]) => {
    if (item.title === 'জরুরি পরিবহন') {
      setTransportVehicle('car');
      return;
    }
    if (item.title === 'ডাক্তার / চিকিৎসা') {
      openBooking('ডাক্তার অ্যাপয়েন্টমেন্ট');
      return;
    }
    openBooking(item.title);
  };

  /** Navbar category chip tap (mobile). */
  const handleCategory = (cat: (typeof NAV_CATEGORIES)[number]) => {
    setMobileMenu(false);
    if (cat.href) {
      document
        .getElementById(cat.href.replace('#', ''))
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (cat.service === 'transport') {
      setTransportVehicle('car');
      return;
    }
    if (cat.service) openBooking(cat.service);
  };

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 pt-1.5 text-[10px] font-bold transition active:scale-95 ${
      active ? 'text-emerald-700' : 'text-slate-400'
    }`;

  return (
    <main
      id="top"
      className="min-h-screen overflow-x-clip bg-white text-slate-900 antialiased [-webkit-tap-highlight-color:transparent]"
    >
      <SecurityShield />

      {/* =========================================================
          NAVBAR  (mobile: slim app bar + swipeable category chips)
      ========================================================= */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-emerald-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7.5xl items-center justify-between gap-3 px-3.5 sm:h-16 sm:px-6 lg:h-[84px] lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center" aria-label="DakDin হোম">
            <Image
              src="/dakdinlogo.png"
              alt="Dakdin - ডাকদীন সেবা নিন"
              width={243}
              height={88}
              priority
              sizes="(max-width: 640px) 100px, (max-width: 1024px) 150px, 210px"
              draggable={false}
              className="h-8 w-auto object-contain sm:h-[46px] lg:h-[68px]"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="প্রধান মেনু">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative py-2 text-[15px] font-semibold transition hover:text-emerald-700 ${
                  i === 0 ? 'text-emerald-800' : 'text-slate-700'
                }`}
              >
                {link.label}
                {i === 0 && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-emerald-600" />
                )}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={focusSearch}
              aria-label="সেবা খুঁজুন"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition active:scale-95 hover:border-emerald-300 hover:text-emerald-700 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <Link
              href="/login"
              style={{ backgroundColor: BRAND }}
              className="hidden items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110 sm:flex"
            >
              <UserRound className="h-4 w-4" />
              সাইন ইন / রেজিস্টার
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="মেনু"
              aria-expanded={mobileMenu}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 transition active:scale-95 sm:h-10 sm:w-10 lg:hidden"
            >
              {mobileMenu ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
            <div className="mx-auto flex max-w-7.5xl flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenu(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 active:bg-emerald-50"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileMenu(false)}
                style={{ backgroundColor: BRAND }}
                className="mt-2 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white"
              >
                <UserRound className="h-4 w-4" />
                সাইন ইন / রেজিস্টার
              </Link>
            </div>
          </div>
        )}

        {/* Category chips — mobile / tablet app navigation */}
        <nav
          aria-label="সেবার ক্যাটাগরি"
          className="border-t border-slate-100 bg-white/95 lg:hidden"
        >
          <div
            className={`flex h-12 items-center gap-2 overflow-x-auto px-3.5 sm:px-6 ${NO_SCROLLBAR}`}
          >
            {NAV_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => handleCategory(cat)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${cat.tint}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* =========================================================
          HERO — image + search (search overlaps the image on mobile)
      ========================================================= */}
      <section className="relative z-20 overflow-visible pt-[104px] sm:pt-[112px] lg:pt-[84px]">
        <div className="relative">
          <div className="relative h-[150px] w-full bg-emerald-50 sm:h-auto sm:aspect-[3/1]">
            <SafeImage
              src={HERO_BG}
              alt="গ্রাম থেকে শহর — Dakdin সংযুক্ত স্বাস্থ্যসেবা"
              priority
              sizes="100vw"
              className="object-cover object-center"
              fallback={
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-sky-100" />
              }
            />
          </div>

          {/* Search bar — mobile: floats over the image's bottom edge.
              sm+: sits on the green wave inside the image. */}
          <div
            ref={searchWrapRef}
            className="relative z-30 -mt-6 w-full px-3.5 sm:absolute sm:inset-x-0 sm:bottom-[7%] sm:mx-auto sm:mt-0 sm:max-w-2xl sm:px-4"
          >
            <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white p-1 pl-4 text-left shadow-xl shadow-black/15 sm:gap-2 sm:border-white/60 sm:p-1.5 sm:pl-5 sm:shadow-2xl sm:shadow-black/30">
              <Search className="h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5" />
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                maxLength={60}
                value={serviceQuery}
                onChange={(e) => {
                  setServiceQuery(sanitizeQuery(e.target.value));
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setDropdownOpen(false);
                }}
                placeholder="ডাক্তার, হাসপাতাল, টেস্ট, ওষুধ খুঁজুন..."
                aria-label="সেবা খুঁজুন"
                className="w-full min-w-0 bg-transparent py-2.5 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 sm:py-3 sm:text-sm"
              />
              <button
                type="button"
                onClick={handleSearch}
                aria-label="খুঁজুন"
                style={{ backgroundColor: BRAND }}
                className="flex h-10 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 hover:brightness-110 sm:h-12 sm:w-14"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Dropdown: opens DOWN on mobile (below the bar), UP on sm+ */}
            {dropdownOpen && (
              <div className="absolute inset-x-3.5 top-full z-40 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white text-left shadow-2xl sm:inset-x-4 sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0 sm:max-h-64">
                {loadingServiceTypes ? (
                  <DropdownSkeleton />
                ) : filteredServices.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 sm:py-4 sm:text-sm">
                    কোনো সার্ভিস টাইপ পাওয়া যায়নি
                  </div>
                ) : (
                  filteredServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => openBooking(service.name)}
                      className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-left transition last:border-b-0 active:bg-emerald-50 hover:bg-emerald-50 sm:gap-3 sm:px-4 sm:py-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-9 sm:w-9">
                        <Stethoscope className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-slate-800 sm:text-sm">
                          {service.name}
                        </span>
                        {service.description && (
                          <span className="block truncate text-[11px] text-slate-500 sm:text-xs">
                            {service.description}
                          </span>
                        )}
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick action tiles + hotline */}
        <div className="bg-white px-3.5 pb-4 pt-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="mx-auto max-w-7.5xl">
            <p className="mb-2.5 text-center text-xs font-bold text-slate-700 sm:mb-3 sm:text-sm">
              আপনার কী প্রয়োজন? একটি বেছে নিন
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {HERO_ACTIONS.map(({ key, label, sub, icon: Icon, color, service }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    service === 'transport' ? setTransportVehicle('car') : openBooking(service)
                  }
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-sm transition active:scale-95 sm:flex-row sm:gap-4 sm:p-4 sm:text-left sm:shadow-md sm:hover:-translate-y-0.5 sm:hover:shadow-xl"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white sm:h-14 sm:w-14 ${color}`}>
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-black leading-4 text-slate-900 sm:text-base sm:leading-normal">{label}</span>
                    <span className="mt-0.5 hidden text-xs leading-4 text-slate-500 sm:block">{sub}</span>
                  </span>
                  <ArrowRight className="ml-auto hidden h-5 w-5 shrink-0 text-slate-400 sm:block" />
                </button>
              ))}

              <a
                href={`tel:${HOTLINE.tel}`}
                style={{ backgroundColor: BRAND }}
                className="col-span-3 flex items-center gap-3 rounded-2xl p-3 text-white shadow-md transition active:scale-[0.98] sm:col-span-1 sm:gap-4 sm:p-4 sm:hover:-translate-y-0.5 sm:hover:shadow-xl"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Phone className="h-5 w-5 sm:h-7 sm:w-7" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black sm:text-base">সরাসরি ফোন করুন</span>
                  <span className="mt-0.5 block text-base font-black leading-5 sm:text-lg">{HOTLINE.display}</span>
                  <span className="block text-[10px] text-emerald-100 sm:text-[11px]">সকাল ৯:০০ – রাত ৯:০০ (প্রতিদিন)</span>
                </span>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-white/70 sm:hidden" />
              </a>
            </div>

            <p className="mt-2.5 text-center text-[11px] text-slate-500 sm:mt-3 sm:text-xs">
              রিকোয়েস্ট দেওয়ার পর আমাদের টিম আপনাকে ফোন করে নিশ্চিত করবে।
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICE DIRECTORY — FULL-IMAGE CARDS
      ========================================================= */}
      <section id="services" className="scroll-mt-28 px-3.5 pb-6 pt-6 sm:px-6 sm:pb-10 sm:pt-12 lg:scroll-mt-24 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-2xl">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-9 sm:w-9">
                  <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                সেবা সমূহ (বিষয়ভিত্তিক)
              </h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-sm">আপনার প্রয়োজন অনুযায়ী বিষয় বেছে —Dakdin থেকে পরামর্শ, বুকিং বা প্রয়োজনীয় সহায়তা নিন।</p>
            </div>
            <Link href="/services" className="hidden shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-700 sm:flex">
              সব সেবা দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-4">
            {SERVICES.map((item) => (
              <OverlayCard
                key={item.title}
                title={item.title}
                subtitle={item.subtitle}
                image={item.image}
                icon={item.icon}
                tone={item.tone}
                badge={item.badge}
                position={item.pos}
                onClick={() => handleServiceCard(item)}
              />
            ))}
          </div>

          <Link
            href="/services"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 py-2.5 text-xs font-bold text-emerald-700 active:bg-emerald-100 sm:hidden"
          >
            সব সেবা দেখুন <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* =========================================================
          ONLINE DOCTOR CONSULTANCY — PRIMARY BUSINESS
      ========================================================= */}
      <section id="online-doctor" className="scroll-mt-28 bg-slate-50/70 px-3.5 py-8 sm:px-6 sm:py-14 lg:scroll-mt-24 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_1.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> মূল সেবা
              </span>
              <h2 className="mt-3 text-[22px] font-black leading-tight text-slate-900 sm:mt-4 sm:text-3xl lg:text-4xl">ঘরে বসেই অনলাইনে<br /><span className="text-emerald-700">ডাক্তারের পরামর্শ নিন</span></h2>
              <p className="mt-2.5 max-w-xl text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7">আপনার সমস্যা জানান, উপযুক্ত বিভাগ নির্বাচন করুন এবং নির্ধারিত সময়ে ভিডিও বা ফোনে চিকিৎসকের সাথে কথা বলুন। প্রয়োজন হলে Dakdin-এর সহায়তাও নিতে পারবেন।</p>
              <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
                <button type="button" onClick={() => openBooking('ডাক্তার অ্যাপয়েন্টমেন্ট')} style={{ backgroundColor: BRAND }} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95 hover:brightness-110 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm">
                  <CalendarDays className="h-4 w-4" /> ডাক্তার দেখান
                </button>
                <Link href="/doctors" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 transition active:scale-95 hover:bg-emerald-50 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm">
                  সব ডাক্তার দেখুন <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 sm:mt-7 sm:gap-3">
                {ONLINE_STEPS.map(({ title, icon: Icon }, i) => (
                  <div key={title} className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:rounded-2xl sm:p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-9 sm:w-9 sm:rounded-xl"><Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></span>
                    <p className="mt-1.5 text-[10px] font-bold leading-[14px] text-slate-800 sm:mt-2 sm:text-[11px] sm:leading-4"><span className="text-emerald-600">{i + 1}. </span>{title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 sm:text-xl">আজকের জন্য অনলাইন ডাক্তার</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 sm:mt-1 sm:text-xs">অনুমোদিত ডাক্তারদের তালিকা — বুকিং দিতে ডাক্তার বেছে নিন।</p>
                </div>
                <span className="hidden rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">● Online consultation</span>
              </div>

              {/* Mobile: swipe row · md+: 3-column grid */}
              <div
                className={`-mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 ${NO_SCROLLBAR}`}
              >
                {loadingOnlineDoctors &&
                  [0, 1, 2].map((i) => (
                    <div key={`doctor-skeleton-${i}`} className="w-[160px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:w-auto">
                      <div className="h-28 animate-pulse bg-slate-200/70 md:h-44" />
                      <div className="space-y-2 p-3 md:p-4">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}

                {!loadingOnlineDoctors && onlineDoctors.length === 0 && (
                  <div className="w-full shrink-0 rounded-2xl border border-dashed border-emerald-200 bg-white p-6 text-center md:col-span-3 md:p-8">
                    <Stethoscope className="mx-auto h-8 w-8 text-emerald-500 sm:h-10 sm:w-10" />
                    <p className="mt-2.5 text-[13px] font-bold text-slate-800 sm:mt-3 sm:text-sm">
                      এখনো কোনো অনলাইন ডাক্তার যোগ করা হয়নি
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                      আপনার বুকিং রিকোয়েস্ট দিলে আমাদের টিম সঠিক ডাক্তারের সাথে যোগাযোগ করাবে।
                    </p>
                    <button
                      type="button"
                      onClick={() => openBooking('ডাক্তার অ্যাপয়েন্টমেন্ট')}
                      style={{ backgroundColor: BRAND }}
                      className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 hover:brightness-110 sm:mt-4 sm:px-5"
                    >
                      <CalendarDays className="h-4 w-4" /> বুকিং রিকোয়েস্ট দিন
                    </button>
                  </div>
                )}

                {onlineDoctors.slice(0, visibleOnlineDoctors).map((doctor) => {
                  const image = doctorImage(doctor);
                  const fee = doctorFee(doctor);
                  const specialty = doctorSpecialty(doctor);
                  return (
                    <div key={doctor.id} className="group w-[160px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition md:w-auto md:hover:-translate-y-1 md:hover:shadow-xl">
                      <div className="relative h-28 bg-emerald-50 md:h-44">
                        {image ? (
                          <SafeImage src={image} alt={doctor.name} sizes="(max-width: 768px) 160px, 33vw" className="object-cover object-top transition duration-500 group-hover:scale-105"
                            fallback={<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-sky-50 text-emerald-700"><Stethoscope className="h-10 w-10 md:h-16 md:w-16" /></div>} />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-sky-50 text-emerald-700">
                            <Stethoscope className="h-10 w-10 md:h-16 md:w-16" />
                          </div>
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-[10px]">● Available</span>
                      </div>
                      <div className="p-3 md:p-4">
                        <h4 className="line-clamp-1 text-[13px] font-black text-slate-900 md:text-[15px]">{doctor.name}</h4>
                        {specialty && <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-emerald-700 md:text-xs">{specialty}</p>}
                        {(doctor.title || doctor.hospital) && (
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500 md:mt-1 md:text-[11px]">
                            {[doctor.title, doctor.hospital].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-slate-100 pt-2.5 md:mt-3 md:pt-3">
                          <span className="text-xs font-black text-slate-900 md:text-sm">
                            {fee !== null ? `৳ ${fee}` : 'ফি জানতে কল করুন'}
                          </span>
                          <button type="button" onClick={() => openDoctorBooking(doctor)} className="shrink-0 rounded-full bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white transition active:scale-95 hover:bg-emerald-800 md:px-3.5 md:py-2 md:text-[11px]">পরামর্শ নিন</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!loadingOnlineDoctors && onlineDoctors.length > visibleOnlineDoctors && (
                <div className="mt-4 flex justify-center sm:mt-6">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleOnlineDoctors((v) => v + ONLINE_DOCTORS_PAGE_SIZE)
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-600 px-4 py-2 text-xs font-bold text-emerald-700 transition active:scale-95 hover:bg-emerald-600 hover:text-white sm:px-5 sm:py-2.5"
                  >
                    আরও ডাক্তার দেখুন
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PATIENT REVIEWS
      ========================================================= */}
      <section className="bg-emerald-50/50 px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-xl">
            <MessageCircle className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
            রোগীদের মতামত
          </h2>
          <div
            className={`-mx-3.5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:mt-6 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 ${NO_SCROLLBAR}`}
          >
            {DOCTOR_REVIEWS.map((r) => (
              <div
                key={r.name}
                className="w-[250px] shrink-0 snap-start rounded-2xl border border-white bg-white p-4 shadow-sm md:w-auto md:p-5"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                        n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2.5 text-[13px] leading-5 text-slate-700 md:mt-3 md:text-sm md:leading-6">“{r.text}”</p>
                <div className="mt-3 flex items-center gap-2.5 md:mt-4 md:gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 md:h-9 md:w-9 md:text-sm">
                    {r.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{r.name}</p>
                    <p className="text-[10px] text-slate-400 md:text-[11px]">{r.place}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          HEALTH SUBJECTS — IMAGE FIRST
      ========================================================= */}
      <section className="px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-2xl"><HeartPulse className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" /> স্বাস্থ্য বিষয়ভিত্তিক তথ্য</h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-sm">বিভিন্ন স্বাস্থ্য বিষয় সম্পর্কে সহজ ভাষায় তথ্য, সচেতনতা ও কখন চিকিৎসকের পরামর্শ নেবেন তা জানুন।</p>
            </div>
            <Link href="/health-tips" className="hidden items-center gap-1 text-sm font-bold text-emerald-700 sm:flex">সব বিষয় দেখুন <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4">
            {HEALTH_SUBJECTS.map(({ title, desc, image, icon: Icon }) => (
              <Link href="/health-tips" key={title} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition active:scale-[0.98] sm:grid sm:grid-cols-[180px_1fr] sm:rounded-3xl sm:hover:-translate-y-1 sm:hover:shadow-xl">
                <div className="relative h-24 bg-emerald-50 sm:h-auto sm:min-h-[150px]">
                  <SafeImage src={image} alt={title} sizes="(max-width: 640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" fallback={<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600"><Icon className="h-9 w-9 sm:h-12 sm:w-12" /></div>} />
                </div>
                <div className="p-3 sm:p-5">
                  <span className="hidden h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 sm:grid"><Icon className="h-5 w-5" /></span>
                  <h3 className="text-[13px] font-black leading-tight text-slate-900 sm:mt-3 sm:text-lg">{title}</h3>
                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-slate-500 sm:line-clamp-none sm:text-xs sm:leading-5">{desc}</p>
                  <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 sm:mt-3 sm:gap-1 sm:text-xs">আরও জানুন <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          DOCTOR + DISTINGUISHED OPINIONS
      ========================================================= */}
      <section className="bg-slate-50/70 px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="grid gap-7 sm:gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-xl"><Stethoscope className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" /> চিকিৎসকদের মতামত</h2>
                  <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">স্বাস্থ্যসেবা ও অনলাইন consultation নিয়ে চিকিৎসকদের বক্তব্য।</p>
                </div>
              </div>
              <div className={`-mx-3.5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:mt-5 md:flex-col md:overflow-visible md:px-0 md:pb-0 ${NO_SCROLLBAR}`}>
                {DOCTOR_OPINIONS.map((item, idx) => (
                  <div key={item.name + item.specialty + idx} className="flex w-[285px] shrink-0 snap-start gap-3 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm md:w-auto md:gap-4 md:p-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-emerald-50 md:h-16 md:w-16 md:rounded-2xl">
                      <SafeImage src={item.image} alt={item.name} sizes="64px" className="object-cover object-top" fallback={<div className="absolute inset-0 flex items-center justify-center bg-emerald-100 text-emerald-700"><Stethoscope className="h-6 w-6 md:h-7 md:w-7" /></div>} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-slate-900 md:text-sm">{item.name}</p>
                      <p className="text-[10px] font-semibold text-emerald-700 md:text-[11px]">{item.specialty}</p>
                      <p className="mt-1 line-clamp-3 text-[11px] leading-[18px] text-slate-600 md:mt-1.5 md:line-clamp-none md:text-xs md:leading-5">“{item.text}”</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-xl"><Star className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" /> বিশিষ্ট ব্যক্তিদের মতামত</h2>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">Dakdin-এর উদ্যোগ সম্পর্কে সমাজের বিভিন্ন ক্ষেত্রের মানুষের বক্তব্য।</p>
              <div className={`-mx-3.5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:mt-5 md:flex-col md:overflow-visible md:px-0 md:pb-0 ${NO_SCROLLBAR}`}>
                {DISTINGUISHED_OPINIONS.map((item, idx) => (
                  <div key={item.name + item.role + idx} className="flex w-[285px] shrink-0 snap-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm md:w-auto md:gap-4 md:p-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100 md:h-16 md:w-16">
                      <SafeImage src={item.image} alt={item.name} sizes="64px" className="object-cover" fallback={<div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500"><Users className="h-6 w-6 md:h-7 md:w-7" /></div>} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-slate-900 md:text-sm">{item.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 md:text-[11px]">{item.role}</p>
                      <p className="mt-1 line-clamp-3 text-[11px] leading-[18px] text-slate-600 md:mt-1.5 md:line-clamp-none md:text-xs md:leading-5">“{item.text}”</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HUB + AGENT SERVICE — FULL-IMAGE CARDS
      ========================================================= */}
      <section className="px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="text-center">
            <h2 className="flex items-center justify-center gap-2 text-base font-black leading-snug text-slate-900 sm:text-2xl">
              <Building2 className="h-5 w-5 shrink-0 text-emerald-600 sm:h-6 sm:w-6" />
              আপনার এলাকার হাব, আপনার পাশের এজেন্ট
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-[11.5px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
              ময়মনসিংহের বিভিন্ন এলাকায় আমাদের হাব আছে। গ্রামের রোগীরা সরাসরি হাবে গিয়ে বা এজেন্টকে ফোন করে
              সহজে ডাক্তার দেখাতে পারেন — অনলাইন ডাক্তার বুকিং থেকে শুরু করে পূর্ণ সহায়তা পর্যন্ত সবকিছু এজেন্ট করে দেন।
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-4">
            {HUB_SERVICES.map((item) => (
              <OverlayCard
                key={item.title}
                title={item.title}
                subtitle={item.desc}
                image={item.image}
                icon={item.icon}
                tone={item.tone}
                position={item.pos}
                onClick={() => openBooking(item.book)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          OUR AGENTS (compact cards + registration CTAs)
      ========================================================= */}
      <section className="bg-slate-50 px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-xl">
                <Users className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                আমাদের এজেন্ট
              </h2>
              <p className="mt-1 max-w-2xl text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
                সার্চ বার থেকে সার্ভিস সিলেক্ট করে বুকিং রিকোয়েস্ট করুন; সুপার অ্যাডমিন এজেন্ট অ্যাসাইন করবেন।
              </p>
            </div>
            <Link
              href="/public-agents"
              className="flex w-fit shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 sm:gap-1.5 sm:text-sm"
            >
              সকল এজেন্ট <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {/* Compact cards: 3 cols on mobile, 6 cols on large */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-6">
            {loadingAgents ? (
              [0, 1, 2, 3, 4, 5].map((i) => <AgentCardSkeleton key={i} />)
            ) : activeAgents.length === 0 ? (
              <div className="col-span-full py-6 text-center text-xs text-slate-500 sm:py-8 sm:text-sm">
                এই মুহূর্তে কোনো এজেন্ট পাওয়া যায়নি
              </div>
            ) : (
              activeAgents.slice(0, 6).map((agent) => {
                // Adjust these field names to match your real AgentProfile type.
                const a = agent as unknown as Record<string, unknown>;
                const name = String(a.name ?? a.fullName ?? 'এজেন্ট');
                const area = String(a.area ?? a.location ?? a.upazila ?? '');
                return (
                  <div
                    key={agent.id}
                    className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-sm transition hover:shadow-md sm:p-3"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-base font-black text-emerald-700 sm:h-12 sm:w-12 sm:text-lg">
                      {name.charAt(0)}
                    </span>
                    <p className="mt-1.5 line-clamp-1 text-[11px] font-bold text-slate-800 sm:mt-2 sm:text-xs">{name}</p>
                    {area && (
                      <p className="mt-0.5 flex items-center gap-0.5 text-[9px] text-slate-400 sm:gap-1 sm:text-[10px]">
                        <MapPin className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                        <span className="line-clamp-1">{area}</span>
                      </p>
                    )}
                    <span className="mt-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 sm:mt-2 sm:gap-1 sm:px-2 sm:text-[10px]">
                      <BadgeCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      যাচাইকৃত
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Registration CTAs */}
          <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white sm:h-12 sm:w-12">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-black text-slate-900 sm:text-sm">এজেন্ট হিসেবে যুক্ত হোন</h3>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
                  অভিজ্ঞ ও দক্ষ ব্যক্তিরা রেজিস্ট্রেশন করে নিজ এলাকায় সেবা দিন ও আয় করুন।
                </p>
              </div>
              <Link
                href="/register?role=agent"
                style={{ backgroundColor: BRAND }}
                className="shrink-0 rounded-full px-3 py-2 text-[11px] font-bold text-white shadow-md transition active:scale-95 hover:brightness-110 sm:px-4 sm:py-2.5 sm:text-xs"
              >
                রেজিস্ট্রেশন
              </Link>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white p-3.5 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white sm:h-12 sm:w-12">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-black text-slate-900 sm:text-sm">ডাক্তার হিসেবে যুক্ত হোন</h3>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
                  অনলাইন পরামর্শ দিতে আগ্রহী ডাক্তাররা আমাদের প্ল্যাটফর্মে রেজিস্ট্রেশন করুন।
                </p>
              </div>
              <Link
                href="/register?role=doctor"
                className="shrink-0 rounded-full bg-sky-600 px-3 py-2 text-[11px] font-bold text-white shadow-md transition active:scale-95 hover:brightness-110 sm:px-4 sm:py-2.5 sm:text-xs"
              >
                রেজিস্ট্রেশন
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HEALTH TIPS
      ========================================================= */}
      <section id="tips" className="scroll-mt-28 px-3.5 py-6 sm:px-6 lg:scroll-mt-24 lg:px-8">
        <div className="mx-auto grid max-w-7.5xl gap-4 sm:gap-5 lg:grid-cols-[.85fr_1.4fr]">
          {/* Pregnancy tips */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-black text-emerald-800 sm:text-lg">
              <Heart className="h-4 w-4 fill-emerald-600 text-emerald-600 sm:h-5 sm:w-5" />
              গর্ভবতী মায়েদের জন্য বিশেষ টিপস
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">সুস্থ মা, সুস্থ শিশু – একটি নিরাপদ আগামী</p>

            <div className="mt-3 grid grid-cols-[100px_1fr] items-center gap-3 sm:mt-4 sm:grid-cols-[150px_1fr]">
              <div className="relative h-40 overflow-hidden rounded-2xl bg-emerald-100 sm:h-52">
                <SafeImage
                  src={PREGNANT_MOTHER_IMG}
                  alt="গর্ভবতী মা"
                  sizes="150px"
                  className="object-cover"
                />
              </div>
              <ul className="space-y-2.5 sm:space-y-3">
                {PREGNANCY_TIPS.map((tip) => (
                  <li key={tip} className="flex gap-1.5 text-[11.5px] leading-[18px] text-slate-700 sm:gap-2 sm:text-xs sm:leading-5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/health-tips"
              style={{ backgroundColor: BRAND }}
              className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 hover:brightness-110 sm:mt-4 sm:px-5"
            >
              আরও টিপস পড়ুন
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* First aid tips + box */}
          <div className="grid gap-4 rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4 sm:gap-5 sm:p-5 md:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-black text-sky-800 sm:text-lg">
                <Bandage className="h-4 w-4 sm:h-5 sm:w-5" />
                প্রাথমিক চিকিৎসা টিপস
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                ছোটখাটো সমস্যায় ঘরেই নিন প্রাথমিক ব্যবস্থা
              </p>
              <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3.5">
                {FIRST_AID_TIPS.map(({ text, icon: Icon }) => (
                  <li key={text} className="flex items-start gap-2.5 text-[11.5px] leading-[18px] text-slate-700 sm:gap-3 sm:text-xs sm:leading-5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/health-tips"
                style={{ backgroundColor: BRAND }}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 hover:brightness-110 sm:mt-5 sm:px-5"
              >
                সব টিপস দেখুন
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-3.5 shadow-sm sm:p-4">
              <h3 className="flex items-center gap-2 text-[13px] font-black text-emerald-800 sm:text-sm">
                <ShieldCheck className="h-4 w-4" />
                প্রাথমিক চিকিৎসা কম্বো বক্স
              </h3>
              <div className="mt-3 grid grid-cols-[96px_1fr] gap-3 sm:grid-cols-[110px_1fr]">
                <div className="relative h-28 overflow-hidden rounded-xl bg-emerald-50 sm:h-32">
                  <SafeImage
                    src={FIRST_AID_BOX_IMG}
                    alt="DakDin First Aid Combo Box"
                    sizes="110px"
                    className="object-contain p-1"
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-600 text-white">
                        <Heart className="h-9 w-9 fill-white sm:h-10 sm:w-10" />
                      </div>
                    }
                  />
                </div>
                <ul className="space-y-1.5">
                  {FIRST_AID_BOX.map((item) => (
                    <li key={item} className="flex gap-1.5 text-[10.5px] leading-4 text-slate-600 sm:text-[11px]">
                      <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3.5 flex items-center justify-between sm:mt-4">
                <p className="text-xl font-black text-slate-900 sm:text-2xl">৳ 499</p>
                <Link
                  href="/first-aid-box"
                  style={{ backgroundColor: BRAND }}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 hover:brightness-110 sm:px-4"
                >
                  এখনই কিনুন
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          NEWS & HEALTH UPDATES
      ========================================================= */}
      <section className="px-3.5 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7.5xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-xl">
              <Megaphone className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
              সর্বশেষ খবর ও হেলথ আপডেট
            </h2>
            <Link
              href="/news"
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 sm:gap-1.5 sm:text-sm"
            >
              সব দেখুন
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
            {NEWS.map((item) => (
              <Link
                key={item.title}
                href="/news"
                className="group flex gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition active:scale-[0.99] hover:shadow-lg sm:p-2.5 lg:flex-col lg:p-0"
              >
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-emerald-50 sm:h-24 sm:w-24 lg:h-32 lg:w-full lg:rounded-b-none">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    sizes="(max-width: 1024px) 96px, 20vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600">
                        <Newspaper className="h-7 w-7 sm:h-8 sm:w-8" />
                      </div>
                    }
                  />
                </div>
                <div className="min-w-0 py-0.5 lg:p-3">
                  <h3 className="line-clamp-2 text-xs font-bold leading-[18px] text-slate-800 sm:line-clamp-3 sm:text-[13px] sm:leading-5">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-400 sm:mt-1.5 sm:text-[11px]">{item.date}</p>
                  <span
                    className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold sm:mt-2 sm:px-2 sm:text-[10px] ${item.tagColor}`}
                  >
                    {item.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          EMERGENCY + LOCATION (just above footer)
      ========================================================= */}
      <section id="emergency" className="scroll-mt-28 px-3.5 py-6 sm:px-6 sm:py-10 lg:scroll-mt-24 lg:px-8">
        <div className="mx-auto grid max-w-7.5xl gap-4 sm:gap-5 lg:grid-cols-[1fr_1.05fr]">
          {/* Emergency contacts */}
          <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-black text-rose-600 sm:text-lg">
              <Siren className="h-4 w-4 sm:h-5 sm:w-5" />
              জরুরি যোগাযোগ
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">জরুরি প্রয়োজনে দ্রুত যোগাযোগ করুন</p>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
              {EMERGENCY.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.number}
                    href={`tel:${item.number}`}
                    className="flex items-center gap-2 rounded-2xl border border-white bg-white p-2.5 shadow-sm transition active:scale-95 hover:shadow-md sm:gap-3 sm:p-3.5"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white sm:h-12 sm:w-12 ${item.color}`}
                    >
                      <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-semibold text-slate-700 sm:text-xs">
                        {item.name}
                      </span>
                      <span className="block text-lg font-black leading-tight text-slate-900 sm:text-2xl">
                        {item.number}
                      </span>
                      <span className="hidden truncate text-[11px] text-slate-500 sm:block">
                        {item.note}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div
            id="about"
            className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5"
          >
            <h2 className="flex items-center gap-2 text-[15px] font-black text-emerald-800 sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              আমাদের অবস্থান
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
              ময়মনসিংহ জেলার সকল ইউনিয়নে আমরা সেবা দিচ্ছি।
            </p>

            <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-[1.1fr_1fr]">
              <div className="relative h-40 overflow-hidden rounded-2xl border border-white bg-slate-100 shadow-sm sm:h-auto sm:min-h-[220px]">
                <iframe
                  title="ডাকদিন কার্যালয়ের মানচিত্র"
                  src={MAP_EMBED}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>

              <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-3.5 shadow-sm sm:gap-3 sm:p-4">
                <div className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">ঠিকানা</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-slate-600 sm:text-xs">
                      ডাকদিন (কেন্দ্রীয় কার্যালয়)
                      <br />
                      ময়মনসিংহ, বাংলাদেশ
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">অফিস সময়</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-slate-600 sm:text-xs">
                      সকাল ৯:০০ – রাত ৯:০০
                      <br />
                      (প্রতিদিন)
                    </p>
                  </div>
                </div>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-600 py-2.5 text-xs font-bold text-emerald-700 transition active:scale-95 hover:bg-emerald-600 hover:text-white"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  ওপেন ম্যাপে দেখুন
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER  (extra bottom padding on mobile for the tab bar)
      ========================================================= */}
      <footer
        id="contact"
        className="px-4 pb-[110px] pt-9 text-emerald-50/80 sm:px-6 sm:pt-12 lg:px-8 lg:pb-6"
        style={{ backgroundColor: '#0a4030' }}
      >
        <div className="mx-auto grid max-w-7.5xl grid-cols-2 gap-x-6 gap-y-7 sm:gap-10 md:grid-cols-[1.3fr_1.2fr_.7fr_.8fr_1.1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-block rounded-2xl bg-white px-3 py-2 shadow-lg sm:px-4 sm:py-2.5"
              aria-label="DakDin হোম"
            >
              <Image
                src="/dakdinlogo.png"
                alt="Dakdin - ডাকদীন সেবা নিন"
                width={243}
                height={88}
                sizes="170px"
                draggable={false}
                className="h-9 w-auto object-contain sm:h-12"
              />
            </Link>
          </div>

          <div className="col-span-2 border-emerald-100/15 md:col-span-1 md:border-l md:pl-8">
            <p className="text-base font-bold leading-snug text-white sm:text-lg">
              সুস্থ সমাজ, সুখী পরিবার
              <br />
              ডাকদিন সবসময় আপনার পাশে
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-white sm:text-base">দ্রুত লিংক</h4>
            <div className="mt-3 space-y-2 text-[13px] sm:mt-4 sm:space-y-2.5 sm:text-sm">
              <a href="#top" className="block hover:text-white">হোম</a>
              <a href="#services" className="block hover:text-white">সেবা সমূহ</a>
              <a href="#online-doctor" className="block hover:text-white">অনলাইন ডাক্তার</a>
              <a href="#emergency" className="block hover:text-white">জরুরি সেবা</a>
              <a href="#tips" className="block hover:text-white">স্বাস্থ্য টিপস</a>
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-bold text-white sm:text-base">আমাদের সম্পর্কে</h4>
            <div className="mt-3 space-y-2 text-[13px] sm:mt-4 sm:space-y-2.5 sm:text-sm">
              <Link href="/about" className="block hover:text-white">আমাদের সম্পর্কে</Link>
              <a href="#contact" className="block hover:text-white">যোগাযোগ</a>
              <Link href="/privacy" className="block hover:text-white">গোপনীয়তা নীতি</Link>
              <Link href="/terms" className="block hover:text-white">ব্যবহার শর্তাবলী</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-sm font-bold text-white sm:text-base">যোগাযোগ</h4>
            <div className="mt-3 space-y-2.5 text-[13px] sm:mt-4 sm:space-y-3 sm:text-sm">
              <a href={`tel:${HOTLINE.tel}`} className="flex items-center gap-2.5 hover:text-white">
                <Phone className="h-4 w-4 text-emerald-300" />
                {HOTLINE.display}
              </a>
              <a href="mailto:info@dakdin.com" className="flex items-center gap-2.5 hover:text-white">
                <Mail className="h-4 w-4 text-emerald-300" />
                info@dakdin.com
              </a>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-300" />
                ময়মনসিংহ, বাংলাদেশ
              </div>
              <div className="flex gap-2.5 pt-1">
                {[
                  { label: 'Facebook', glyph: 'f', href: 'https://facebook.com' },
                  { label: 'YouTube', glyph: '▶', href: 'https://youtube.com' },
                  { label: 'Instagram', glyph: '◎', href: 'https://instagram.com' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
                  >
                    {s.glyph}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7.5xl flex-col justify-between gap-2 border-t border-white/10 pt-4 text-[11px] sm:mt-10 sm:flex-row sm:gap-3 sm:pt-5 sm:text-xs">
          <p>© 2026 DakDin. সর্বস্বত্ব সংরক্ষিত।</p>
          <p>
            Made with <span className="text-rose-400">♥</span> for a healthier community
          </p>
        </div>
      </footer>

      {/* =========================================================
          BOTTOM TAB BAR — mobile app navigation (replaces the old
          sticky call button; the raised centre button is the call CTA)
      ========================================================= */}
      <nav
        aria-label="নিচের মেনু"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid h-[58px] max-w-md grid-cols-5 items-stretch">
          <a href="#top" className={tabClass(activeSection === 'top')}>
            <Home className="h-5 w-5" />
            হোম
          </a>
          <a href="#services" className={tabClass(activeSection === 'services')}>
            <LayoutGrid className="h-5 w-5" />
            সেবা
          </a>

          {/* Raised call button */}
          <a
            href={`tel:${HOTLINE.tel}`}
            aria-label="হটলাইনে ফোন করুন"
            className="relative flex flex-col items-center justify-end gap-0.5 pb-1.5 text-[10px] font-bold text-emerald-800 transition active:scale-95"
          >
            <span
              style={{ backgroundColor: BRAND }}
              className="absolute -top-5 flex h-[52px] w-[52px] items-center justify-center rounded-full text-white shadow-lg shadow-emerald-900/30 ring-4 ring-white"
            >
              <Phone className="h-6 w-6" />
            </span>
            কল
          </a>

          <a href="#online-doctor" className={tabClass(activeSection === 'online-doctor')}>
            <Stethoscope className="h-5 w-5" />
            ডাক্তার
          </a>
          <Link href="/login" className={tabClass(false)}>
            <UserRound className="h-5 w-5" />
            অ্যাকাউন্ট
          </Link>
        </div>
      </nav>

      {/* Booking request modal — opened from the search bar / service cards.
          No agent is selected here; the Super Admin assigns one after review. */}
      {bookingService && (
        <BookNowModal
          initialService={bookingService}
          initialDoctor={bookingDoctor}
          onClose={() => {
            setBookingService(null);
            setBookingDoctor(null);
          }}
        />
      )}

      {/* Transport booking modal */}
      {transportVehicle && (
        <TransportBookingModal
          vehicleType={transportVehicle}
          onClose={() => setTransportVehicle(null)}
        />
      )}
    </main>
  );
}