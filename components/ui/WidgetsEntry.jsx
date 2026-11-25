import { IdentityFlipCard, mountIdentityFlipCard } from './IdentityFlipCard.jsx';
import { SuitesFolderGrid, mountSuitesFolderGrid } from './SuitesFolderGrid.jsx';

if (typeof window !== 'undefined') {
  window.NexusIdentityFlipCard = {
    render: mountIdentityFlipCard,
    IdentityFlipCard
  };
  window.NexusSuitesFolderGrid = {
    render: mountSuitesFolderGrid,
    SuitesFolderGrid
  };
}
