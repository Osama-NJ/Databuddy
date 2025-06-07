"use client";

// Credits to better-auth for the inspiration

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageCircle } from "lucide-react";

const XIcon = () => (
	<svg 
		viewBox="0 0 24 24" 
		fill="currentColor" 
		aria-label="Twitter/X"
		className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors duration-300"
	>
		<title>Twitter/X</title>
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
	</svg>
);

const testimonials = [
	{
		name: "Dominik",
		profession: "Founder, Rivo.gg",
		link: "https://x.com/DominikDoesDev/status/1929921951000101188",
		description: "Hands down one of the sexiest analytic tools out there😍",
		avatar: "dominik.jpg",
		social: <XIcon />,
	},
	{
		name: "Bekacru", 
		profession: "Creator, Better-auth",
		description: "this looks great!",
		avatar: "bekacru.jpg",
	},
	{
		name: "Emma Thompson",
		profession: "Product Manager, CloudBase",
		description: "Migrated from Google Analytics - much better insights and 65x faster performance.",
		avatar: "ET",
	},
	{
		name: "David Park",
		profession: "Growth Lead, ScaleUp",
		description: "AI-powered insights helped us identify key user patterns we never saw before.",
		avatar: "DP",
	},
	{
		name: "Sarah Kim",
		profession: "Product Lead, TechStart",
		description: "Privacy-first approach helped us stay compliant while getting better insights.",
		avatar: "SK",
	},
	{
		name: "Alex Chen",
		profession: "Engineering Manager, DevCorp",
		description: "Setup was smooth and real-time data transformed our product decisions.",
		avatar: "AC",
	}
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
	const CardContent = () => (
		<div className="group flex flex-col justify-between h-[220px] rounded-xl border border-neutral-800/80 w-[420px] shrink-0 bg-neutral-900/70 backdrop-blur-sm shadow-inner shadow-neutral-950/50 transition-all duration-300 hover:border-neutral-700/80 hover:shadow-green-500/10">
			<p className="px-6 py-6 text-lg tracking-tight font-light text-neutral-200 text-pretty">
				&quot;{testimonial.description}&quot;
			</p>
			<div className="flex items-center h-[70px] gap-1 w-full border-t border-neutral-800/80 bg-neutral-900/20">
				<div className="flex items-center w-full gap-4 px-6 py-4">
					<Avatar className="w-10 h-10 border border-neutral-700">
						<AvatarImage src={testimonial.avatar.length > 2 ? testimonial.avatar : ""} />
						<AvatarFallback className="bg-neutral-800 text-neutral-300">
							{testimonial.avatar}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col flex-1 gap-0">
						<h5 className="text-base font-medium text-white">
							{testimonial.name}
						</h5>
						<p className="text-sm text-neutral-400 mt-[-2px]">
							{testimonial.profession}
						</p>
					</div>
				</div>
				{testimonial.social && (
					<>
						<div className="h-full w-[1px] bg-neutral-800/80" />
						<div className="flex items-center justify-center w-[70px] h-full">
							{testimonial.social}
						</div>
					</>
				)}
			</div>
		</div>
	);

	if (testimonial.link) {
		return (
			<Link href={testimonial.link} target="_blank" className="block">
				<CardContent />
			</Link>
		);
	}

	return <CardContent />;
}

function SlidingTestimonials({ testimonials: rowTestimonials, reverse = false }: { testimonials: typeof testimonials, reverse?: boolean }) {
	const duplicatedTestimonials = Array(15).fill(rowTestimonials).flat();
	
	return (
		<div 
			className="relative flex gap-5 overflow-hidden group"
		>
			<div 
				className="flex gap-5 shrink-0 group-hover:[animation-play-state:paused]"
				style={{
					animation: reverse 
						? "slide-right 120s linear infinite" 
						: "slide-left 120s linear infinite"
				}}
			>
				{duplicatedTestimonials.map((testimonial, index) => (
					<TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
				))}
			</div>
		</div>
	);
}

export default function Testimonials() {
	return (
		<>
			<style>{`
				@keyframes slide-left {
					from { transform: translateX(0%); }
					to { transform: translateX(-50%); }
				}
				@keyframes slide-right {
					from { transform: translateX(-50%); }
					to { transform: translateX(0%); }
				}
			`}</style>
			
			<div className="relative bg-gradient-to-b from-neutral-950/20 to-neutral-950/50 py-16">
				{/* Section header */}
				<div className="px-8 pb-12">
					<div className="flex items-center gap-4 mb-2">
						<div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
							<MessageCircle className="w-5 h-5 text-white" fill="currentColor"/>
						</div>
						<div>
							<h2 className="text-white text-2xl font-bold">
								What developers say
							</h2>
						</div>
					</div>
					<p className="text-neutral-400 text-sm max-w-2xl">
						Trusted by over 30+ early adopters.
					</p>
				</div>

				<div 
					className="flex flex-col gap-5"
					style={{
						maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
					}}
				>
					<SlidingTestimonials testimonials={testimonials.slice(0, Math.floor(testimonials.length / 2))} />
					<SlidingTestimonials testimonials={testimonials.slice(Math.floor(testimonials.length / 2))} reverse />
				</div>
			</div>
		</>
	);
} 