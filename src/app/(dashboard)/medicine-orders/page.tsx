'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface MedicineOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  deliveryAddress: string;
  orderType: string;
  status: string;
  notes?: string;
  totalAmount?: number;
  isHighRiskReview: boolean;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    medicineName: string;
    strength?: string;
    form?: string;
    quantity: number;
    notes?: string;
  }[];
  prescription?: {
    id: string;
    fileUrl: string;
    fileType: string;
    doctorName?: string;
    doctorRegistrationNumber?: string;
    prescriptionDate?: string;
    hospitalName?: string;
    verificationStatus: string;
  };
  verifications: {
    id: string;
    verifierId: string;
    status: string;
    reason?: string;
    note?: string;
    verifiedAt: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    performedBy?: string;
    note?: string;
    createdAt: string;
  }[];
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  PRESCRIPTION_REQUIRED: 'bg-yellow-100 text-yellow-800',
  PENDING_PRESCRIPTION_VERIFICATION: 'bg-blue-100 text-blue-800',
  PRESCRIPTION_MISMATCH: 'bg-red-100 text-red-800',
  QUANTITY_REVIEW_REQUIRED: 'bg-orange-100 text-orange-800',
  NEED_MORE_INFORMATION: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  PAYMENT_PENDING: 'bg-indigo-100 text-indigo-800',
  PAYMENT_CONFIRMED: 'bg-teal-100 text-teal-800',
  PREPARING: 'bg-cyan-100 text-cyan-800',
  READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800',
  OUT_FOR_DELIVERY: 'bg-emerald-100 text-emerald-800',
  DELIVERED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function MedicineOrdersPage() {
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MedicineOrder | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'info' | ''>('');

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/medicine-orders?${params}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch {
      toast.error('Failed to fetch medicine orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setSubmittingId(orderId);
    try {
      const response = await fetch(`/api/medicine-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reason: actionReason,
          note: actionNote,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Order status updated successfully');
        setSelectedOrder(null);
        setActionReason('');
        setActionNote('');
        setActionType('');
        fetchOrders();
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      order.patientName.toLowerCase().includes(term) ||
      order.patientPhone.includes(term) ||
      order.items.some((item) => item.medicineName.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Medicine Orders</h1>
        <p className="text-gray-600 mt-1">
          Manage and verify medicine orders with prescription validation
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by order ID, patient name, phone, or medicine..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PRESCRIPTION_REQUIRED">Prescription Required</option>
          <option value="PENDING_PRESCRIPTION_VERIFICATION">Pending Verification</option>
          <option value="PRESCRIPTION_MISMATCH">Prescription Mismatch</option>
          <option value="QUANTITY_REVIEW_REQUIRED">Quantity Review</option>
          <option value="NEED_MORE_INFORMATION">Need More Info</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No medicine orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.patientName}</p>
                        <p className="text-xs text-gray-500">
                          {order.patientGender} | {order.patientAge} years
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.patientPhone}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.orderType}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.isHighRiskReview && (
                        <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          HIGH RISK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Order {selectedOrder.orderNumber}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-6">
              {/* Patient Info */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span> {selectedOrder.patientName}
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span> {selectedOrder.patientPhone}
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span> {selectedOrder.patientEmail || '-'}
                  </div>
                  <div>
                    <span className="text-gray-600">Age/Gender:</span> {selectedOrder.patientAge} / {selectedOrder.patientGender}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span> {selectedOrder.deliveryAddress}
                  </div>
                </div>
              </div>

              {/* Medicines */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Medicines</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={item.id} className="text-sm border-b last:border-b-0 py-2">
                    <span className="font-medium">{index + 1}. {item.medicineName}</span>
                    {item.strength && <span className="text-gray-600"> - {item.strength}</span>}
                    {item.form && <span className="text-gray-600"> - {item.form}</span>}
                    <span className="text-gray-600"> - Qty: {item.quantity}</span>
                    {item.notes && <span className="text-gray-500"> - {item.notes}</span>}
                  </div>
                ))}
              </div>

              {/* Prescription */}
              {selectedOrder.prescription && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Prescription</h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-600">File:</span>{' '}
                      <a
                        href={selectedOrder.prescription.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Prescription
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-600">Doctor:</span>{' '}
                      {selectedOrder.prescription.doctorName || '-'}
                    </div>
                    <div>
                      <span className="text-gray-600">Reg No:</span>{' '}
                      {selectedOrder.prescription.doctorRegistrationNumber || '-'}
                    </div>
                    <div>
                      <span className="text-gray-600">Hospital:</span>{' '}
                      {selectedOrder.prescription.hospitalName || '-'}
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        selectedOrder.prescription.verificationStatus === 'VERIFIED'
                          ? 'bg-green-100 text-green-800'
                          : selectedOrder.prescription.verificationStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.prescription.verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Log */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Status History</h3>
                {selectedOrder.auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">No audit logs</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.auditLogs.map((log) => (
                      <div key={log.id} className="text-sm border-b last:border-b-0 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {(log.previousStatus || log.newStatus) && (
                          <span className="text-gray-600">
                            {log.previousStatus} → {log.newStatus}
                          </span>
                        )}
                        {log.performedBy && (
                          <div className="text-gray-600">By: {log.performedBy}</div>
                        )}
                        {log.note && <div className="text-gray-500">Note: {log.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'REJECTED' && selectedOrder.status !== 'CANCELLED' && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Actions</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason / Note
                      </label>
                      <textarea
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className={inputCls}
                        rows={2}
                        placeholder="Required for reject/cancel/more info"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'APPROVED')}
                        disabled={submittingId === selectedOrder.id}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'REJECTED')}
                        disabled={submittingId === selectedOrder.id}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'NEED_MORE_INFORMATION')}
                        disabled={submittingId === selectedOrder.id}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Request More Info
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition';
