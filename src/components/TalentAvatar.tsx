import { useState } from "react";
import { initialsOf } from "@/lib/talentBench";

/** A talent thumbnail: the photo, or initials when there is none or it does not load. */
export function TalentAvatar({ name, photo, color, size = 48 }: { name: string; photo?: string | null; color: { text: string; bg: string }; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (photo && !failed) {
    return <img src={photo} alt="" style={style} className="shrink-0 rounded-full border border-border object-cover" onError={() => setFailed(true)} referrerPolicy="no-referrer" />;
  }
  return (
    <span
      style={{ ...style, backgroundColor: color.bg, color: color.text, fontSize: Math.round(size * 0.36) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}
