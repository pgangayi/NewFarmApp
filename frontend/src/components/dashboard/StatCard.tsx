import React from 'react';
import { StatCardProps } from '../../types/dashboard';
import { colorClasses } from '../../utils/dashboard';

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  onClick,
}) => {
  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color].bg} mb-3`}>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colorClasses[color].icon}`} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
    </div>
  );
};

StatCard.displayName = 'StatCard';

export default StatCard;
