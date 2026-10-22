'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { ServiceType } from '@/types';

interface FormField {
  id?: string;
  serviceTypeId?: string;
  name: string;
  type: string;
  isRequired: boolean;
  options?: Record<string, unknown> | null;
  order: number;
  subFields: SubFieldForm[];
}

interface SubFieldForm {
  id?: string;
  serviceFieldId?: string;
  name: string;
  value?: string;
  order: number;
}

interface ServiceTypesClientProps {
  initialServiceTypes: ServiceType[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
];

export default function ServiceTypesClient({ initialServiceTypes }: ServiceTypesClientProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(initialServiceTypes);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceCharge: '0',
    minRequiredPayment: '0',
    serviceAvailability: 'available',
    isActive: true,
    order: '0',
    fields: [] as FormField[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serviceCharge: '0',
      minRequiredPayment: '0',
      serviceAvailability: 'available',
      isActive: true,
      order: '0',
      fields: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const addField = () => {
    setFormData((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        { name: '', type: 'text', isRequired: false, options: null, order: prev.fields.length, subFields: [] },
      ],
    }));
  };

  const updateField = (index: number, data: Partial<FormField>) => {
    setFormData((prev) => {
      const fields = [...prev.fields];
      fields[index] = { ...fields[index], ...data };
      return { ...prev, fields };
    });
  };

  const removeField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const addSubField = (fieldIndex: number) => {
    setFormData((prev) => {
      const fields = [...prev.fields];
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        subFields: [
          ...fields[fieldIndex].subFields,
          { name: '', value: '', order: fields[fieldIndex].subFields.length },
        ],
      };
      return { ...prev, fields };
    });
  };

  const updateSubField = (fieldIndex: number, subIndex: number, data: Partial<SubFieldForm>) => {
    setFormData((prev) => {
      const fields = [...prev.fields];
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        subFields: fields[fieldIndex].subFields.map((sf, i) => (i === subIndex ? { ...sf, ...data } : sf)),
      };
      return { ...prev, fields };
    });
  };

  const removeSubField = (fieldIndex: number, subIndex: number) => {
    setFormData((prev) => {
      const fields = [...prev.fields];
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        subFields: fields[fieldIndex].subFields.filter((_, i) => i !== subIndex),
      };
      return { ...prev, fields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/service-types/${editingId}` : '/api/service-types';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        description: formData.description || '',
        serviceCharge: Number(formData.serviceCharge) || 0,
        minRequiredPayment: Number(formData.minRequiredPayment) || 0,
        serviceAvailability: formData.serviceAvailability || 'available',
        isActive: formData.isActive,
        order: parseInt(formData.order) || 0,
        fields: formData.fields.map((f) => ({
          name: f.name,
          type: f.type,
          isRequired: f.isRequired,
          options: f.options || null,
          order: f.order,
          subFields: f.subFields.map((sf) => ({
            name: sf.name,
            value: sf.value || '',
            order: sf.order,
          })),
        })),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingId ? 'Service type updated!' : 'Service type created!');
        resetForm();
        if (!editingId) {
          setServiceTypes([result.data, ...serviceTypes]);
        } else {
          setServiceTypes(serviceTypes.map((st) => (st.id === editingId ? result.data : st)));
        }
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (st: ServiceType) => {
    setEditingId(st.id);
    setFormData({
      name: st.name,
      description: st.description || '',
      serviceCharge: String(st.serviceCharge ?? 0),
      minRequiredPayment: String(st.minRequiredPayment ?? 0),
      serviceAvailability: st.serviceAvailability || 'available',
      isActive: st.isActive,
      order: String(st.order || 0),
      fields: (st.fields || []).map((f) => ({
        id: f.id,
        serviceTypeId: f.serviceTypeId,
        name: f.name,
        type: f.type,
        isRequired: f.isRequired,
        options: f.options || null,
        order: f.order,
        subFields: (f.subFields || []).map((sf) => ({
          id: sf.id,
          serviceFieldId: sf.serviceFieldId,
          name: sf.name,
          value: sf.value || '',
          order: sf.order,
        })),
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service type?')) return;

    try {
      const response = await fetch(`/api/service-types/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Service type deleted successfully!');
        setServiceTypes(serviceTypes.filter((st) => st.id !== id));
      } else {
        toast.error(result.message || 'Failed to delete service type');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Service Types</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm ? 'Cancel' : 'Create Service Type'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Service Type' : 'Create Service Type'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (৳) *</label>
                <input
                  type="number"
                  value={formData.serviceCharge}
                  onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Required Payment (৳) *</label>
                <input
                  type="number"
                  value={formData.minRequiredPayment}
                  onChange={(e) => setFormData({ ...formData, minRequiredPayment: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                  max={formData.serviceCharge || undefined}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Availability</label>
                <select
                  value={formData.serviceAvailability}
                  onChange={(e) => setFormData({ ...formData, serviceAvailability: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Dynamic Fields */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
                <button type="button" onClick={addField} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Add Field
                </button>
              </div>
              {formData.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="border rounded-lg p-4 mb-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Field Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(fieldIndex, { name: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="e.g. Test Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(fieldIndex, { type: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={(e) => updateField(fieldIndex, { isRequired: e.target.checked })}
                          className="h-4 w-4 text-green-600 rounded"
                        />
                        <span className="text-xs text-gray-700">Required</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={() => removeField(fieldIndex)} className="text-sm bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Sub-fields */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-medium text-gray-600">Sub-Fields</label>
                      <button type="button" onClick={() => addSubField(fieldIndex)} className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                        Add Sub-Field
                      </button>
                    </div>
                    {field.subFields.map((subField, subIndex) => (
                      <div key={subIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <div>
                          <input
                            type="text"
                            value={subField.name}
                            onChange={(e) => updateSubField(fieldIndex, subIndex, { name: e.target.value })}
                            className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Sub-field name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={subField.value}
                            onChange={(e) => updateSubField(fieldIndex, subIndex, { value: e.target.value })}
                            className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Value (optional)"
                          />
                        </div>
                        <div>
                          <button type="button" onClick={() => removeSubField(fieldIndex, subIndex)} className="text-sm bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 w-full">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {field.subFields.length === 0 && (
                      <p className="text-xs text-gray-400">No sub-fields added</p>
                    )}
                  </div>
                </div>
              ))}
              {formData.fields.length === 0 && (
                <p className="text-sm text-gray-400">No custom fields added</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service Types List */}
      {serviceTypes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No service types found
        </div>
      ) : (
        <div className="space-y-4">
          {serviceTypes.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(st.id)}>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{st.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${st.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {st.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{st.description || 'No description'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium">
                        Charge: ৳{Number(st.serviceCharge ?? 0).toLocaleString('en-BD')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium">
                        Min: ৳{Number(st.minRequiredPayment ?? 0).toLocaleString('en-BD')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(st.serviceAvailability || 'available') === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                        {(st.serviceAvailability || 'available') === 'available' ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleExpand(st.id)}
                      className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700"
                    >
                      {expandedId === st.id ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                      onClick={() => handleEdit(st)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(st.id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedId === st.id && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Fields</h4>
                    {(st.fields || []).length === 0 ? (
                      <p className="text-sm text-gray-400">No custom fields</p>
                    ) : (
                      <div className="space-y-3">
                        {(st.fields || []).map((field) => (
                          <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{field.name}</p>
                                <p className="text-xs text-gray-500">Type: {field.type} | Required: {field.isRequired ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                            {field.subFields && field.subFields.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-600 mb-2">Sub-Fields</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {field.subFields.map((sf) => (
                                    <div key={sf.id} className="bg-white border rounded p-2 text-sm">
                                      <span className="font-medium">{sf.name}</span>
                                      {sf.value && <span className="text-gray-500 ml-2">= {sf.value}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
