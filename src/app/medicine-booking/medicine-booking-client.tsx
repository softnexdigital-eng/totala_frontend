'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { validatePhone, validateEmail } from '@/lib/validation';
import type { Medicine } from '@/types';

interface MedicineItem {
  medicineId?: string;
  medicineName: string;
  strength: string;
  form: string;
  quantity: number;
  notes: string;
}

interface FormErrors {
  patientName?: string;
  patientPhone?: string;
  patientAge?: string;
  deliveryAddress?: string;
  orderType?: string;
  medicineName?: string;
  quantity?: string;
}

const ORDER_TYPES = [
  { value: 'OTC', label: 'OTC / General Medicine' },
  { value: 'PRESCRIPTION', label: 'Prescription Medicine' },
  { value: 'ASSISTANCE', label: 'Medicine Identification / Assistance' },
];

const MEDICINE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other',
];

export default function MedicineBookingClient({ initialMedicines }: { initialMedicines: Medicine[] }) {
  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [items, setItems] = useState<MedicineItem[]>([
    { medicineName: '', strength: '', form: 'Tablet', quantity: 1, notes: '' },
  ]);
  const [prescription, setPrescription] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [prescriptionNote, setPrescriptionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: '',
    deliveryAddress: '',
    notes: '',
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { medicineName: '', strength: '', form: 'Tablet', quantity: 1, notes: '' },
    ]);
  };

  const updateItem = (index: number, data: Partial<MedicineItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPrescription(file);
    if (file) {
      setPrescriptionPreview(URL.createObjectURL(file));
    } else {
      setPrescriptionPreview(null);
    }
  };

  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    if (!form.patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!form.patientPhone.trim()) newErrors.patientPhone = 'Phone number is required';
    else if (!validatePhone(form.patientPhone)) newErrors.patientPhone = 'Enter a valid phone number';
    if (!form.patientAge.trim()) newErrors.patientAge = 'Age is required';
    else if (Number(form.patientAge) <= 0) newErrors.patientAge = 'Enter a valid age';
    if (!form.deliveryAddress.trim()) newErrors.deliveryAddress = 'Delivery address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: FormErrors = {};
    const invalidItem = items.find((item) => !item.medicineName.trim() || item.quantity <= 0);
    if (invalidItem) {
      newErrors.medicineName = 'All medicine items must have a name and valid quantity';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    if (orderType !== 'OTC' && !prescription) {
      toast.error('Prescription upload is required for prescription/assistance orders');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep3()) return;

    setLoading(true);
    try {
      // Upload prescription if provided
      let prescriptionData: any = null;
      if (prescription && orderType !== 'OTC') {
        const formData = new FormData();
        formData.append('file', prescription);

        const uploadRes = await fetch('/api/upload/single?type=prescriptions-medicine', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadRes.json();
        if (!uploadResult.success) {
          toast.error('Failed to upload prescription');
          setLoading(false);
          return;
        }

        prescriptionData = {
          fileUrl: uploadResult.data.url,
          fileType: uploadResult.data.mimetype,
          doctorName,
          doctorRegistrationNumber: doctorRegNo,
          prescriptionDate: prescriptionDate || null,
          hospitalName,
        };
      }

      // Create order
      const orderData = {
        patientName: form.patientName,
        patientPhone: form.patientPhone,
        patientEmail: form.patientEmail || undefined,
        patientAge: form.patientAge,
        patientGender: form.patientGender || undefined,
        deliveryAddress: form.deliveryAddress,
        orderType,
        notes: form.notes || undefined,
        items: items.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          strength: item.strength || undefined,
          form: item.form || undefined,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
        prescription: prescriptionData,
      };

      const response = await fetch('/api/medicine-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Medicine order submitted successfully!');
        // Reset form
        setStep(1);
        setOrderType('');
        setItems([{ medicineName: '', strength: '', form: 'Tablet', quantity: 1, notes: '' }]);
        setPrescription(null);
        setPrescriptionPreview(null);
        setForm({
          patientName: '',
          patientPhone: '',
          patientEmail: '',
          patientAge: '',
          patientGender: '',
          deliveryAddress: '',
          notes: '',
        });
      } else {
        toast.error(result.message || 'Failed to submit order');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition';
  const inputErr =
    'w-full px-4 py-2.5 border border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition';

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Progress Steps */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Request Type' },
            { num: 2, label: 'Patient Info' },
            { num: 3, label: 'Medicines' },
            { num: 4, label: 'Prescription' },
            { num: 5, label: 'Delivery' },
            { num: 6, label: 'Review' },
          ].map((s) => (
            <div key={s.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step >= s.num
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s.num}
                </div>
                <span className="mt-1 text-xs text-gray-600">{s.label}</span>
              </div>
              {s.num < 6 && (
                <div className="mx-2 h-0.5 flex-1 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Step 1: Request Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What do you need?</h3>
            <div className="grid grid-cols-1 gap-4">
              {ORDER_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                    orderType === type.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="orderType"
                    value={type.value}
                    checked={orderType === type.value}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="font-medium">{type.label}</span>
                </label>
              ))}
            </div>
            {errors.orderType && <p className="text-sm text-red-600">{errors.orderType}</p>}
          </div>
        )}

        {/* Step 2: Patient Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Patient Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => update('patientName', e.target.value)}
                  className={errors.patientName ? inputErr : inputCls}
                />
                {errors.patientName && <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={form.patientPhone}
                  onChange={(e) => update('patientPhone', e.target.value)}
                  className={errors.patientPhone ? inputErr : inputCls}
                />
                {errors.patientPhone && <p className="mt-1 text-xs text-red-600">{errors.patientPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.patientEmail}
                  onChange={(e) => update('patientEmail', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={form.patientAge}
                  onChange={(e) => update('patientAge', e.target.value)}
                  className={errors.patientAge ? inputErr : inputCls}
                />
                {errors.patientAge && <p className="mt-1 text-xs text-red-600">{errors.patientAge}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={form.patientGender}
                  onChange={(e) => update('patientGender', e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Medicines */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Medicine Information</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
              >
                Add Another Medicine
              </button>
            </div>
            {errors.medicineName && (
              <p className="text-sm text-red-600">{errors.medicineName}</p>
            )}
            {items.map((item, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={item.medicineName}
                      onChange={(e) => updateItem(index, { medicineName: e.target.value })}
                      className={inputCls}
                      list={`medicines-${index}`}
                    />
                    <datalist id={`medicines-${index}`}>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strength / Dosage
                    </label>
                    <input
                      type="text"
                      value={item.strength}
                      onChange={(e) => updateItem(index, { strength: e.target.value })}
                      placeholder="e.g. 500 mg"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form
                    </label>
                    <select
                      value={item.form}
                      onChange={(e) => updateItem(index, { form: e.target.value })}
                      className={`${inputCls} cursor-pointer`}
                    >
                      {MEDICINE_FORMS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 0 })}
                      className={inputCls}
                      min="1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Note
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItem(index, { notes: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Prescription */}
        {step === 4 && orderType !== 'OTC' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prescription Upload</h3>
            <div className="rounded-lg border p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Prescription * (JPG, PNG, PDF)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handlePrescriptionChange}
                    className="block w-full text-sm text-gray-500"
                  />
                  {prescriptionPreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Preview:</p>
                      {prescription && prescription.type.startsWith('image/') ? (
                        <img src={prescriptionPreview} alt="Preview" className="mt-1 h-32 w-auto rounded border" />
                      ) : (
                        <p className="text-sm text-gray-500">{prescription?.name}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor Registration Number
                    </label>
                    <input
                      type="text"
                      value={doctorRegNo}
                      onChange={(e) => setDoctorRegNo(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prescription Date
                    </label>
                    <input
                      type="date"
                      value={prescriptionDate}
                      onChange={(e) => setPrescriptionDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hospital / Clinic Name
                    </label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Prescription Note
                  </label>
                  <textarea
                    value={prescriptionNote}
                    onChange={(e) => setPrescriptionNote(e.target.value)}
                    className={inputCls}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Delivery */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                value={form.deliveryAddress}
                onChange={(e) => update('deliveryAddress', e.target.value)}
                className={errors.deliveryAddress ? inputErr : inputCls}
                rows={3}
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-xs text-red-600">{errors.deliveryAddress}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                className={inputCls}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Order</h3>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Patient Information</h4>
              <p className="text-sm text-gray-600">
                {form.patientName} | {form.patientPhone} | {form.patientAge} years
              </p>
              <p className="text-sm text-gray-600">{form.deliveryAddress}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Order Type</h4>
              <p className="text-sm text-gray-600">{ORDER_TYPES.find((t) => t.value === orderType)?.label}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Medicines</h4>
              {items.map((item, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {index + 1}. {item.medicineName} - {item.strength} - {item.form} - Qty: {item.quantity}
                </div>
              ))}
            </div>
            {prescription && orderType !== 'OTC' && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Prescription</h4>
                <p className="text-sm text-gray-600">{prescription.name}</p>
              </div>
            )}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                For prescription medicines, Dakdin/pharmacy/pharmacist verification is required before the medicine can be dispensed.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !orderType) {
                  toast.error('Please select an order type');
                  return;
                }
                if (step === 2 && !validateStep1()) return;
                if (step === 3 && !validateStep3()) return;
                if (step === 4 && !validateStep4()) return;
                setStep((prev) => prev + 1);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Order'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
