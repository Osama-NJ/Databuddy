'use client';

import {
	BuildingsIcon,
	EnvelopeIcon,
	GearIcon,
	GlobeIcon,
	KeyIcon,
	PlusIcon,
	UserPlusIcon,
	UsersIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ApiKeyCreateDialog } from '@/components/organizations/api-key-create-dialog';
import { CreateOrganizationDialog } from '@/components/organizations/create-organization-dialog';
import { InviteMemberDialog } from '@/components/organizations/invite-member-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizations } from '@/hooks/use-organizations';

export function OrganizationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { activeOrganization, isLoading } = useOrganizations();
	const pathname = usePathname();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showInviteMemberDialog, setShowInviteMemberDialog] = useState(false);
	const [showCreateApiKeyDialog, setShowCreateApiKeyDialog] = useState(false);

	const getPageInfo = () => {
		if (pathname === '/organizations') {
			return {
				title: 'Organizations',
				description: 'Manage your organizations and team collaboration',
				icon: BuildingsIcon,
				actionButton: {
					text: 'New Organization',
					icon: PlusIcon,
					action: () => setShowCreateDialog(true),
				},
			};
		}
		if (pathname === '/organizations/members') {
			return {
				title: 'Team Members',
				description: 'Manage team members and their roles',
				icon: UsersIcon,
				requiresOrg: true,
				actionButton: {
					text: 'Invite Member',
					icon: UserPlusIcon,
					action: () => setShowInviteMemberDialog(true),
				},
			};
		}
		if (pathname === '/organizations/invitations') {
			return {
				title: 'Pending Invitations',
				description: 'View and manage pending team invitations',
				icon: EnvelopeIcon,
				requiresOrg: true,
				actionButton: {
					text: 'Send Invitation',
					icon: UserPlusIcon,
					action: () => setShowInviteMemberDialog(true),
				},
			};
		}
		if (pathname === '/organizations/settings') {
			return {
				title: 'General Settings',
				description: 'Manage organization name, slug, and basic settings',
				icon: GearIcon,
				requiresOrg: true,
			};
		}
		if (pathname === '/organizations/settings/websites') {
			return {
				title: 'Website Management',
				description: 'Manage websites associated with this organization',
				icon: GlobeIcon,
				requiresOrg: true,
			};
		}
		if (pathname === '/organizations/settings/api-keys') {
			return {
				title: 'API Keys',
				description: 'Create and manage API keys for this organization',
				icon: KeyIcon,
				requiresOrg: true,
				actionButton: {
					text: 'Create API Key',
					icon: PlusIcon,
					action: () => setShowCreateApiKeyDialog(true),
				},
			};
		}
		if (pathname === '/organizations/settings/danger') {
			return {
				title: 'Danger Zone',
				description: 'Irreversible and destructive actions',
				icon: WarningIcon,
				requiresOrg: true,
			};
		}
		return {
			title: 'Organizations',
			description: 'Manage your organizations and team collaboration',
			icon: BuildingsIcon,
			actionButton: {
				text: 'New Organization',
				icon: PlusIcon,
				action: () => setShowCreateDialog(true),
			},
		};
	};

	const {
		title,
		description,
		icon: Icon,
		requiresOrg,
		actionButton,
	} = getPageInfo();

	if (isLoading) {
		return (
			<div className="flex h-full flex-col">
				<div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
					<div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:gap-0 sm:px-6 sm:py-6">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-4">
								<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
									<Skeleton className="h-6 w-6" />
								</div>
								<div>
									<Skeleton className="h-8 w-48" />
									<Skeleton className="mt-1 h-4 w-64" />
								</div>
							</div>
						</div>
					</div>
				</div>
				<main className="flex-1 overflow-y-auto p-4 sm:p-6">
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-24 w-full" />
				</main>
			</div>
		);
	}

	if (requiresOrg && !activeOrganization) {
		return (
			<div className="flex h-full flex-col">
				<div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
					<div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:gap-0 sm:px-6 sm:py-6">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-4">
								<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
									<Icon
										className="h-6 w-6 text-primary"
										size={24}
										weight="duotone"
									/>
								</div>
								<div>
									<h1 className="truncate font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
										{title}
									</h1>
									<p className="mt-1 text-muted-foreground text-sm sm:text-base">
										{description}
									</p>
								</div>
							</div>
						</div>
						{actionButton && (
							<Button
								className="w-full rounded sm:w-auto"
								onClick={actionButton.action}
								size="sm"
							>
								<actionButton.icon className="mr-2 h-4 w-4" size={16} />
								{actionButton.text}
							</Button>
						)}
					</div>
				</div>

				<main className="flex-1 overflow-y-auto p-4 sm:p-6">
					<div className="mx-auto max-w-6xl">
						<Card className="p-6">
							<div className="text-center">
								<Icon
									className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
									size={48}
									weight="duotone"
								/>
								<h3 className="mb-2 font-semibold text-lg">
									Select an Organization
								</h3>
								<p className="text-muted-foreground text-sm">
									This feature requires an active organization.
								</p>
								<div className="mt-4">
									<Button
										className="rounded"
										onClick={() => setShowCreateDialog(true)}
										size="sm"
									>
										<BuildingsIcon className="mr-2 h-5 w-5" size={20} />
										Create organization
									</Button>
								</div>
							</div>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
				<div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:gap-0 sm:px-6 sm:py-6">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-4">
							<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
								<Icon
									className="h-6 w-6 text-primary"
									size={24}
									weight="duotone"
								/>
							</div>
							<div>
								<h1 className="truncate font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
									{title}
								</h1>
								<p className="mt-1 text-muted-foreground text-sm sm:text-base">
									{description}
								</p>
							</div>
						</div>
					</div>
					{actionButton && (
						<Button
							className="w-full rounded sm:w-auto"
							onClick={actionButton.action}
							size="sm"
						>
							<actionButton.icon className="mr-2 h-4 w-4" size={16} />
							{actionButton.text}
						</Button>
					)}
				</div>
			</div>

			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-6xl">{children}</div>
			</main>

			<CreateOrganizationDialog
				isOpen={showCreateDialog}
				onClose={() => setShowCreateDialog(false)}
			/>

			{activeOrganization && (
				<InviteMemberDialog
					onOpenChange={setShowInviteMemberDialog}
					open={showInviteMemberDialog}
					organizationId={activeOrganization.id}
				/>
			)}

			{activeOrganization && (
				<ApiKeyCreateDialog
					onOpenChange={setShowCreateApiKeyDialog}
					open={showCreateApiKeyDialog}
					organizationId={activeOrganization.id}
				/>
			)}
		</div>
	);
}
