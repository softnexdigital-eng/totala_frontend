import {
  Search, Stethoscope, UserRound, Pill, Droplet, FlaskConical,
  Bandage, HeartPulse, FileText, Car, Siren, Flame, Ambulance, Phone,
  ShieldCheck, Heart, Thermometer, Video, Star, Building2, HeartHandshake,
  Users, Baby, Eye, Brain, Smile, Bone, Activity, Ear, MessageCircle,
  type LucideIcon,
} from 'lucide-react';

/* ===================== BRAND / CONFIG ===================== */
export const BRAND = '#0b5d3b';
export const HOTLINE = { display: '01974920082', tel: '+8801974920082' };
export const NO_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
export const MARQUEE_H = 30;
export const CONTAINER = 'mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6';
export const LOADER_MAX_MS = 8000;

/* ===================== IMAGES ===================== */
export const HERO_BG = '/images/hero-bg.png';
export const PREGNANT_MOTHER_IMG =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTN81imzCSGPN9B6PDUDIFkyP8SsqmMBlAzrIzVzC3ung&s=10';
export const FIRST_AID_BOX_IMG =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStPEJuvpU9ugu3IKz_NQ5m6ui-zn69mSvzvlBmwTfjtQ&s=10';

/* ===================== MAP ===================== */
export const MAP_EMBED =
  'https://www.openstreetmap.org/export/embed.html?bbox=90.36%2C24.72%2C90.45%2C24.79&layer=mapnik&marker=24.7539%2C90.4073';
export const MAP_LINK =
  'https://www.openstreetmap.org/?mlat=24.7539&mlon=90.4073#map=14/24.7539/90.4073';

/* ===================== TYPES ===================== */
export type Tone = 'green' | 'blue' | 'red' | 'teal' | 'amber' | 'violet';

export interface ServiceItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
  image: string;
  badge: string;
  pos: string;
}

export interface OnlineDoctor {
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
}

/* ===================== TONE PALETTE ===================== */
export const TONES: Record<Tone, { card: string; icon: string; arrow: string; badge: string }> = {
  green:  { card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white', icon: 'bg-emerald-600', arrow: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  blue:   { card: 'border-sky-100 bg-gradient-to-br from-sky-50 to-white',         icon: 'bg-sky-500',     arrow: 'text-sky-700',     badge: 'bg-sky-100 text-sky-700' },
  red:    { card: 'border-rose-100 bg-gradient-to-br from-rose-50 to-white',       icon: 'bg-rose-500',    arrow: 'text-rose-600',    badge: 'bg-rose-100 text-rose-700' },
  teal:   { card: 'border-teal-100 bg-gradient-to-br from-teal-50 to-white',       icon: 'bg-teal-600',    arrow: 'text-teal-700',    badge: 'bg-teal-100 text-teal-700' },
  amber:  { card: 'border-amber-100 bg-gradient-to-br from-amber-50 to-white',     icon: 'bg-amber-500',   arrow: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  violet: { card: 'border-violet-100 bg-gradient-to-br from-violet-50 to-white',   icon: 'bg-violet-600',  arrow: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700' },
};

/* ===================== HERO ACTIONS ===================== */
export const HERO_ACTIONS = [
  { key: 'doctor',    label: 'ডাক্তার দেখান',           sub: 'ভিডিও/ফোনে ডাক্তারের পরামর্শ',       icon: Stethoscope, color: 'bg-emerald-600', service: 'ডাক্তার অ্যাপয়েন্টমেন্ট' },
  { key: 'medicine',  label: 'ওষুধ চাই',                sub: 'প্রেসক্রিপশন অনুযায়ী ওষুধ সংগ্রহ',    icon: Pill,        color: 'bg-teal-600',    service: 'ওষুধ সংগ্রহ' },
  { key: 'ambulance', label: 'অ্যাম্বুলেন্স / পরিবহন',  sub: 'রোগী নিয়ে যাওয়ার সহায়তা',            icon: Ambulance,   color: 'bg-rose-500',    service: 'transport' },
] as const;

/* ===================== NAV ===================== */
export const NAV_LINKS = [
  { label: 'হোম',            href: '#top' },
  { label: 'সেবা সমূহ',       href: '#services' },
  { label: 'অনলাইন ডাক্তার',  href: '#online-doctor' },
  { label: 'জরুরি সেবা',      href: '#emergency' },
  { label: 'স্বাস্থ্য টিপস',   href: '#tips' },
  { label: 'যোগাযোগ',         href: '#contact' },
];

export const NAV_CATEGORIES: {
  label: string;
  icon: LucideIcon;
  service?: string;
  href?: string;
  tint: string;
}[] = [
  { label: 'ডাক্তার',      icon: Stethoscope, service: 'ডাক্তার অ্যাপয়েন্টমেন্ট', tint: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'হাসপাতাল',     icon: Building2,   service: 'হাসপাতাল / ক্লিনিক',       tint: 'bg-sky-50 text-sky-700 border-sky-100' },
  { label: 'ওষুধ',         icon: Pill,        service: 'ঔষধ / ফার্মেসি',           tint: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'টেস্ট',        icon: FlaskConical, service: 'ডায়াগনস্টিক',             tint: 'bg-violet-50 text-violet-700 border-violet-100' },
  { label: 'রক্ত',         icon: Droplet,     service: 'রক্ত / ব্লাড ব্যাংক',       tint: 'bg-rose-50 text-rose-600 border-rose-100' },
  { label: 'হোম সার্ভিস',  icon: HeartPulse,  service: 'স্বাস্থ্যসেবা',             tint: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'অ্যাম্বুলেন্স', icon: Car,         service: 'transport',                 tint: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'জরুরি',        icon: Siren,       href: '#emergency',                   tint: 'bg-rose-50 text-rose-600 border-rose-100' },
];

/* ===================== SERVICES ===================== */
export const SERVICES: ServiceItem[] = [
  { title: 'ডাক্তার / চিকিৎসা',    subtitle: 'অনলাইনে ডাক্তার পরামর্শ ও অ্যাপয়েন্টমেন্ট', icon: Stethoscope,  tone: 'green',  image: '/images/subjects/doctor-consultation.jpg', badge: 'অনলাইন পরামর্শ', pos: 'object-top' },
  { title: 'হাসপাতাল / ক্লিনিক',    subtitle: 'হাসপাতাল, ক্লিনিক ও রোগী সহায়তা',           icon: Building2,    tone: 'blue',   image: '/images/subjects/hospital.jpg',            badge: 'হাসপাতাল সহায়তা', pos: 'object-center' },
  { title: 'ঔষধ / ফার্মেসি',       subtitle: 'প্রেসক্রিপশন অনুযায়ী ওষুধ সংগ্রহ',             icon: Pill,         tone: 'green',  image: '/images/subjects/pharmacy.jpg',            badge: 'ওষুধ সংগ্রহ', pos: 'object-center' },
  { title: 'জরুরি সেবা',           subtitle: 'জরুরি সময়ে দ্রুত সহায়তা ও যোগাযোগ',          icon: Ambulance,    tone: 'red',    image: '/images/subjects/emergency.jpg',           badge: 'জরুরি সহায়তা', pos: 'object-center' },
  { title: 'ডায়াগনস্টিক',          subtitle: 'টেস্ট, ল্যাব ও রিপোর্ট সংগ্রহ',               icon: FlaskConical, tone: 'violet', image: '/images/subjects/diagnostic.jpg',          badge: 'টেস্ট ও রিপোর্ট', pos: 'object-center' },
  { title: 'রক্ত / ব্লাড ব্যাংক',   subtitle: 'রক্ত সংগ্রহ ও প্রয়োজনীয় সমন্বয়',            icon: Droplet,      tone: 'red',    image: '/images/subjects/blood.jpg',               badge: 'রক্ত সহায়তা', pos: 'object-center' },
  { title: 'স্বাস্থ্যসেবা',         subtitle: 'সালাইন, ইনজেকশন, ড্রেসিং ও BP চেক',           icon: HeartPulse,   tone: 'teal',   image: '/images/subjects/home-health.jpg',         badge: 'হোম সার্ভিস', pos: 'object-center' },
  { title: 'জরুরি পরিবহন',         subtitle: 'রোগী পরিবহন ও হাসপাতালে যাওয়ার সহায়তা',     icon: Car,          tone: 'amber',  image: '/images/subjects/ambulance.jpg',           badge: 'পরিবহন', pos: 'object-center' },
];

/* ===================== HEALTH SUBJECTS ===================== */
export const HEALTH_SUBJECTS = [
  { title: 'মা ও নারী স্বাস্থ্য',     desc: 'গর্ভাবস্থা, মাসিক, প্রসূতি ও নারী স্বাস্থ্য নিয়ে তথ্য ও পরামর্শ।', image: '/images/subjects/women-health.jpg', icon: Heart },
  { title: 'শিশু স্বাস্থ্য',           desc: 'শিশুর জ্বর, সর্দি-কাশি, পুষ্টি ও সাধারণ স্বাস্থ্য সম্পর্কে জানুন।',   image: '/images/subjects/child-health.jpg',  icon: UserRound },
  { title: 'হৃদযন্ত্র ও রক্তচাপ',       desc: 'হৃদস্বাস্থ্য, রক্তচাপ ও জীবনযাপন সম্পর্কে প্রাথমিক তথ্য।',        image: '/images/subjects/heart-health.jpg',  icon: HeartPulse },
  { title: 'চর্ম ও সাধারণ স্বাস্থ্য',   desc: 'ত্বক, দৈনন্দিন স্বাস্থ্য সমস্যা ও কখন চিকিৎসকের পরামর্শ নেবেন।', image: '/images/subjects/skin-health.jpg',   icon: ShieldCheck },
];

/* ===================== OPINIONS ===================== */
export const DISTINGUISHED_OPINIONS = [
  { name: 'বিশিষ্ট ব্যক্তির নাম', role: 'সমাজসেবক / উদ্যোক্তা',  text: 'মানুষের প্রয়োজনের সময়ে স্বাস্থ্যসেবার সঠিক পথ খুঁজে পেতে এমন একটি উদ্যোগ গুরুত্বপূর্ণ।', image: '/images/people/person-1.jpg' },
  { name: 'বিশিষ্ট ব্যক্তির নাম', role: 'শিক্ষাবিদ / পেশাজীবী',   text: 'স্থানীয় মানুষের জন্য প্রযুক্তির মাধ্যমে স্বাস্থ্যসেবা আরও সহজ করার উদ্যোগ প্রশংসনীয়।', image: '/images/people/person-2.jpg' },
  { name: 'বিশিষ্ট ব্যক্তির নাম', role: 'জনপ্রতিনিধি / সমাজকর্মী', text: 'সঠিক তথ্য ও প্রয়োজনীয় সহায়তা মানুষকে দ্রুত সঠিক সেবার কাছে পৌঁছে দিতে পারে।', image: '/images/people/person-3.jpg' },
];

export const DOCTOR_OPINIONS = [
  { name: 'ডা. আপনার নাম', specialty: 'মেডিসিন বিশেষজ্ঞ',       text: 'অনলাইন পরামর্শ রোগীকে প্রাথমিকভাবে সঠিক দিকনির্দেশনা দিতে এবং প্রয়োজন হলে দ্রুত চিকিৎসা নিতে সাহায্য করতে পারে।', image: '/images/doctors/doctor-4.jpg' },
  { name: 'ডা. আপনার নাম', specialty: 'গাইনি ও প্রসূতি বিশেষজ্ঞ', text: 'বিশেষ করে ফলোআপ ও সাধারণ স্বাস্থ্য পরামর্শের ক্ষেত্রে অনলাইন consultation রোগীর জন্য সময় ও যাতায়াতের চাপ কমাতে পারে।', image: '/images/doctors/doctor-5.jpg' },
  { name: 'ডা. আপনার নাম', specialty: 'শিশু রোগ বিশেষজ্ঞ',       text: 'অভিভাবকরা শিশুর সাধারণ সমস্যায় প্রাথমিক পরামর্শ নিয়ে কখন সরাসরি চিকিৎসা প্রয়োজন তা বুঝতে পারেন।', image: '/images/doctors/doctor-6.jpg' },
];

/* ===================== HUB SERVICES ===================== */
export const HUB_SERVICES = [
  { title: 'ডাক্তার বুকিং',              desc: 'এজেন্ট আপনার হয়ে অনলাইনে ডাক্তার বুক করে দেন।',          icon: Stethoscope,    tone: 'green' as Tone, image: '/images/subjects/hub-doctor.jpg', pos: 'object-top',    book: 'ডাক্তার অ্যাপয়েন্টমেন্ট' },
  { title: 'অনলাইন পরামর্শে সহায়তা',    desc: 'ফোন/ভিডিও কলে ডাক্তারের সাথে কথা বলতে পাশে থাকেন।',       icon: Video,          tone: 'blue' as Tone,  image: '/images/subjects/emergency.jpg',  pos: 'object-center', book: 'অনলাইন ডাক্তার' },
  { title: 'ফুল অ্যাসিস্ট্যান্স',        desc: 'ডাক্তার দেখানো থেকে ওষুধ ও রিপোর্ট পর্যন্ত পূর্ণ সহায়তা।', icon: HeartHandshake, tone: 'teal' as Tone,  image: '/images/subjects/hub-assist.jpg', pos: 'object-center', book: 'ফুল অ্যাসিস্ট্যান্স' },
  { title: 'অন্যান্য সেবা',              desc: 'রক্ত সংগ্রহ, সালাইন, ইনজেকশন ও পেশেন্ট ট্রান্সপোর্ট।',   icon: Ambulance,      tone: 'amber' as Tone, image: '/images/subjects/hub-other.jpg',  pos: 'object-center', book: 'অন্যান্য সেবা' },
];

/* ===================== EMERGENCY ===================== */
export const EMERGENCY = [
  { name: 'পুলিশ (জরুরি)',            number: '999',   note: 'জাতীয় জরুরি সেবা',        icon: ShieldCheck, color: 'bg-blue-900' },
  { name: 'ফায়ার সার্ভিস (জরুরি)',    number: '16163', note: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স', icon: Flame, color: 'bg-red-600' },
  { name: 'অ্যাম্বুলেন্স (জরুরি)',      number: '1990',  note: 'জরুরি অ্যাম্বুলেন্স সেবা',  icon: Ambulance,   color: 'bg-blue-800' },
  { name: 'স্বাস্থ্য বাতায়ন (হটলাইন)', number: '16263', note: 'স্বাস্থ্য সেবা ও পরামর্শ', icon: Phone,       color: 'bg-emerald-600' },
];

/* ===================== TIPS ===================== */
export const PREGNANCY_TIPS = [
  'পর্যাপ্ত পানি পান করুন',
  'নিয়মিত স্বাস্থ্য পরীক্ষা করুন',
  'পুষ্টিকর খাবার গ্রহণ করুন',
  'যেকোনো সমস্যা হলে ডাক্তারের পরামর্শ নিন',
];

export const FIRST_AID_TIPS = [
  { text: 'জ্বর হলে বিশ্রাম নিন ও পানি পান করুন', icon: Thermometer },
  { text: 'কাটা-ছেঁড়ায় পরিষ্কার পানি দিয়ে ধুয়ে ব্যান্ডেজ করুন', icon: Bandage },
  { text: 'পেট খারাপ হলে ORS পান করুন', icon: Droplet },
  { text: 'হালকা মাথা ঘোরা/দুর্বলতায় বিশ্রাম নিন', icon: Heart },
];

export const FIRST_AID_BOX = [
  'নাপা (জ্বর/ব্যথার জন্য)',
  'ব্যান্ডেজ ও গজ',
  'ORS স্যালাইন',
  'প্যারাসিটামল/অ্যান্টাসিড (সাধারণ)',
  'ডিজিটাল থার্মোমিটার (ঐচ্ছিক)',
];

/* ===================== NEWS ===================== */
export const NEWS = [
  { title: 'গর্ভাবস্থায় পুষ্টি ও যত্ন: যা মনে রাখা দরকার', date: '২৩ সেপ্টেম্বর ২০২৬', tag: 'মাতৃস্বাস্থ্য',      tagColor: 'bg-emerald-100 text-emerald-700', image: '/images/news-1.jpg' },
  { title: 'ডেঙ্গু প্রতিরোধে করণীয় ও সতর্কতা',           date: '২২ সেপ্টেম্বর ২০২৬', tag: 'সতর্কতা',          tagColor: 'bg-rose-100 text-rose-700',       image: '/images/news-2.jpg' },
  { title: 'শিশু সর্দি-কাশি: ঘরে বসে প্রাথমিক যত্ন',      date: '১৮ সেপ্টেম্বর ২০২৬', tag: 'শিশু স্বাস্থ্য',     tagColor: 'bg-sky-100 text-sky-700',         image: '/images/news-3.jpg' },
  { title: 'সুস্থ থাকার জন্য দৈনন্দিন খাবার তালিকা',      date: '১৫ সেপ্টেম্বর ২০২৬', tag: 'পুষ্টি ও স্বাস্থ্য', tagColor: 'bg-lime-100 text-lime-700',       image: '/images/news-4.jpg' },
  { title: 'বাড়িতে প্রসব পরবর্তী মায়ের যত্ন',            date: '১০ সেপ্টেম্বর ২০২৬', tag: 'মাতৃস্বাস্থ্য',      tagColor: 'bg-emerald-100 text-emerald-700', image: '/images/news-5.jpg' },
];

/* ===================== ONLINE STEPS ===================== */
export const ONLINE_STEPS = [
  { title: 'সেবা বা ডাক্তার বাছুন',      desc: 'সার্চ বার থেকে "ডাক্তার অ্যাপয়েন্টমেন্ট" সিলেক্ট করুন।', icon: Search },
  { title: 'বুকিং রিকোয়েস্ট দিন',       desc: 'নাম, ফোন নম্বর ও সমস্যার কথা লিখে রিকোয়েস্ট পাঠান।',   icon: FileText },
  { title: 'আমরা যোগাযোগ করব',           desc: 'আমাদের টিম আপনাকে ফোন করে ডাক্তারের সময় নিশ্চিত করবে।', icon: Phone },
  { title: 'ভিডিও/ফোনে পরামর্শ নিন',    desc: 'নির্ধারিত সময়ে ঘরে বসেই ডাক্তারের সাথে কথা বলুন।',      icon: Video },
];

/* ===================== DOCTOR CATEGORIES ===================== */
export const DOCTOR_CATEGORIES: { label: string; icon: LucideIcon; tone: Tone; keys: string[] }[] = [
  { label: 'মেডিসিন',          icon: Stethoscope, tone: 'green',  keys: ['medicine', 'মেডিসিন', 'physician', 'general', 'সাধারণ'] },
  { label: 'গাইনি ও প্রসূতি',  icon: Heart,       tone: 'red',    keys: ['gyn', 'obs', 'গাইনি', 'প্রসূতি', 'স্ত্রী'] },
  { label: 'শিশু রোগ',         icon: Baby,        tone: 'blue',   keys: ['pediatric', 'paediatric', 'child', 'শিশু'] },
  { label: 'হৃদরোগ',           icon: HeartPulse,  tone: 'red',    keys: ['cardio', 'heart', 'হৃদ', 'হার্ট'] },
  { label: 'চর্ম ও যৌন',       icon: ShieldCheck, tone: 'teal',   keys: ['skin', 'derma', 'চর্ম', 'ত্বক', 'যৌন'] },
  { label: 'হাড়-জোড়া',       icon: Bone,        tone: 'amber',  keys: ['ortho', 'bone', 'অর্থো', 'হাড়'] },
  { label: 'নাক-কান-গলা',      icon: Ear,         tone: 'violet', keys: ['ent', 'নাক', 'কান', 'গলা'] },
  { label: 'চক্ষু',            icon: Eye,         tone: 'blue',   keys: ['eye', 'ophthal', 'চক্ষু', 'চোখ'] },
  { label: 'দন্ত',             icon: Smile,       tone: 'teal',   keys: ['dent', 'দন্ত', 'দাঁত'] },
  { label: 'স্নায়ু ও মস্তিষ্ক', icon: Brain,       tone: 'violet', keys: ['neuro', 'স্নায়ু', 'নিউরো', 'মস্তিষ্ক'] },
  { label: 'মানসিক রোগ',       icon: MessageCircle, tone: 'green', keys: ['psych', 'মানসিক', 'মনোরোগ'] },
  { label: 'ডায়াবেটিস',       icon: Activity,    tone: 'amber',  keys: ['diabet', 'endocrin', 'ডায়াবেটিস', 'হরমোন'] },
];

export const matchCategory = (
  specialty: string,
  cat: (typeof DOCTOR_CATEGORIES)[number],
) => {
  const sp = specialty.toLowerCase();
  return !!sp && cat.keys.some((k) => sp.includes(k));
};

/* ===================== REVIEWS ===================== */
export const DOCTOR_REVIEWS = [
  { name: 'রহিমা বেগম',   place: 'ত্রিশাল, ময়মনসিংহ',    text: 'বাড়িতে বসেই ডাক্তারের সাথে কথা বলতে পেরেছি। সময় ও যাতায়াত দুটোই বেঁচেছে।', rating: 5 },
  { name: 'আব্দুল করিম', place: 'ফুলবাড়িয়া, ময়মনসিংহ', text: 'অনলাইন পরামর্শ নেওয়ার প্রক্রিয়াটা সহজ ছিল এবং প্রয়োজনে টিম পাশে ছিল।',  rating: 5 },
  { name: 'সালমা খাতুন',  place: 'গফরগাঁও, ময়মনসিংহ',   text: 'ডাক্তার ধৈর্য নিয়ে সমস্যা শুনেছেন এবং পরবর্তী করণীয় বুঝিয়ে দিয়েছেন।', rating: 5 },
];

/* ===================== ANNOUNCEMENTS ===================== */
export const ANNOUNCEMENTS = [
  '🚧 সাইটটি বর্তমানে আন্ডার ডেভেলপমেন্ট',
  '✅ চালু আছে: ডাক্তার অ্যাপয়েন্টমেন্ট, রোগী সহায়তা, ডাক্তার বুকিং, অ্যাম্বুলেন্স সার্ভিস',
  '🎉 আগামী ১ জানুয়ারি শুভ উদ্বোধন',
  '📍 এজেন্ট নিয়োগ চলছে — ইউনিয়ন ভিত্তিক',
];

/* ===================== HELPERS ===================== */
export const sanitizeQuery = (v: string) =>
  v.replace(/[<>{}[\]\\`$]/g, '').slice(0, 60);

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;