import { createFileRoute } from '@tanstack/react-router';
import { FarmsPage } from '../pages/FarmsPage';

export const Route = createFileRoute('/farms')({
  component: FarmsPage,
});