"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/providers";
import { 
  createWebsite, 
  deleteWebsite, 
  getUserWebsites, 
  updateWebsite 
} from "@/app/actions/websites";
import { toast } from "sonner";

// Define website type based on the action return type
export type Website = {
  id: string;
  name: string | null;
  domain: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status?: string;
};

export function useWebsites() {
  const websitesQuery = useQuery({
    queryKey: ["websites"],
    queryFn: async () => {
      const result = await getUserWebsites();
      if (result.error) {
        toast.error(result.error);
        return [];
      }
      return result.data || [];
    },
  });

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: { name: string; domain: string }) => {
      return createWebsite(data);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Website created successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error) => {
      toast.error("Failed to create website");
      console.error(error);
    },
  });

  const updateWebsiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; domain?: string } }) => {
      return updateWebsite(id, data);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error) => {
      toast.error("Failed to update website");
      console.error(error);
    },
  });

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteWebsite(id);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Website deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error) => {
      toast.error("Failed to delete website");
      console.error(error);
    },
  });

  return {
    websites: websitesQuery.data || [],
    isLoading: websitesQuery.isLoading,
    isError: websitesQuery.isError,
    createWebsite: createWebsiteMutation.mutate,
    isCreating: createWebsiteMutation.isPending,
    updateWebsite: updateWebsiteMutation.mutate,
    isUpdating: updateWebsiteMutation.isPending,
    deleteWebsite: deleteWebsiteMutation.mutate,
    isDeleting: deleteWebsiteMutation.isPending,
    refetch: websitesQuery.refetch,
  };
} 