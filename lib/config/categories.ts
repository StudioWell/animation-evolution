import type { Movement, Technique } from "@/lib/types";

/**
 * The library's category system: seven groups shared by references and
 * tutorials. Add a group or a category here and it appears in the filters, the
 * Categories page and search automatically — no UI changes needed.
 *
 * Each category can declare the Technique and Movement it belongs to. Those two
 * filters are derived from a record's categories when the library is built, so
 * they always agree with the categories shown on the card.
 */

export interface Category {
  slug: string;
  label: string;
  /** Extra words that should match this category in search. */
  keywords?: string[];
  techniques?: Technique[];
  movements?: Movement[];
}

export interface CategoryGroup {
  slug: string;
  label: string;
  description: string;
  categories: Category[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    slug: "character-movement",
    label: "Character Movement",
    description: "Walks, runs, jumps, falls and traversal — how a body travels through space.",
    categories: [
      { slug: "walking", label: "Walking", keywords: ["walk", "stride", "gait", "walk cycle"], techniques: ["locomotion"], movements: ["walking"] },
      { slug: "running", label: "Running", keywords: ["run", "sprint", "jog", "run cycle"], techniques: ["locomotion"], movements: ["running"] },
      { slug: "jumping", label: "Jumping and Landing", keywords: ["jump", "leap", "hop", "landing", "land"], techniques: ["locomotion"], movements: ["jumping"] },
      { slug: "falling", label: "Falls and Knockdowns", keywords: ["fall", "trip", "tumble", "knockdown", "high fall"], techniques: ["physics"], movements: ["falling"] },
      { slug: "climbing-traversal", label: "Climbing and Traversal", keywords: ["climb", "boulder", "parkour", "vault", "traversal", "swing", "web swinging"], techniques: ["locomotion"] },
      { slug: "creatures", label: "Creatures and Quadrupeds", keywords: ["creature", "quadruped", "monster", "animal", "dog", "horse", "machine", "boss"], techniques: ["locomotion", "body-mechanics"] },
    ],
  },
  {
    slug: "combat-weapons",
    label: "Combat and Weapons",
    description: "Strikes, defence, weapons and fight choreography that read clearly.",
    categories: [
      { slug: "punches", label: "Punches", keywords: ["punch", "jab", "hook", "uppercut", "strike", "fist"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "kicks", label: "Kicks", keywords: ["kick", "roundhouse", "spin kick", "taekwondo"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "attacks", label: "Attacks and Combos", keywords: ["attack", "combo", "chain", "string", "m1", "strike"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "heavy-attacks", label: "Heavy Attacks", keywords: ["heavy", "power attack", "smash", "wind up", "windup"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "blocking-parrying", label: "Blocking and Parrying", keywords: ["block", "parry", "guard", "defence", "defense"], techniques: ["combat"], movements: ["blocking"] },
      { slug: "dodging", label: "Dodges and Rolls", keywords: ["dodge", "evade", "roll", "sidestep"], techniques: ["combat"], movements: ["dodging"] },
      { slug: "hit-reactions", label: "Hit Reactions", keywords: ["hit reaction", "getting hit", "flinch", "stagger", "damage", "knockback"], techniques: ["combat", "physics"] },
      { slug: "deaths", label: "Deaths and Knockouts", keywords: ["death", "die", "knockout", "ko"], techniques: ["combat", "physics"], movements: ["falling"] },
      { slug: "finishers", label: "Finishers and Executions", keywords: ["finisher", "execution", "glory kill", "takedown", "fatality"], techniques: ["combat", "cinematics"], movements: ["attacking"] },
      { slug: "knives", label: "Knives and Daggers", keywords: ["knife", "knives", "dagger", "kali", "karambit", "machete", "throwing knife"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "blunt-weapons", label: "Hammers, Axes and Heavy Weapons", keywords: ["hammer", "warhammer", "war hammer", "axe", "mace", "sledgehammer", "club", "greatsword"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "polearms", label: "Spears, Staffs and Polearms", keywords: ["spear", "staff", "bo staff", "jo", "halberd", "polearm", "quarterstaff", "lance"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "bows", label: "Bows and Archery", keywords: ["bow", "archery", "arrow", "recurve", "longbow"], techniques: ["combat"] },
      { slug: "melee-weapons", label: "Swords and Melee Weapons", keywords: ["sword", "katana", "blade", "longsword", "axe", "spear", "two-handed", "hema", "fencing"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "firearms", label: "Guns and Firearms", keywords: ["gun", "pistol", "rifle", "shooting", "reload", "firearm"], techniques: ["combat"] },
      { slug: "martial-arts", label: "Martial Arts", keywords: ["karate", "kung fu", "judo", "boxing", "mma", "wrestling", "capoeira"], techniques: ["combat"] },
      { slug: "fight-choreography", label: "Fight Choreography", keywords: ["choreography", "fight scene", "action design", "stunt fight"], techniques: ["combat", "cinematics"] },
    ],
  },
  {
    slug: "first-person",
    label: "FPS: First-Person Animation",
    description: "Arms, hands and weapons animated for the first-person camera — reloads, inspects, melee and the rigs behind them.",
    categories: [
      { slug: "fps-weapons", label: "Reloads and Weapon Handling", keywords: ["fps", "first person", "viewmodel", "reload", "inspect", "jam", "malfunction", "weapon handling"], techniques: ["combat"] },
      { slug: "fps-reels", label: "First-Person Animation Reels", keywords: ["fps reel", "viewmodel reel", "first person reel", "first-person"] },
      { slug: "fps-melee", label: "First-Person Melee and Abilities", keywords: ["first person melee", "fpp melee", "first person sword", "first person magic"], techniques: ["combat"], movements: ["attacking"] },
      { slug: "fps-rigs", label: "FPS Arm Rigs and Setup", keywords: ["fps rig", "arm rig", "fps arms", "first person camera", "gun rig", "viewmodel setup"] },
      { slug: "fps-game-feel", label: "FPS Game Feel and Procedural Motion", keywords: ["game feel", "procedural", "weapon sway", "recoil", "true first person", "full body fps"], techniques: ["physics"] },
    ],
  },
  {
    slug: "body-mechanics-physics",
    label: "Body Mechanics and Physics",
    description: "Weight, balance, momentum and impact — the physics that sells every action.",
    categories: [
      { slug: "weight-balance", label: "Weight and Balance", keywords: ["weight", "balance", "centre of gravity", "center of gravity", "weight shift", "body mechanics"], techniques: ["body-mechanics"] },
      { slug: "momentum", label: "Momentum and Inertia", keywords: ["inertia", "momentum", "carry", "flow"], techniques: ["body-mechanics", "physics"] },
      { slug: "impacts", label: "Impacts and Collisions", keywords: ["impact", "collision", "contact", "crash"], techniques: ["physics"] },
      { slug: "ragdoll", label: "Ragdoll and Physics Simulation", keywords: ["ragdoll", "euphoria", "active ragdoll", "simulation", "physics"], techniques: ["physics"], movements: ["falling"] },
      { slug: "procedural", label: "Procedural Animation", keywords: ["procedural", "ik rig", "motion matching", "runtime"], techniques: ["physics"] },
      { slug: "lifting-throwing", label: "Lifting, Pushing and Throwing", keywords: ["lift", "push", "pull", "throw", "pitch", "carry", "box"], techniques: ["body-mechanics"] },
      { slug: "effects", label: "Effects Animation", keywords: ["effects", "fx", "fire", "smoke", "debris", "explosion", "liquid", "lightning", "sakuga effects"], techniques: ["physics"] },
      { slug: "slow-motion", label: "Slow-Motion Studies", keywords: ["slow motion", "slow mo", "slowmo", "high speed", "fps"], techniques: ["body-mechanics"] },
    ],
  },
  {
    slug: "character-acting",
    label: "Character Acting",
    description: "Faces, gestures and performance choices that make a character feel alive.",
    categories: [
      { slug: "facial-expressions", label: "Facial Expressions", keywords: ["face", "facial", "expression", "eyes", "brows"], techniques: ["acting"] },
      { slug: "body-language", label: "Body Language and Attitude", keywords: ["gesture", "posture", "attitude", "personality", "character"], techniques: ["acting"] },
      { slug: "emotions", label: "Emotions and Reactions", keywords: ["emotion", "reaction", "anger", "fear", "joy", "sadness", "surprise"], techniques: ["acting"] },
      { slug: "performance-capture", label: "Performance Capture", keywords: ["performance capture", "facial capture", "actor", "mocap actor"], techniques: ["acting"] },
    ],
  },
  {
    slug: "animation-principles",
    label: "Animation Principles",
    description: "Timing, spacing, arcs and appeal — the fundamentals under every shot.",
    categories: [
      { slug: "principles", label: "The 12 Principles", keywords: ["12 principles", "fundamentals", "principles of animation"] },
      { slug: "timing-spacing", label: "Timing and Spacing", keywords: ["timing", "spacing", "frames", "keyframe", "ease", "easing", "24fps", "frame by frame"] },
      { slug: "anticipation-follow-through", label: "Anticipation and Follow-Through", keywords: ["anticipation", "wind up", "follow through", "recovery", "ready pose"], techniques: ["body-mechanics"] },
      { slug: "overlap", label: "Overlap and Drag", keywords: ["overlap", "overlapping action", "drag", "secondary motion", "successive breaking"], techniques: ["body-mechanics"] },
      { slug: "posing", label: "Posing and Silhouettes", keywords: ["pose", "silhouette", "line of action", "key pose", "strong pose"] },
      { slug: "stylized", label: "Stylized and Anime Animation", keywords: ["stylized", "anime", "sakuga", "cartoony", "smear", "2d", "appeal", "stepped", "on twos"] },
    ],
  },
  {
    slug: "cinematics",
    label: "Cinematics",
    description: "Staging, camera, stunts and cutscenes borrowed from film.",
    categories: [
      { slug: "camera", label: "Camera and Framing", keywords: ["camera", "framing", "composition", "shot", "lens"], techniques: ["cinematics"] },
      { slug: "staging", label: "Staging and Composition", keywords: ["staging", "blocking", "composition", "storytelling", "frame"], techniques: ["cinematics"] },
      { slug: "action-scenes", label: "Action Scenes", keywords: ["action movie", "action scene", "set piece", "film"], techniques: ["cinematics", "combat"] },
      { slug: "stunts", label: "Stunts and Stunt Work", keywords: ["stunt", "stuntman", "stuntwoman", "high fall", "wire"], techniques: ["cinematics", "physics"], movements: ["falling"] },
      { slug: "cutscenes", label: "Cutscenes and Story Scenes", keywords: ["cinematic", "cutscene", "story mode", "intro", "narrative"], techniques: ["cinematics", "acting"] },
    ],
  },
  {
    slug: "tutorials-workflows",
    label: "Tutorials and Workflows",
    description: "Step-by-step lessons, tools and the pipelines professionals use.",
    categories: [
      { slug: "getting-started", label: "Getting Started", keywords: ["beginner", "basics", "intro", "first animation", "start"] },
      { slug: "workflow", label: "Blocking to Polish", keywords: ["workflow", "blocking", "splining", "polish", "pipeline", "progression", "process"] },
      { slug: "game-animation", label: "Gameplay Animation", keywords: ["game animation", "gameplay", "first person", "responsiveness", "game feel"] },
      { slug: "demo-reels", label: "Professional Demo Reels", keywords: ["reel", "showreel", "demo reel", "portfolio", "show reel"] },
      { slug: "rigging", label: "Rigging and Controls", keywords: ["rig", "rigify", "armature", "ik", "fk", "controls", "skeleton", "weight painting"] },
      { slug: "motion-capture", label: "Motion Capture and Retargeting", keywords: ["mocap", "motion capture", "bvh", "retarget", "mixamo", "cleanup"] },
      { slug: "graph-editor", label: "Keys and Graph Editor", keywords: ["graph editor", "f-curves", "curves", "keyframes", "dope sheet", "curve editor", "interpolation"] },
    ],
  },
];

export const ALL_CATEGORIES: (Category & { group: string })[] = CATEGORY_GROUPS.flatMap((g) =>
  g.categories.map((c) => ({ ...c, group: g.slug })),
);

const categoryMap = new Map(ALL_CATEGORIES.map((c) => [c.slug, c]));
const groupMap = new Map(CATEGORY_GROUPS.map((g) => [g.slug, g]));

export function getCategory(slug: string) {
  return categoryMap.get(slug);
}

export function getGroup(slug: string) {
  return groupMap.get(slug);
}

export function categoryLabel(slug: string): string {
  return categoryMap.get(slug)?.label ?? slug;
}

export function isKnownCategory(slug: string): boolean {
  return categoryMap.has(slug);
}

export function isKnownGroup(slug: string): boolean {
  return groupMap.has(slug);
}

/** Techniques and movements implied by a set of categories (deduplicated, in config order). */
export function deriveFacets(categories: readonly string[]): { techniques: Technique[]; movements: Movement[] } {
  const techniques = new Set<Technique>();
  const movements = new Set<Movement>();
  for (const slug of categories) {
    const c = categoryMap.get(slug);
    c?.techniques?.forEach((t) => techniques.add(t));
    c?.movements?.forEach((m) => movements.add(m));
  }
  return { techniques: [...techniques], movements: [...movements] };
}
