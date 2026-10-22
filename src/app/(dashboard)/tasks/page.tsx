import Link from 'next/link';
import { fetchBackendJson } from '../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import TasksClient from './tasks-client';

async function getTasks() {
  const token = await getAuthToken();
  return fetchBackendJson('/api/tasks', token);
}

export default async function TasksPage() {
  const data = await getTasks();

  if (!data) {
    return <div>Please login</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </div>
      <TasksClient initialTasks={data.data || []} />
    </div>
  );
}
