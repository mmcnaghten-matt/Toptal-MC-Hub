import { useState } from "react";
import { ChevronDown, ExternalLink, MapPin, MoreHorizontal, Pencil, Star, Trash2, UserMinus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TalentAvatar } from "@/components/TalentAvatar";
import { AREA_BY_ID } from "@/data/mcStorefront";
import { GM_ROLE_ID, MAX_FRACTIONAL_LEADERS, otherAreas, type Placement, type TalentProfile } from "@/lib/talentGuild";

interface Props {
  person: TalentProfile;
  /** The service area and role that put this card in its cell. */
  placement: Placement;
  color: { text: string; bg: string };
  /** Whether one more Fractional Leader fits in this service area (ignored when this person already is one). */
  canFlag: boolean;
  onEdit: () => void;
  onToggleFractional: () => void;
  onRemoveFromArea: () => void;
  onRemoveFromGuild: () => void;
}

/**
 * One person in one service area of the Talent Guild: thumbnail, name (a link to the Toptal profile), location, short summary; highlights on
 * request. A person in several areas has a card in each, with a note of the others; in the GM column a card can carry the Fractional Leader mark.
 */
export function TalentCard({ person, placement, color, canFlag, onEdit, onToggleFractional, onRemoveFromArea, onRemoveFromGuild }: Props) {
  const [open, setOpen] = useState(false);
  const isGm = placement.role === GM_ROLE_ID;
  const also = otherAreas(person.placements, placement.service_area).map((id) => AREA_BY_ID.get(id)?.name ?? id);
  const onlyArea = person.placements.length <= 1;
  const more = person.headline || person.highlights.length > 0;
  return (
    <article className="rounded-lg border border-border bg-card p-2.5" data-testid={`talent-${person.id}-${placement.service_area}`}>
      <div className="flex items-start gap-3">
        <TalentAvatar name={person.name} photo={person.photo} color={color} size={40} />
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
                <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit areas and roles</DropdownMenuItem>
                {isGm && (
                  <DropdownMenuItem onSelect={onToggleFractional} disabled={!placement.fractional_leader && !canFlag}>
                    <Star className="mr-2 h-4 w-4" />
                    {placement.fractional_leader ? "Remove Fractional Leader" : canFlag ? "Make Fractional Leader" : `Fractional Leader (${MAX_FRACTIONAL_LEADERS} of ${MAX_FRACTIONAL_LEADERS} used)`}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onRemoveFromArea} className="text-destructive focus:text-destructive">
                  <UserMinus className="mr-2 h-4 w-4" />
                  {onlyArea ? "Remove from Talent Guild" : "Remove from this area"}
                </DropdownMenuItem>
                {!onlyArea && (
                  <DropdownMenuItem onSelect={onRemoveFromGuild} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Remove from Talent Guild
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {placement.fractional_leader && (
            <p className="mt-0.5">
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: color.bg, color: color.text }} data-testid="fractional-leader-badge">
                <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                Fractional Leader
              </span>
            </p>
          )}
          {person.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{person.location}</span>
            </p>
          )}
        </div>
      </div>
      {person.summary && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{person.summary}</p>}
      {also.length > 0 && <p className="mt-1 text-[10px] leading-snug text-muted-foreground" data-testid="also-in">Also in: {also.join(" · ")}</p>}
      {more && (
        <>
          <button type="button" onClick={() => setOpen(!open)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: color.text }} aria-expanded={open}>
            {open ? "Less" : "More"}
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-1.5 space-y-1 border-t border-border pt-1.5">
              {person.headline && <p className="text-[11px] font-medium text-foreground">{person.headline}</p>}
              {person.highlights.length > 0 && (
                <ul className="space-y-1">
                  {person.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
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
