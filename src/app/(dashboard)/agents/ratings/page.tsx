'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Task {
  id: string;
  taskStatus: string;
  appointment: {
    id: string;
    patient?: { name: string };
    doctor?: { name: string };
  };
  agent: {
    id: string;
    name: string;
  };
}

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  task: Task;
}

export default function RatingsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [comment, setComment] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, ratingsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/ratings'),
      ]);

      const tasksData = await tasksRes.json();
      const ratingsData = await ratingsRes.json();

      if (tasksData.success) {
        const completedTasks = (tasksData.data || []).filter(
          (task: Task) => task.taskStatus === 'COMPLETED'
        );
        setTasks(completedTasks);
      }

      if (ratingsData.success) {
        setRatings(ratingsData.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          agentId: selectedTask.agent.id,
          rating: ratingValue,
          comment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Rating submitted successfully');
        setShowRatingForm(false);
        setSelectedTask(null);
        setRatingValue(5);
        setComment('');
        fetchData();
      } else {
        toast.error(result.message || 'Failed to submit rating');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const isTaskRated = (taskId: string) => {
    return ratings.some((r) => r.task.id === taskId);
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
        <h1 className="text-2xl font-bold">Agent Ratings</h1>
        <p className="text-gray-600 mt-1">
          Rate agents for completed tasks
        </p>
      </div>

      {/* Completed Tasks */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Completed Tasks</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No completed tasks found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Task ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">#{task.id.slice(-8)}</td>
                    <td className="px-6 py-4">
                      {task.appointment.patient?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {task.appointment.doctor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{task.agent.name}</td>
                    <td className="px-6 py-4">
                      {isTaskRated(task.id) ? (
                        <span className="text-green-600 font-medium">Rated</span>
                      ) : (
                        <span className="text-yellow-600">Not rated</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!isTaskRated(task.id) && (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowRatingForm(true);
                          }}
                          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Rate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingForm && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Rate Agent</h3>
            <p className="text-gray-600 mb-4">
              Agent: <span className="font-medium">{selectedTask.agent.name}</span>
            </p>
            <p className="text-gray-600 mb-4">
              Task: <span className="font-medium">#{selectedTask.id.slice(-8)}</span>
            </p>

            <form onSubmit={handleRate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="text-3xl"
                    >
                      <svg
                        className={`h-8 w-8 ${
                          star <= ratingValue
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Add a comment..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
                >
                  Submit Rating
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingForm(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
