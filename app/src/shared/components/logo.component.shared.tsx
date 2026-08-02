import logoImage from "@/assets/carelexa.png";

interface Props {
  isBackground: boolean;
  isExpanded?: boolean;
}

function Logo({ isBackground = false, isExpanded = true }: Props) {
  return (
    <div
      className={`flex items-center ${isExpanded ? "min-w-[7rem]" : "min-w-0 w-full justify-center pl-0"} px-1 py-1 ${isBackground && "rounded-[10px] bg-primary-foreground"} transition-all duration-300`}
    >
      <img
        src={logoImage}
        alt="Carelexa"
        className="h-7 w-7 rounded-full object-cover"
      />
      {isExpanded && (
        <b className="animate-in fade-in whitespace-nowrap text-sm font-semibold duration-300">
          Carelexa
        </b>
      )}
    </div>
  );
}

export default Logo;
