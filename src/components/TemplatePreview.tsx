import type { InvoiceTemplate } from "@/lib/types";

interface TemplatePreviewProps {
  template: InvoiceTemplate;
  className?: string;
  enlarged?: boolean;
}

export function TemplatePreview({ template, className = "", enlarged = false }: TemplatePreviewProps) {
  const scale = enlarged ? 1.2 : 1;
  
  switch (template) {
    case "modern-minimal":
      return <ModernMinimalPreview className={className} scale={scale} />;
    case "classic-professional":
      return <ClassicProfessionalPreview className={className} scale={scale} />;
    case "creative-bold":
      return <CreativeBoldPreview className={className} scale={scale} />;
    case "tech-startup":
      return <TechStartupPreview className={className} scale={scale} />;
    case "elegant":
      return <ElegantPreview className={className} scale={scale} />;
    case "corporate":
      return <CorporatePreview className={className} scale={scale} />;
    case "landscape":
      return <LandscapePreview className={className} scale={scale} />;
    case "blank":
      return <BlankPreview className={className} scale={scale} />;
    default:
      return <ModernMinimalPreview className={className} scale={scale} />;
  }
}

interface PreviewProps {
  className?: string;
  scale?: number;
}

function ModernMinimalPreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Logo left, company info right */}
      <rect x="10" y="10" width="30" height="30" fill="currentColor" opacity="0.2" rx="4" />
      <line x1="50" y1="15" x2="140" y2="15" stroke="currentColor" opacity="0.3" strokeWidth="2.5" />
      <line x1="50" y1="25" x2="120" y2="25" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <line x1="50" y1="32" x2="100" y2="32" stroke="currentColor" opacity="0.15" strokeWidth="1.5" />
      
      {/* Invoice title */}
      <text x="10" y="55" fill="currentColor" opacity="0.4" fontSize="8" fontWeight="600">INVOICE</text>
      
      {/* Line items header */}
      <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" opacity="0.2" strokeWidth="1" />
      
      {/* Line items */}
      <line x1="10" y1="78" x2="190" y2="78" stroke="currentColor" opacity="0.1" strokeWidth="0.5" />
      <line x1="10" y1="88" x2="190" y2="88" stroke="currentColor" opacity="0.1" strokeWidth="0.5" />
      <line x1="10" y1="98" x2="190" y2="98" stroke="currentColor" opacity="0.1" strokeWidth="0.5" />
      
      {/* Total */}
      <rect x="120" y="112" width="70" height="18" fill="currentColor" opacity="0.15" rx="4" />
      <text x="135" y="124" fill="currentColor" opacity="0.4" fontSize="7" fontWeight="600">TOTAL</text>
    </svg>
  );
}

function ClassicProfessionalPreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Centered header */}
      <rect x="70" y="8" width="60" height="8" fill="currentColor" opacity="0.3" rx="2" />
      <text x="100" y="25" fill="currentColor" opacity="0.4" fontSize="10" fontWeight="600" textAnchor="middle">INVOICE</text>
      
      {/* Business info centered */}
      <line x1="60" y1="35" x2="140" y2="35" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <line x1="70" y1="42" x2="130" y2="42" stroke="currentColor" opacity="0.15" strokeWidth="1" />
      
      {/* Two column layout */}
      <rect x="10" y="55" width="85" height="35" fill="currentColor" opacity="0.08" rx="4" />
      <rect x="105" y="55" width="85" height="35" fill="currentColor" opacity="0.08" rx="4" />
      
      {/* Table with borders */}
      <rect x="10" y="100" width="180" height="35" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2" rx="2" />
      <line x1="10" y1="112" x2="190" y2="112" stroke="currentColor" opacity="0.2" strokeWidth="1" />
      <line x1="10" y1="122" x2="190" y2="122" stroke="currentColor" opacity="0.15" strokeWidth="0.5" />
    </svg>
  );
}

function CreativeBoldPreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Bold header bar */}
      <rect x="0" y="0" width="200" height="35" fill="currentColor" opacity="0.2" />
      <rect x="10" y="10" width="25" height="25" fill="currentColor" opacity="0.4" rx="3" />
      <text x="45" y="25" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="700">INVOICE</text>
      
      {/* Asymmetric layout */}
      <rect x="10" y="45" width="75" height="30" fill="currentColor" opacity="0.1" rx="4" />
      <rect x="95" y="45" width="95" height="30" fill="currentColor" opacity="0.15" rx="4" />
      
      {/* Bold line items */}
      <rect x="10" y="85" width="180" height="8" fill="currentColor" opacity="0.2" rx="2" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" opacity="0.15" strokeWidth="2" />
      <line x1="10" y1="112" x2="190" y2="112" stroke="currentColor" opacity="0.15" strokeWidth="2" />
      
      {/* Bold total */}
      <rect x="110" y="125" width="80" height="12" fill="currentColor" opacity="0.3" rx="3" />
    </svg>
  );
}

function TechStartupPreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Angled header accent */}
      <polygon points="0,0 200,0 200,25 0,35" fill="currentColor" opacity="0.12" />
      
      {/* Logo top right */}
      <circle cx="175" cy="15" r="12" fill="currentColor" opacity="0.25" />
      
      {/* Modern grid layout */}
      <rect x="10" y="45" width="60" height="25" fill="currentColor" opacity="0.1" rx="6" />
      <rect x="75" y="45" width="60" height="25" fill="currentColor" opacity="0.08" rx="6" />
      <rect x="140" y="45" width="50" height="25" fill="currentColor" opacity="0.12" rx="6" />
      
      {/* Clean line items */}
      <line x1="10" y1="85" x2="190" y2="85" stroke="currentColor" opacity="0.25" strokeWidth="1.5" />
      <circle cx="15" cy="95" r="2" fill="currentColor" opacity="0.2" />
      <line x1="22" y1="95" x2="190" y2="95" stroke="currentColor" opacity="0.1" strokeWidth="1" />
      <circle cx="15" cy="105" r="2" fill="currentColor" opacity="0.2" />
      <line x1="22" y1="105" x2="190" y2="105" stroke="currentColor" opacity="0.1" strokeWidth="1" />
      
      {/* Modern total card */}
      <rect x="130" y="118" width="60" height="18" fill="currentColor" opacity="0.18" rx="9" />
    </svg>
  );
}

function ElegantPreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Subtle border */}
      <rect x="5" y="5" width="190" height="130" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2" rx="3" />
      
      {/* Refined header */}
      <line x1="15" y1="20" x2="185" y2="20" stroke="currentColor" opacity="0.15" strokeWidth="0.5" />
      <text x="100" y="17" fill="currentColor" opacity="0.35" fontSize="6" fontWeight="400" textAnchor="middle">INVOICE</text>
      
      {/* Elegant spacing */}
      <rect x="15" y="30" width="70" height="22" fill="currentColor" opacity="0.06" rx="3" />
      <rect x="115" y="30" width="70" height="22" fill="currentColor" opacity="0.06" rx="3" />
      
      {/* Refined table */}
      <line x1="15" y1="65" x2="185" y2="65" stroke="currentColor" opacity="0.2" strokeWidth="0.5" />
      <line x1="15" y1="78" x2="185" y2="78" stroke="currentColor" opacity="0.08" strokeWidth="0.5" />
      <line x1="15" y1="88" x2="185" y2="88" stroke="currentColor" opacity="0.08" strokeWidth="0.5" />
      <line x1="15" y1="98" x2="185" y2="98" stroke="currentColor" opacity="0.08" strokeWidth="0.5" />
      
      {/* Subtle total */}
      <line x1="130" y1="112" x2="185" y2="112" stroke="currentColor" opacity="0.15" strokeWidth="0.5" />
      <rect x="130" y="117" width="55" height="15" fill="currentColor" opacity="0.1" rx="2" />
    </svg>
  );
}

function CorporatePreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Corporate header */}
      <rect x="0" y="0" width="200" height="30" fill="currentColor" opacity="0.15" />
      <rect x="10" y="8" width="28" height="14" fill="currentColor" opacity="0.3" rx="2" />
      <text x="160" y="20" fill="currentColor" opacity="0.4" fontSize="9" fontWeight="600" textAnchor="end">INVOICE</text>
      
      {/* Formal layout */}
      <rect x="10" y="40" width="85" height="28" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.15" rx="2" />
      <text x="15" y="48" fill="currentColor" opacity="0.3" fontSize="5" fontWeight="600">FROM</text>
      
      <rect x="105" y="40" width="85" height="28" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.15" rx="2" />
      <text x="110" y="48" fill="currentColor" opacity="0.3" fontSize="5" fontWeight="600">TO</text>
      
      {/* Structured table */}
      <rect x="10" y="78" width="180" height="10" fill="currentColor" opacity="0.2" />
      <text x="15" y="85" fill="currentColor" opacity="0.4" fontSize="5" fontWeight="600">DESCRIPTION</text>
      <line x1="10" y1="95" x2="190" y2="95" stroke="currentColor" opacity="0.15" strokeWidth="0.5" />
      <line x1="10" y1="105" x2="190" y2="105" stroke="currentColor" opacity="0.15" strokeWidth="0.5" />
      
      {/* Formal total */}
      <rect x="120" y="118" width="70" height="18" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.12" rx="2" />
      <text x="130" y="129" fill="currentColor" opacity="0.4" fontSize="6" fontWeight="600">TOTAL</text>
    </svg>
  );
}

function LandscapePreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Wide format indicator */}
      <rect x="0" y="20" width="200" height="100" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" rx="4" />
      
      {/* Three column layout */}
      <rect x="10" y="30" width="55" height="35" fill="currentColor" opacity="0.1" rx="3" />
      <rect x="72" y="30" width="55" height="35" fill="currentColor" opacity="0.08" rx="3" />
      <rect x="135" y="30" width="55" height="35" fill="currentColor" opacity="0.12" rx="3" />
      
      {/* Wide table */}
      <line x1="10" y1="75" x2="190" y2="75" stroke="currentColor" opacity="0.2" strokeWidth="1" />
      <line x1="10" y1="85" x2="190" y2="85" stroke="currentColor" opacity="0.1" strokeWidth="0.5" />
      <line x1="10" y1="95" x2="190" y2="95" stroke="currentColor" opacity="0.1" strokeWidth="0.5" />
      
      {/* Footer area */}
      <rect x="10" y="105" width="90" height="10" fill="currentColor" opacity="0.08" rx="2" />
      <rect x="130" y="105" width="60" height="10" fill="currentColor" opacity="0.15" rx="2" />
      
      {/* Landscape label */}
      <text x="100" y="10" fill="currentColor" opacity="0.25" fontSize="6" fontWeight="500" textAnchor="middle">Wide Format</text>
    </svg>
  );
}

function BlankPreview({ className = "", scale = 1 }: PreviewProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full h-full ${className}`} style={{ transform: `scale(${scale})` }}>
      {/* Grid suggesting customizability */}
      <rect x="10" y="10" width="85" height="35" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" rx="4" />
      <rect x="105" y="10" width="85" height="35" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" rx="4" />
      <rect x="10" y="55" width="180" height="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" rx="4" />
      <rect x="10" y="95" width="85" height="35" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" rx="4" />
      <rect x="105" y="95" width="85" height="35" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" rx="4" />
      
      {/* Plus icons suggesting add blocks */}
      <circle cx="52" cy="27" r="8" fill="currentColor" opacity="0.1" />
      <path d="M52 23 L52 31 M48 27 L56 27" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      
      <circle cx="147" cy="27" r="8" fill="currentColor" opacity="0.1" />
      <path d="M147 23 L147 31 M143 27 L151 27" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      
      {/* Drag handle suggestion */}
      <circle cx="20" cy="70" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="20" cy="76" r="2" fill="currentColor" opacity="0.2" />
      
      <text x="100" y="73" fill="currentColor" opacity="0.25" fontSize="7" fontWeight="500" textAnchor="middle">Drag & Drop Blocks</text>
    </svg>
  );
}
