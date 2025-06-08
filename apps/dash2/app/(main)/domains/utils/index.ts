import { toast } from "sonner";

export const cleanDomainInput = (input: string): string => {
  // Remove protocol if present
  let cleaned = input.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Remove any subdomains, keeping only the top-level domain
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts.slice(-2).join('.');
  }
  
  return cleaned;
};

export const validateDomainFormat = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};

export const formatRank = (rank: string | undefined): string => {
  if (!rank) return 'N/A';
  const num = Number.parseInt(rank, 10);
  if (Number.isNaN(num)) return 'N/A';
  return num.toLocaleString();
};

export const getTierInfo = (decimalRank: number) => {
  if (decimalRank >= 90) return { 
    tier: "Elite", 
    color: "bg-gradient-to-r from-purple-500 to-pink-500", 
    description: "Exceptional domain authority with world-class backlink profile"
  };
  if (decimalRank >= 70) return { 
    tier: "Excellent", 
    color: "bg-gradient-to-r from-green-500 to-emerald-500", 
    description: "Very strong domain authority with high-quality backlinks"
  };
  if (decimalRank >= 50) return { 
    tier: "Good", 
    color: "bg-gradient-to-r from-blue-500 to-cyan-500", 
    description: "Solid domain authority with decent backlink strength"
  };
  if (decimalRank >= 30) return { 
    tier: "Fair", 
    color: "bg-gradient-to-r from-yellow-500 to-orange-500", 
    description: "Moderate domain authority with room for improvement"
  };
  if (decimalRank >= 10) return { 
    tier: "Poor", 
    color: "bg-gradient-to-r from-orange-500 to-red-500", 
    description: "Low domain authority requiring significant SEO work"
  };
  return { 
    tier: "Very Poor", 
    color: "bg-gradient-to-r from-red-500 to-red-600", 
    description: "Minimal domain authority with very weak backlink profile"
  };
};

export const getRankColor = (decimalRank: number): string => {
  if (decimalRank >= 70) return "text-green-600";
  if (decimalRank >= 40) return "text-blue-600";
  if (decimalRank >= 20) return "text-yellow-600";
  return "text-red-600";
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}; 