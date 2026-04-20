import logoSvg from "@/assets/toptal-logo-white.svg";

const ToptalLogo = ({ className = "" }: { className?: string }) => (
  <img
    src={logoSvg}
    alt="Toptal"
    className={className}
  />
);

export default ToptalLogo;
