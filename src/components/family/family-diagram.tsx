import { Send, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FamilyMemberItem {
  id?: string;
  name: string;
  relationship: string;
  isJoined?: boolean;
}

export function FamilyDiagram({
  members = [],
  className,
}: {
  members?: FamilyMemberItem[];
  className?: string;
}) {
  // If no members supplied, show sample preview matching slide 5
  const displayMembers: FamilyMemberItem[] = members.length
    ? members
    : [
        { name: "Rahul", relationship: "Son", isJoined: true },
        { name: "Ananya", relationship: "Daughter", isJoined: true },
        { name: "Vikram", relationship: "Father", isJoined: false },
        { name: "Pooja", relationship: "Mother", isJoined: true },
      ];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-6 sm:p-10 select-none overflow-hidden",
        className
      )}
    >
      {/* Visual Circle Map */}
      <div className="relative size-72 sm:size-88 flex items-center justify-center">
        {/* Subtle connector circle */}
        <div className="absolute inset-8 rounded-full border-2 border-dashed border-border" />

        {/* Center Node (YOU) */}
        <div className="relative z-10 flex flex-col items-center justify-center size-24 sm:size-28 rounded-full bg-teal-dark text-white shadow-md border-4 border-white">
          <Shield className="size-6 mb-0.5 text-white" strokeWidth={2.5} />
          <span className="text-xs sm:text-sm font-bold tracking-wider">YOU</span>
          <span className="text-[10px] text-white/80">Protected</span>
        </div>

        {/* Orbital Member Nodes */}
        {displayMembers.map((member, idx) => {
          // Position members evenly around circle
          const total = displayMembers.length;
          const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
          // Radius from center
          const r = 115; // in px
          const x = Math.round(r * Math.cos(angle));
          const y = Math.round(r * Math.sin(angle));

          return (
            <div
              key={member.id ?? idx}
              className="absolute z-20 flex flex-col items-center"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center size-20 sm:size-22 rounded-full bg-surface shadow-xs transition-all",
                  member.isJoined
                    ? "border-4 border-teal text-navy"
                    : "border-4 border-border text-gray"
                )}
              >
                <span className="text-xs sm:text-sm font-bold truncate max-w-[70px]">
                  {member.name}
                </span>
                <span className="text-[10px] font-medium text-gray truncate max-w-[70px]">
                  {member.relationship}
                </span>

                {/* Telegram icon badge */}
                {member.isJoined && (
                  <div
                    className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#2AABEE] text-white shadow-xs"
                    title="Telegram Connected"
                  >
                    <Send className="size-3.5 fill-current" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-6 text-xs text-gray font-medium">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-teal" />
          <span>Connected via Telegram</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-border" />
          <span>Pending Invite</span>
        </div>
      </div>
    </div>
  );
}
