'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AgentCard from '@/components/booking/AgentCard';
import BookNowModal from '@/components/booking/BookNowModal';
import type { AgentProfile } from '@/types';

export default function PublicAgentsPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/public-agents', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success) {
          setAgents(data.data || []);
        } else {
          toast.error(data?.message || 'Could not load agents');
        }
      } catch {
        toast.error('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, []);

  const activeAgents = agents.filter((a) => a.isActive !== false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity={0.9} />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900">DakDin</span>
        </Link>
        {/* <Link
          href="/login"
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Login
        </Link> */}
      </nav>

      <main className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-7.5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Our Trusted Agents
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Meet our dedicated team of healthcare agents ready to assist you with your medical needs. Pick any agent and book a request directly — no registration required.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : activeAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No agents available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onBookNow={setSelectedAgent}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 border-t border-gray-200 px-6 py-8 text-center lg:px-12">
        <p className="text-sm text-gray-600">
          © 2026 DakDin. All rights reserved.
        </p>
      </footer>

      {selectedAgent && (
        <BookNowModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSubmitted={() => {}}
        />
      )}
    </div>
  );
}
