import React, { useState } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { useAuth } from '../../hooks/AuthContext';
import { UnifiedModal } from '../ui/UnifiedModal';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const FirstTimeWizard: React.FC<WizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { createFarm } = useFarm();
  const { user } = useAuth();
  const [_step, _setStep] = useState(1);

  const handleFarmSubmit = async (data: any) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      await createFarm({
        name: data.name,
        location: data.location,
        owner_id: user.id,
        // Optional default values
        area_hectares: 0,
        timezone: 'UTC',
      });
      onComplete(); // Done after one step for this MVP
    } catch (error) {
      console.error('Failed to create farm', error);
    }
  };

  if (_step === 1) {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title="Welcome! Let's set up your farm"
        description="To get started, we need a few details about your farm."
        fields={[
          {
            name: 'name',
            label: 'Farm Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Sunny Acres',
          },
          {
            name: 'location',
            label: 'Location',
            type: 'text',
            required: true,
            placeholder: 'e.g. Springfield, IL',
          },
        ]}
        onSubmit={handleFarmSubmit}
        submitLabel="Get Started"
      />
    );
  }

  return null;
};
