'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface TransportBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleType: string;
  fromDestination: string;
  toDestination: string;
  travelDate: string;
  travelType: string;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  driverName?: string;
  driverPhone?: string;
  carType?: string;
  carColor?: string;
  carNumber?: string;
  rentFee?: number;
  approvedAt?: string;
  createdAt: string;
}

interface TransportPricing {
  id: string;
  vehicleType: string;
  label: string;
  price: number;
}

export default function TransportPage() {
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [pricings, setPricings] = useState<TransportPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<TransportBooking | null>(null);
  const [pricingForm, setPricingForm] = useState({
    vehicleType: 'ambulance',
    label: '',
    price: '',
  });
  const [approvalForm, setApprovalForm] = useState({
    driverName: '',
    driverPhone: '',
    carType: '',
    carColor: '',
    carNumber: '',
    rentFee: '',
  });

  useEffect(() => {
    fetchBookings();
    fetchPricings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/transport/bookings/list');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch transport bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricings = async () => {
    try {
      const response = await fetch('/api/transport/pricing');
      const data = await response.json();
      if (data.success) {
        setPricings(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch pricings');
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/transport/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleType: pricingForm.vehicleType,
          label: pricingForm.label,
          price: Number(pricingForm.price),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Pricing saved successfully');
        setShowPricingForm(false);
        setPricingForm({ vehicleType: 'ambulance', label: '', price: '' });
        fetchPricings();
      } else {
        toast.error(result.message || 'Failed to save pricing');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleApprove = async (booking: TransportBooking) => {
    try {
      const response = await fetch(`/api/transport/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Booking approved');
        setEditingBooking(null);
        setApprovalForm({
          driverName: '',
          driverPhone: '',
          carType: '',
          carColor: '',
          carNumber: '',
          rentFee: '',
        });
        fetchBookings();
      } else {
        toast.error(result.message || 'Failed to approve booking');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    try {
      const response = await fetch(`/api/transport/bookings/${bookingId}/reject`, {
        method: 'PUT',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Booking rejected');
        fetchBookings();
      } else {
        toast.error(result.message || 'Failed to reject booking');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleSendInvoice = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/transport/bookings/${bookingId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Invoice sent successfully');
      } else {
        toast.error(result.message || 'Failed to send invoice');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7.5xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transport Bookings</h1>
          <p className="text-gray-600 mt-1">Manage transport service bookings and pricing</p>
        </div>
        <button
          onClick={() => setShowPricingForm(!showPricingForm)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {showPricingForm ? 'Hide Pricing' : 'Manage Pricing'}
        </button>
      </div>

      {/* Pricing Management */}
      {showPricingForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Transport Pricing</h2>
          <form onSubmit={handleSavePricing} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle Type</label>
              <select
                value={pricingForm.vehicleType}
                onChange={(e) => setPricingForm({ ...pricingForm, vehicleType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="ambulance">Ambulance</option>
                <option value="hais">Hais</option>
                <option value="private_car">Private Car</option>
                <option value="cng">CNG</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Label</label>
              <input
                type="text"
                required
                value={pricingForm.label}
                onChange={(e) => setPricingForm({ ...pricingForm, label: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="e.g. Standard Ambulance"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price (BDT)</label>
              <input
                type="number"
                required
                value={pricingForm.price}
                onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                Save Pricing
              </button>
            </div>
          </form>

          {/* Current Pricings */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricings.map((pricing) => (
              <div key={pricing.id} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">{pricing.label}</p>
                <p className="text-lg font-bold text-emerald-600">{pricing.price} BDT</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transport bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        {booking.note && <p className="text-sm text-gray-500">{booking.note}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>{booking.customerEmail}</div>
                      <div>{booking.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{booking.vehicleType.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{booking.fromDestination}</div>
                      <div className="text-gray-500">to {booking.toDestination}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDate(booking.travelDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setEditingBooking(booking)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(booking.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'APPROVED' && (
                          <button
                            onClick={() => handleSendInvoice(booking.id)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Send Invoice
                          </button>
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

      {/* Approval Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Approve Transport Booking</h3>
            <p className="mb-4 text-sm text-gray-600">
              Customer: {editingBooking.customerName} | {editingBooking.vehicleType.replace('_', ' ')}
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Driver Name</label>
                <input
                  type="text"
                  value={approvalForm.driverName}
                  onChange={(e) => setApprovalForm({ ...approvalForm, driverName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Driver name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Driver Mobile</label>
                <input
                  type="text"
                  value={approvalForm.driverPhone}
                  onChange={(e) => setApprovalForm({ ...approvalForm, driverPhone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Driver mobile number"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Car Type</label>
                  <input
                    type="text"
                    value={approvalForm.carType}
                    onChange={(e) => setApprovalForm({ ...approvalForm, carType: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Car type"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Car Color</label>
                  <input
                    type="text"
                    value={approvalForm.carColor}
                    onChange={(e) => setApprovalForm({ ...approvalForm, carColor: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Car color"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Car Number</label>
                <input
                  type="text"
                  value={approvalForm.carNumber}
                  onChange={(e) => setApprovalForm({ ...approvalForm, carNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Car number"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rent Fee (BDT)</label>
                <input
                  type="number"
                  value={approvalForm.rentFee}
                  onChange={(e) => setApprovalForm({ ...approvalForm, rentFee: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleApprove(editingBooking)}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
                >
                  Approve Booking
                </button>
                <button
                  onClick={() => setEditingBooking(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
