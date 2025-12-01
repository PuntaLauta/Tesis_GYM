import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Logo({ size = "md", showLink = true, className = "" }) {
  const { user } = useAuth();
  
  // Tamaños del logo
  const logoSizes = {
    sm: { logo: "h-8", text: "text-lg" },
    md: { logo: "h-12", text: "text-xl" },
    lg: { logo: "h-16", text: "text-2xl" },
    xl: { logo: "h-20", text: "text-3xl" }
  };
  
  const sizes = logoSizes[size] || logoSizes.md;
  
  // Determinar alineación: si className incluye items-start, usar items-start, sino items-center
  const alignment = className && className.includes('items-start') ? 'items-start' : (className && className.includes('items-center') ? 'items-center' : 'items-center');
  const finalClassName = className || alignment;
  
  const logoContent = (
    <div className={`flex flex-col ${finalClassName}`}>
      <img src={logo} alt="FitSense" className={`${sizes.logo} w-auto mb-1 self-center`} />
      <div className={`${sizes.text} font-bold flex items-baseline`}>
        <span className="text-gray-700">Fit</span>
        <span className="text-blue-600">Sense</span>
      </div>
    </div>
  );
  
  if (!showLink) {
    return logoContent;
  }
  
  return (
    <Link to={user ? "/" : "/home"} className={`flex flex-col ${finalClassName} hover:opacity-80 transition-opacity`}>
      {logoContent}
    </Link>
  );
}

