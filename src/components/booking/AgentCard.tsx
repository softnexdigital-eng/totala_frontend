import { Star, MapPin, Snowflake } from 'lucide-react';
import { AgentProfile } from '@/types';

interface AgentCardProps {
  agent: AgentProfile;
  /**
   * Optional: the landing page no longer books directly from the card, so it
   * omits this handler. `/public-agents` still passes it.
   */
  onBookNow?: (agent: AgentProfile) => void;
  /**
   * `false` hides the "Book Now" button (landing page): booking requests are
   * only created through the hero search bar, then the Super Admin assigns an
   * agent from the dashboard. Defaults to `true` for the /public-agents
   * directory.
   */
  showBookButton?: boolean;
}

function AgentAvatar({ agent }: { agent: AgentProfile }) {
  const initials = (agent.name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  if (agent.photo) {
    return (
      <img
        src={agent.photo}
        alt={agent.name}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-3xl font-bold text-white">
      {initials}
    </div>
  );
}

export default function AgentCard({
  agent,
  onBookNow,
  showBookButton = true,
}: AgentCardProps) {
  const rating = Number(agent.averageRating) || 0;
  const completed = agent.completedTasks || 0;

  /**
   * Freeze workflow: the agent's previous task service charge has been
   * submitted (cash / bKash / Nagad / Rocket) and the Super Admin has not
   * clicked "End" yet, so the whole card is frozen — no new booking can be
   * placed from the landing page until the admin ends that task.
   */
  const frozen = agent.isFrozen === true || agent.isBookable === false;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 shadow-lg shadow-black/5 transition-shadow ${
        frozen ? 'bg-gray-50 ring-1 ring-gray-200' : 'bg-white hover:shadow-xl'
      }`}
    >
      {/* Frozen badge — only meaningful when the card can be booked */}
      {showBookButton && frozen && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white">
          <Snowflake className="h-3.5 w-3.5" />
          Freeze
        </div>
      )}

      {/* Agent Photo */}
      <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full ring-2 ring-green-100">
        <AgentAvatar agent={agent} />
      </div>

      {/* Agent Name */}
      <h3 className="text-center text-lg font-semibold text-gray-900">
        {agent.name}
      </h3>

      {/* Rating */}
      <div className="mt-3 flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-200'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>

      {/* Total Completed Tasks */}
      <p className="mt-1 text-center text-sm text-gray-500">
        {completed} completed task{completed === 1 ? '' : 's'}
      </p>

      {/* Service Area */}
      {agent.area && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{agent.area}</span>
        </div>
      )}

      {/* Services */}
      {agent.services && agent.services.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {agent.services.slice(0, 3).map((service, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full"
            >
              {service}
            </span>
          ))}
        </div>
      )}

      {/* Booking action — hidden on the landing page (showBookButton=false) */}
      {!showBookButton ? (
        <div className="mt-6 rounded-lg bg-slate-50 px-3 py-2.5 text-center text-xs font-medium leading-5 text-slate-600">
          বুকিং রিকোয়েস্ট সার্চ বার থেকে করুন — এজেন্ট অ্যাসাইন করবেন সুপার
          অ্যাডমিন
        </div>
      ) : frozen ? (
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600"
          >
            Book Now (Freeze)
          </button>
          <p className="mt-2 text-center text-xs text-slate-600">
            আগের টাস্কের সার্ভিস চার্জ পেমেন্ট জমা হয়েছে — সুপার অ্যাডমিন End করলেই
            আবার বুকিং চালু হবে।
            {typeof agent.pendingEndTasks === 'number' && agent.pendingEndTasks > 0
              ? ` (${agent.pendingEndTasks} task waiting for End)`
              : ''}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onBookNow?.(agent)}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Book Now
        </button>
      )}
    </div>
  );
}
