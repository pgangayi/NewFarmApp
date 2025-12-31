import { Heart, Search, TrendingUp, Stethoscope } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import type { Livestock } from '../../api';

interface OverviewTabProps {
  livestock: Livestock[];
}

export function OverviewTab({ livestock }: OverviewTabProps) {
  const stats = {
    total: livestock.length,
    active: livestock.filter(l => l.status === 'active').length,
    healthy: livestock.filter(l => !l.health_status || l.health_status === 'healthy').length,
    sick: livestock.filter(l => l.health_status === 'sick').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Livestock" value={stats.total} icon={Heart} color="blue" />
      <StatCard title="Active Animals" value={stats.active} icon={Search} color="green" />
      <StatCard title="Healthy" value={stats.healthy} icon={Stethoscope} color="emerald" />
      <StatCard title="Sick / Injured" value={stats.sick} icon={TrendingUp} color="red" />
    </div>
  );
}
