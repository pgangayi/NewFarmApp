import { FC, memo } from 'react';
import { Crop } from '../../types/dashboard';
import { formatDate, getStatusBadgeClasses } from '../../utils/dashboard';
import { Leaf, Activity } from 'lucide-react';

interface CropCardProps {
  crop: Crop;
  onViewDetails?: () => void;
  onAction?: () => void;
}

const CropCard: FC<CropCardProps> = memo(({ crop, onViewDetails, onAction }) => {
  return (
    <div
      className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      role="article"
      aria-labelledby={`crop-${crop.id}-title`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg" aria-hidden="true">
            <Leaf className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4
              id={`crop-${crop.id}-title`}
              className="font-semibold text-gray-900 text-sm sm:text-base"
            >
              {crop.name}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">{crop.crop_type}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(crop.health_status || 'healthy', 'crop')}`}
        >
          {crop.health_status || 'No status'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Status:</span>
          <p className="font-medium text-gray-900">{crop.status}</p>
        </div>
        <div>
          <span className="text-gray-500">Planted:</span>
          <p className="font-medium text-gray-900">{formatDate(crop.planting_date)}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={onAction}
          className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          aria-label="View crop activity"
        >
          <Activity className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

CropCard.displayName = 'CropCard';

export default CropCard;
