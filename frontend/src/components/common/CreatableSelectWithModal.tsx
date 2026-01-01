import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CreatableSelectWithModalProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  modalTitle: string;
  onCreateOption: (newValue: string) => Promise<void>;
}

export function CreatableSelectWithModal({
  options,
  value,
  onValueChange,
  placeholder,
  modalTitle,
  onCreateOption,
}: CreatableSelectWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemValue, setNewItemValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newItemValue.trim()) return;
    setIsCreating(true);
    try {
      await onCreateOption(newItemValue);
      setIsModalOpen(false);
      setNewItemValue('');
    } catch (error) {
      console.error('Failed to create option', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Select
        value={value}
        onValueChange={val => {
          if (val === '__add_new__') {
            setIsModalOpen(true);
          } else {
            onValueChange(val);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value="__add_new__" className="text-blue-600 font-medium border-t mt-1">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New...
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newItemValue}
                onChange={e => setNewItemValue(e.target.value)}
                placeholder="Enter name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !newItemValue.trim()}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
