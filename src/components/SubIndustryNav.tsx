import { SubIndustry } from "@/data/industryData";

interface Props {
  subIndustries: SubIndustry[];
  selected: SubIndustry | null;
  onSelect: (sub: SubIndustry) => void;
  colorVar: string;
}

export function SubIndustryNav({ subIndustries, selected, onSelect }: Props) {
  return (
    <div className="mb-8 flex flex-wrap gap-1 border-b border-border">
      {subIndustries.map((sub) => (
        <button
          key={sub.id}
          onClick={() => onSelect(sub)}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            selected?.id === sub.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {sub.name}
          {selected?.id === sub.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
