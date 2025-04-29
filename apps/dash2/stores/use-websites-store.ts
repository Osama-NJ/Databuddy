import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

export interface Website {
  id: string;
  name: string | null;
  domain: string | { 
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  userId?: string | null;
  projectId?: string | null;
  domainId?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  domainData?: {
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  } | null;
}

interface WebsitesState {
  // Data
  websites: Website[];
  selectedWebsite: Website | null;
  
  // UI States
  isLoading: boolean;
  isError: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isVerifying: boolean;
  isRegenerating: boolean;
  showVerificationDialog: boolean;
  
  // Actions
  setWebsites: (websites: Website[]) => void;
  setSelectedWebsite: (website: Website | null) => void;
  setShowVerificationDialog: (show: boolean) => void;
  
  // Loading States
  setIsLoading: (loading: boolean) => void;
  setIsError: (error: boolean) => void;
  setIsCreating: (creating: boolean) => void;
  setIsUpdating: (updating: boolean) => void;
  setIsDeleting: (deleting: boolean) => void;
  setIsVerifying: (verifying: boolean) => void;
  setIsRegenerating: (regenerating: boolean) => void;
}

// Use standard Zustand create with better performance
export const useWebsitesStore = create<WebsitesState>((set) => ({
  // Initial Data
  websites: [],
  selectedWebsite: null,
  
  // Initial UI States
  isLoading: true,
  isError: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isVerifying: false,
  isRegenerating: false,
  showVerificationDialog: false,
  
  // Actions
  setWebsites: (websites) => set({ websites }),
  setSelectedWebsite: (website) => set({ selectedWebsite: website }),
  setShowVerificationDialog: (show) => set({ showVerificationDialog: show }),
  
  // Loading States
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsError: (error) => set({ isError: error }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setIsUpdating: (updating) => set({ isUpdating: updating }),
  setIsDeleting: (deleting) => set({ isDeleting: deleting }),
  setIsVerifying: (verifying) => set({ isVerifying: verifying }),
  setIsRegenerating: (regenerating) => set({ isRegenerating: regenerating }),
}));

// Helper selectors for more efficient component subscriptions
export const useSelectedWebsite = () => useWebsitesStore(state => state.selectedWebsite);
export const useVerificationDialog = () => {
  const { showVerificationDialog, setShowVerificationDialog } = useWebsitesStore(
    state => ({
      showVerificationDialog: state.showVerificationDialog,
      setShowVerificationDialog: state.setShowVerificationDialog
    })
  );
  
  return {
    show: showVerificationDialog,
    setShow: setShowVerificationDialog
  };
}; 