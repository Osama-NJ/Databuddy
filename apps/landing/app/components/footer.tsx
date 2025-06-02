import Link from "next/link"
import { 
  Twitter, 
  Linkedin 
} from "lucide-react"
import { competitors } from "../(main)/compare/data"

// Generate competitor links dynamically
const getCompetitorLinks = () => {
  return competitors
    .filter(c => c.id !== "Databuddy")
    .map(competitor => ({
      name: `vs ${competitor.name}`,
      href: `/compare/${competitor.id}`
    }));
};

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Demo", href: "/demo" },
      { name: "FAQ", href: "/faq" },
      { name: "Get Started", href: "https://app.databuddy.cc" },
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "https://docs.databuddy.cc" },
      { name: "Support", href: "/contact" },
      { name: "Privacy Policy", href: "/privacy-policy" }, 
      { name: "Terms of Service", href: "/terms" },
    ]
  },
  {
    title: "Compare",
    links: getCompetitorLinks()
  }
]

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/databuddyps" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/databuddyps" },
]

export default function Footer() {
  
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-5">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
          <div className="col-span-2 md:col-span-3">
            <Link href="/" className="inline-block text-xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
              Databuddy
            </Link>
            <div className="flex space-x-3 mt-2">
              {socialLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          
          {footerLinks.map((group, index) => (
            <div key={group.title} className="col-span-1 md:col-span-2">
              <h3 className="font-medium text-white text-sm">{group.title}</h3>
              <ul className="mt-1.5">
                {group.links.slice(0, 5).map((link) => (
                  <li key={link.name} className="mb-0.5">
                    <Link 
                      href={link.href}
                      className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-3 mt-3 border-t border-slate-800/50 text-xs">
          <p className="text-slate-500">
            © {new Date().getFullYear()} Databuddy
          </p>
          
          <div className="flex items-center space-x-4 mt-1 md:mt-0">
            <Link href="/terms" className="text-slate-500 hover:text-sky-400">Terms</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-sky-400">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 