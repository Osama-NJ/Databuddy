'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
	CreateRevenueConfigData,
	RevenueConfig,
} from '@/app/(main)/revenue/utils/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
	const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		...options,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || `HTTP error! status: ${response.status}`);
	}

	return data;
}

const revenueApi = {
	getConfig: async (): Promise<RevenueConfig | null> => {
		const result = await apiRequest<RevenueConfig>('/revenue/config');
		if (result.error) {
			throw new Error(result.error);
		}
		return result.data || null;
	},

	createOrUpdateConfig: async (
		data: CreateRevenueConfigData
	): Promise<RevenueConfig> => {
		const result = await apiRequest<RevenueConfig>('/revenue/config', {
			method: 'POST',
			body: JSON.stringify(data),
		});
		if (result.error) {
			throw new Error(result.error);
		}
		if (!result.data) {
			throw new Error('No data returned from save revenue config');
		}
		return result.data;
	},

	regenerateWebhookToken: async (): Promise<{ webhookToken: string }> => {
		const result = await apiRequest<{ webhookToken: string }>(
			'/revenue/config/regenerate-webhook-token',
			{
				method: 'POST',
			}
		);
		if (result.error) {
			throw new Error(result.error);
		}
		if (!result.data) {
			throw new Error('No data returned from regenerate webhook token');
		}
		return result.data;
	},

	deleteConfig: async (): Promise<{ success: boolean }> => {
		const result = await apiRequest<{ success: boolean }>('/revenue/config', {
			method: 'DELETE',
		});
		if (result.error) {
			throw new Error(result.error);
		}
		if (!result.data) {
			throw new Error('No data returned from delete revenue config');
		}
		return result.data;
	},
};

const revenueKeys = {
	all: ['revenue'] as const,
	config: () => [...revenueKeys.all, 'config'] as const,
};

export function useRevenueConfig() {
	const queryClient = useQueryClient();

	const {
		data: config,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: revenueKeys.config(),
		queryFn: async () => {
			try {
				return await revenueApi.getConfig();
			} catch (error) {
				// biome-ignore lint/complexity/noUselessCatch: databuddy handles catching client side errors
				throw error;
			}
		},
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

	const createOrUpdateMutation = useMutation({
		mutationFn: async (data: CreateRevenueConfigData) => {
			return await revenueApi.createOrUpdateConfig(data);
		},
		onSuccess: () => {
			toast.success('Revenue configuration saved successfully');
			queryClient.invalidateQueries({ queryKey: revenueKeys.config() });
			queryClient.invalidateQueries({
				predicate: (query) => {
					return query.queryKey[0] === 'batch-dynamic-query';
				},
			});
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to save revenue configuration');
		},
	});

	const regenerateTokenMutation = useMutation({
		mutationFn: async () => {
			return await revenueApi.regenerateWebhookToken();
		},
		onSuccess: () => {
			toast.success('Webhook token regenerated successfully');
			queryClient.invalidateQueries({ queryKey: revenueKeys.config() });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to regenerate webhook token');
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			return await revenueApi.deleteConfig();
		},
		onSuccess: () => {
			toast.success('Revenue configuration deleted successfully');
			queryClient.invalidateQueries({ queryKey: revenueKeys.config() });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete revenue configuration');
		},
	});

	return {
		config,
		isLoading,
		isError,
		isCreating: createOrUpdateMutation.isPending,
		isRegeneratingToken: regenerateTokenMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createOrUpdateConfig: createOrUpdateMutation.mutate,
		regenerateWebhookToken: regenerateTokenMutation.mutate,
		deleteConfig: deleteMutation.mutate,
		refetch,
	};
}
