import { SOURCES } from "@/lib/config/sources";
import type { ContentType, Difficulty, DurationBucket, Medium, Movement, Software, SortOrder, SourceId, Technique } from "@/lib/types";

/**
 * Filter values and their English labels. Values are validated in
 * lib/search/params.ts; translated labels live in the message dictionaries
 * under the same keys (e.g. "ctype.breakdown", "media.anime").
 */

export const SORT_OPTIONS: { value: SortOrder; label: string; hint?: string }[] = [
  { value: "relevance", label: "Most relevant" },
  { value: "added", label: "Newest additions", hint: "Most recently added to this library" },
  { value: "newest", label: "Newest videos", hint: "By publish date, when known" },
  { value: "popular", label: "Most viewed", hint: "By views on the source, when known" },
];

export const DURATION_OPTIONS: { value: DurationBucket; label: string; hint?: string }[] = [
  { value: "any", label: "Any length" },
  { value: "short", label: "Under 4 minutes" },
  { value: "medium", label: "4 to 20 minutes" },
  { value: "long", label: "Over 20 minutes" },
];

export const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "reference", label: "References" },
  { value: "tutorial", label: "Tutorials" },
  { value: "breakdown", label: "Breakdowns" },
  { value: "mocap", label: "Motion Capture" },
];

export const MEDIA_OPTIONS: { value: Medium; label: string }[] = [
  { value: "game", label: "Games" },
  { value: "anime", label: "Anime" },
  { value: "film", label: "Films" },
  { value: "animation", label: "Animation" },
  { value: "live-action", label: "Live Action" },
];

export const TECHNIQUE_OPTIONS: { value: Technique; label: string }[] = [
  { value: "combat", label: "Combat" },
  { value: "body-mechanics", label: "Body Mechanics" },
  { value: "physics", label: "Physics" },
  { value: "locomotion", label: "Locomotion" },
  { value: "acting", label: "Acting" },
  { value: "cinematics", label: "Cinematics" },
];

export const MOVEMENT_OPTIONS: { value: Movement; label: string }[] = [
  { value: "walking", label: "Walking" },
  { value: "running", label: "Running" },
  { value: "jumping", label: "Jumping" },
  { value: "falling", label: "Falling" },
  { value: "attacking", label: "Attacking" },
  { value: "blocking", label: "Blocking" },
  { value: "dodging", label: "Dodging" },
];

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const SOFTWARE_OPTIONS: { value: Software; label: string; hint?: string }[] = [
  { value: "blender", label: "Blender" },
  { value: "roblox-studio", label: "Roblox Studio" },
  { value: "maya", label: "Maya" },
  { value: "cinema-4d", label: "Cinema 4D" },
  { value: "3ds-max", label: "3ds Max" },
  { value: "unreal-engine", label: "Unreal Engine" },
  { value: "unity", label: "Unity" },
  { value: "any", label: "General Animation", hint: "Principles that apply in any tool" },
];

export const SOURCE_OPTIONS: { value: SourceId; label: string }[] = Object.values(SOURCES).map((s) => ({
  value: s.id,
  label: s.label,
}));

export function labelFor<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
