import { atom } from 'jotai';
import type { AssistantModel } from '@/app/(main)/websites/[id]/assistant/types/model';
import type { WebsiteDataTabProps } from '@/app/(main)/websites/[id]/_components/utils/types';
import type { Message } from '@/app/(main)/websites/[id]/assistant/types/message';
import type { RefObject } from 'react';

export const modelAtom = atom<AssistantModel>('chat');
export const websiteIdAtom = atom<string | null>(null);
export const websiteDataAtom = atom<WebsiteDataTabProps['websiteData'] | null>(null);
export const dateRangeAtom = atom<{ start_date: string; end_date: string; granularity: string } | null>(null);
export const messagesAtom = atom<Message[]>([]);
export const inputValueAtom = atom<string>('');
export const isLoadingAtom = atom<boolean>(false);
export const isRateLimitedAtom = atom<boolean>(false);
export const isInitializedAtom = atom<boolean>(false);
export const scrollAreaRefAtom = atom<RefObject<HTMLDivElement> | null>(null);
export const currentMessageAtom = atom<Message | undefined>(undefined); 