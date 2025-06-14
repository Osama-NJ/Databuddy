import Link from "next/link";
import Image from "next/image";

// Logo content without Link wrapper - for use in navigation where parent provides Link
export function LogoContent() {
    return (
        <div className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
                <Image
                    src="/logo.svg"
                    alt="DataBuddy Logo"
                    width={32}
                    height={32}
                    className="drop-shadow-sm"
                    priority
                />
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="
          font-mono
          text-lg 
          tracking-wider
          font-semibold
          leading-none
          select-none
          transition-colors 
          duration-200
          group-hover:opacity-80
        ">
                    DATABUDDY
                </h1>
            </div>
        </div>
    );
}

// Full Logo component with Link wrapper - for standalone use
export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
                <Image
                    src="/logo.svg"
                    alt="DataBuddy Logo"
                    width={32}
                    height={32}
                    className="drop-shadow-sm"
                    priority
                />
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="
          font-mono
          text-lg 
          tracking-wider
          font-semibold
          leading-none
          select-none
          transition-colors 
          duration-200
          group-hover:opacity-80
        ">
                    DATABUDDY
                </h1>
            </div>
        </Link>
    );
} 