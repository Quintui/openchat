"use client";

import { BrainIcon, CheckIcon, LoaderIcon, XIcon } from "lucide-react";
import type { WorkingMemory } from "@/config/working-memory";
import { cn } from "@/lib/utils";
import { Shimmer } from "./shimmer";

type WorkingMemoryUpdateProps = {
  state: string;
  input?: { memory: WorkingMemory };
  className?: string;
};

function formatMemorySummary(memory: WorkingMemory): string {
  const parts: string[] = [];
  if (memory.name) parts.push(`name: ${memory.name}`);
  if (memory.traits?.length) parts.push(`traits: ${memory.traits.join(", ")}`);
  if (memory.anythingElse) parts.push("notes updated");
  return parts.length > 0 ? parts.join(" · ") : "memory updated";
}

export function WorkingMemoryUpdate({ state, input, className }: WorkingMemoryUpdateProps) {
  if (state === "output-available") {
    return (
      <div className={cn("text-muted-foreground flex items-center gap-1.5 text-xs", className)}>
        <CheckIcon className="size-3.5" />
        <span>
          Remembered {input?.memory ? formatMemorySummary(input.memory) : "memory updated"}
        </span>
      </div>
    );
  }

  if (state === "output-error") {
    return (
      <div className={cn("text-destructive flex items-center gap-1.5 text-xs", className)}>
        <XIcon className="size-3.5" />
        <span>Failed to update memory</span>
      </div>
    );
  }

  // loading states: input-streaming, input-available
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", className)}>
      <BrainIcon className="text-muted-foreground size-3.5" />
      <Shimmer as="span" className="text-xs">
        Updating memory...
      </Shimmer>
    </div>
  );
}
