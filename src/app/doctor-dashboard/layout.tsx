import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const doctorToken = cookies().get('doctorToken')?.value;

  // `doctorToken` is the actual credential (middleware enforces it too). The
  // `doctor` cookie only carries a profile snapshot for instant rendering and
  // must never gate access — it can be absent (legacy/oversized session), in
  // which case the client layout restores the profile from /api/doctors/me.
  if (!doctorToken) {
    redirect('/doctor-login');
  }

  return <>{children}</>;
}
