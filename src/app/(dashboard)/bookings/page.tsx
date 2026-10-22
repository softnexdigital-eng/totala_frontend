'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatBDT, paymentStatusColor, paymentStatusLabel } from '@/lib/payments';

interface Booking {
  id: string;
  patientName: string;
  patientPhone: string;
  patientAddress?: string;
  serviceType: string;
  serviceNeeded?: string;
  doctorId?: string;
  doctor?: { name: string; specialization: string; hospital?: string };
  hospital?: string;
  date: string;
  time: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  agentId?: string;
  agent?: { name: string };
  /** Payment snapshot recorded by the landing-page gateway checkout. */
  totalServiceCharge?: number;
  minRequiredPayment?: number;
  amountPaid?: number;
  remainingDue?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  /** Freeze workflow: previous task payment awaiting Super Admin "End". */
  isFrozen?: boolean;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
    fetchAgents();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleApprove = async (bookingId: string, agentId?: string) => {
    try {
      const body: any = { status: 'APPROVED' };
      if (agentId) body.agentId = agentId;

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Booking approved and task created');
        fetchBookings();
      } else {
        toast.error(result.message || 'Failed to approve booking');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Booking rejected');
        fetchBookings();
      } else {
        toast.error(result.message || 'Failed to reject booking');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleAssignAgent = async (bookingId: string, agentId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Agent assigned successfully');
        fetchBookings();
      } else {
        toast.error(result.message || 'Failed to assign agent');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7.5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Online Bookings</h1>
        <p className="text-gray-600 mt-1">
          Manage customer online bookings and agent assignments
        </p>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{booking.patientName}</p>
                        {booking.patientAddress && (
                          <p className="text-sm text-gray-500">{booking.patientAddress}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{booking.patientPhone}</td>
                    <td className="px-6 py-4 text-sm">
                      {booking.serviceType || booking.serviceNeeded || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-emerald-700">
                          {formatBDT(booking.amountPaid || 0)}
                          {booking.totalServiceCharge ? (
                            <span className="text-xs font-normal text-gray-500">
                              {' '}/ {formatBDT(booking.totalServiceCharge)}
                            </span>
                          ) : null}
                        </span>
                        {(booking.remainingDue || 0) > 0 && (
                          <span className="text-xs text-rose-600">
                            Due {formatBDT(booking.remainingDue)}
                          </span>
                        )}
                        <span
                          className={`px-2 self-start inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColor(
                            booking.paymentStatus
                          )}`}
                        >
                          {paymentStatusLabel(booking.paymentStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.agent ? booking.agent.name : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleApprove(booking.id, e.target.value);
                                }
                              }}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="" disabled>
                                Approve with Agent
                              </option>
                              {agents.map((agent) => (
                                <option key={agent.id} value={agent.id} disabled={agent.isFrozen}>
                                  {agent.name}
                                  {agent.isFrozen ? ' — Freeze' : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleReject(booking.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'APPROVED' && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignAgent(booking.id, e.target.value);
                              }
                            }}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="" disabled>
                              Reassign Agent
                            </option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id} disabled={agent.isFrozen}>
                                {agent.name}
                                {agent.isFrozen ? ' — Freeze' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                        {(booking.status === 'ASSIGNED' || booking.status === 'COMPLETED') && (
                          <span className="text-xs text-gray-500">Task created</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
