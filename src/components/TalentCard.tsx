import { useState } from "react";
import { ChevronDown, ExternalLink, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TalentAvatar } from "@/components/TalentAvatar";
import type { TalentProfile } from "@/lib/talentBench";

/** One person on the Talent Bench: thumbnail, name (a link to the Toptal profile), location, short summary; highlights on request. */
export function TalentCard({ person, color, onEdit, onRemove }: { person: TalentProfile; color: { text: string; bg: string }; onEdit: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const more = person.headline || person.highlights.length > 0;
  return (
    <article className="rounded-lg border border-border bg-card p-3" data-testid={`talent-${person.id}`}>
      <div className="flex items-start gap-3">
        <TalentAvatar name={person.name} photo={person.photo} color={color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <a
              href={person.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold leading-snug text-foreground hover:underline"
              style={{ textDecorationColor: color.text }}
            >
              <span className="truncate">{person.name}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Opens the Toptal profile" />
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Actions for ${person.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit or move</DropdownMenuItem>
                <DropdownMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {person.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{person.location}</span>
            </p>
          )}
        </div>
      </div>
      {person.summary && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{person.summary}</p>}
      {more && (
        <>
          <button type="button" onClick={() => setOpen(!open)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: color.text }} aria-expanded={open}>
            {open ? "Less" : "More"}
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-2 space-y-1.5 border-t border-border pt-2">
              {person.headline && <p className="text-xs font-medium text-foreground">{person.headline}</p>}
              {person.highlights.length > 0 && (
                <ul className="space-y-1">
                  {person.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-snug text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color.text }} aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}
