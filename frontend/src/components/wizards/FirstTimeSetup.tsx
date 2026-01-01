import React, { useState } from 'react';
import { useCreateFarm } from '../../hooks';
import { useAuth } from '../../hooks/AuthContext';
import { UnifiedModal } from '../ui/UnifiedModal';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

import { useNavigate } from 'react-router-dom';

const wizardFields = [
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
  {
    name: 'area_hectares',
    label: 'Size (Hectares)',
    type: 'number',
    required: false,
    placeholder: 'Optional',
  },
  {
    name: 'farm_type',
    label: 'Farm Type',
    type: 'select',
    required: false,
    options: [
      { value: 'crop', label: 'Crops' },
      { value: 'livestock', label: 'Livestock' },
      { value: 'mixed', label: 'Mixed' },
      { value: 'other', label: 'Other' },
    ],
    placeholder: 'Select a type (optional)',
  },
] as const;

export const FirstTimeWizard: React.FC<WizardProps> = ({ isOpen, onClose, onComplete }) => {
  const createFarmMutation = useCreateFarm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [_step, _setStep] = useState(1);

  const handleFarmSubmit = async (data: any) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      await createFarmMutation.mutateAsync({
        name: data.name,
        location: data.location,
        owner_id: user.id,
        area_hectares: data.area_hectares ? Number(data.area_hectares) : undefined,
        farm_type: data.farm_type,
        timezone: 'UTC',
      } as any);
      onComplete();
      navigate('/dashboard');
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
        fields={wizardFields as any}
        onSubmit={handleFarmSubmit}
        submitLabel="Get Started"
      />
    );
  }

  return null;
};
