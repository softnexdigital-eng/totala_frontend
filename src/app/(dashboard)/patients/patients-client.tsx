'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DocumentGroup } from '@/components/common/DocumentViewer';

interface PatientTaskDocument {
  taskId: string;
  taskStatus: string;
  date?: string;
  prescriptions?: string[];
  invoiceUrl?: string | null;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  address?: string;
  isRegistered: boolean;
  createdAt: string;
  /** Prescription / invoice uploaded on this patient's tasks (from the API). */
  taskDocuments?: PatientTaskDocument[];
}

/** Flatten every task document of a patient into one gallery-ready file list. */
function patientDocumentFiles(patient: Patient) {
  const files: { url: string; label?: string }[] = [];
  let rxCount = 0;
  let invCount = 0;
  (patient.taskDocuments || []).forEach((doc) => {
    (Array.isArray(doc.prescriptions) ? doc.prescriptions : []).forEach((url) => {
      rxCount += 1;
      files.push({ url, label: `Rx ${rxCount}` });
    });
    if (doc.invoiceUrl) {
      invCount += 1;
      files.push({ url: doc.invoiceUrl, label: invCount > 1 ? `Invoice ${invCount}` : 'Invoice' });
    }
  });
  return files;
}

interface PatientsClientProps {
  initialPatients: Patient[];
}

export default function PatientsClient({ initialPatients }: PatientsClientProps) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;

    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Patient deleted successfully!');
        setPatients(patients.filter((p) => p.id !== id));
      } else {
        toast.error(result.message || 'Failed to delete patient');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prescription / Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No patients found
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{patient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.age || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        patient.isRegistered
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {patient.isRegistered ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <DocumentGroup
                      files={patientDocumentFiles(patient)}
                      title={`Documents · ${patient.name}`}
                      emptyText="—"
                      maxVisible={3}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/patients/${patient.id}`)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
