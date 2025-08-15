'use client';

const logos = [
	{
		id: 1,
		name: 'BETTER-AUTH',
		src: 'https://www.better-auth.com',
		style: 'font-medium font-geist',
	},
	{
		id: 2,
		name: 'Rivo',
		src: 'https://rivo.gg',
		style: 'font-bold font-barlow',
	},
	{
		id: 3,
		name: 'Confinity',
		src: 'https://www.confinity.com',
		style: 'font-semibold',
	},
	{
		id: 4,
		name: 'Autumn',
		src: 'https://useautumn.com',
		style: 'font-bold',
	},
	{
		id: 5,
		name: 'OpenCut',
		src: 'https://opencut.app',
		style: 'font-semibold',
	},
	{
		id: 6,
		name: 'Call',
		src: 'https://joincall.co',
		style: 'font-semibold',
	},
	{
		id: 7,
		name: 'Mail0',
		src: 'https://0.email',
		style: 'font-semibold',
	},
	{
		id: 8,
		name: 'ServerStats',
		src: 'https://serverstats.bot',
		style: 'font-semibold',
	},
	{
		id: 9,
		name: 'xpand',
		src: 'https://xpandconf.com',
		style: 'font-semibold',
	},
	{
		id: 10,
		name: 'oss.now',
		src: 'https://oss.now/',
		style: 'font-semibold',
	},
	{
		id: 11,
		name: 'Terabits',
		src: 'https://www.terabits.xyz',
		style: 'font-semibold',
	},
	{
		id: 12,
		name: 'Dione',
		src: 'https://getdione.app',
		style: 'font-semibold',
	},
	{
		id: 13,
		name: 'Kubiks',
		src: 'https://kubiks.ai/',
		style: 'font-semibold',
	},
	{
		id: 14,
		name: 'Lindra',
		src: 'https://lindra.ai',
		style: 'font-semibold',
	},
	{
		id: 15,
		name: 'Snowseo',
		src: 'https://snowseo.com',
		style: 'font-semibold',
	},
	{
		id: 16,
		name: 'inbound',
		src: 'https://inbound.new/',
		style: 'font-semibold',
	},
];

import { LogoCarousel } from './logo-carousel';

export const TrustedBy = () => {
	return (
		<div className="relative flex h-full w-full flex-col items-center overflow-hidden pt-6 sm:pt-8">
			<div className="w-full space-y-8 text-center">
				<h2 className="mx-auto max-w-xs font-medium text-foreground text-xl leading-tight sm:text-2xl">
					Trusted by developers around the world
				</h2>
				<div className="w-full">
					<LogoCarousel logos={logos} />
				</div>
			</div>
		</div>
	);
};
