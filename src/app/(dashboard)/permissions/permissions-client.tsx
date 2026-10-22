'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface PermissionModule {
  label: string;
  description: string;
}

interface PermissionStructure {
  [key: string]: PermissionModule;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  permissions?: Record<string, boolean>;
}

const DEFAULT_PERMISSIONS: PermissionStructure = {
  dashboard: { label: 'Dashboard', description: 'Dashboard overview access' },
  patients: { label: 'Patients', description: 'Create, edit, view patients' },
  doctors: { label: 'Doctors', description: 'Manage doctors' },
  agents: { label: 'Agents', description: 'Manage agents' },
  packages: { label: 'Packages', description: 'Manage packages' },
  appointments: { label: 'Appointments', description: 'Manage appointments' },
  doctorBooking: { label: 'Doctor Booking', description: 'Doctor booking access' },
  tests: { label: 'Tests', description: 'Manage tests' },
  reports: { label: 'Reports', description: 'View reports' },
  permissions: { label: 'Permissions', description: 'Manage agent permissions' },
  security: { label: 'Security', description: 'Fraud shield: visitors, leads & blocked IPs' },
};

export default function PermissionsClient({ initialAgents }: { initialAgents: Agent[] }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [permissionKeys, setPermissionKeys] = useState<string[]>(Object.keys(DEFAULT_PERMISSIONS));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/permissions')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setPermissionKeys(Object.keys(result.data));
        } else {
          setPermissionKeys(Object.keys(DEFAULT_PERMISSIONS));
        }
      })
      .catch(() => {
        setPermissionKeys(Object.keys(DEFAULT_PERMISSIONS));
      });
  }, []);

  const togglePermission = async (agentId: string, key: string, checked: boolean) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const current = agent.permissions || {};

    // Save a COMPLETE permission map so that menus the super admin did NOT
    // grant are stored explicitly as `false` (and are therefore hidden on the
    // agent's dashboard). Only toggling the map to include granted keys would
    // leave the rest undefined, which the agent's sidebar would then not treat
    // as "granted".
    const updatedPermissions = Object.fromEntries(
      permissionKeys.map((k) => [k, k === key ? checked : (current[k] ?? false)])
    );

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, permissions: updatedPermissions } : a
      )
    );

    try {
      const response = await fetch(`/api/permissions/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Permissions updated');
      } else {
        toast.error(result.message || 'Failed to update permissions');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Agent</h2>
        <p className="text-gray-600 mt-1">Manage agent access and permissions</p>
      </div>

      <div className="p-6">
        {agents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No agents found</div>
        ) : (
          <div className="space-y-6">
            {agents.map((agent) => (
              <div key={agent.id} className="border rounded-lg p-5">
                <div className="mb-4">
                  <div className="font-semibold text-gray-900">{agent.name}</div>
                  <div className="text-sm text-gray-500">{agent.phone}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {permissionKeys.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={agent.permissions?.[key] === true}
                        onChange={(e) => togglePermission(agent.id, key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {DEFAULT_PERMISSIONS[key]?.label || key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
