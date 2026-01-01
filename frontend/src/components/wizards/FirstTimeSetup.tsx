import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateFarm } from '../../hooks';
import { useAuth } from '../../hooks/AuthContext';
import { UnifiedModal } from '../ui/UnifiedModal';
import { useToast } from '../ui/use-toast';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

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
  const { toast } = useToast();
  const [_step, _setStep] = useState(1);

  const handleFarmSubmit = async (data: any) => {
    console.log('FirstTimeWizard: Submitting farm data', data);
    if (!user) {
      console.error('FirstTimeWizard: No user found in context');
      toast('User session not found. Please log in again.', 'error');
      return;
    }

    try {
      console.log('FirstTimeWizard: Calling createFarmMutation');
      await createFarmMutation.mutateAsync({
        name: data.name,
        location: data.location,
        owner_id: user.id,
        area_hectares: data.area_hectares ? Number(data.area_hectares) : undefined,
        farm_type: data.farm_type,
        timezone: 'UTC',
      } as any);
      console.log('FirstTimeWizard: Farm created successfully');
      toast('Farm created successfully!', 'success');
      onComplete();
      navigate('/dashboard');
    } catch (error) {
      console.error('FirstTimeWizard: Failed to create farm', error);
      toast('Failed to create farm. Please try again.', 'error');
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
        isLoading={createFarmMutation.isPending}
      />
    );
  }

  return null;
};
