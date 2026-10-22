import { cookies } from 'next/headers';

export async function getAuthToken(): Promise<string | undefined> {
  const adminToken = cookies().get('token')?.value;
  if (adminToken) return adminToken;

  const agentToken = cookies().get('agentToken')?.value;
  if (agentToken) return agentToken;

  const doctorToken = cookies().get('doctorToken')?.value;
  if (doctorToken) return doctorToken;

  return undefined;
}
