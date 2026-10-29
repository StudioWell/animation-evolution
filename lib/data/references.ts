import { ADDED, ADDED_2, CHECKED, external, youtube } from "@/lib/data/helpers";
import type { Resource } from "@/lib/types";

/**
 * Curated references: footage, professional reels, breakdowns and motion
 * capture to study. Titles, channels, dates, lengths and views come from each
 * watch page (lib/data/youtube-snapshot.ts); descriptions are this library's own
 * notes on what each video teaches. Videos stay on their original platforms.
 *
 * media: game · anime · film · animation (animated work) · live-action (real footage)
 * Techniques and movements are derived from categories (lib/config/categories.ts).
 */
type Data = Parameters<typeof youtube>[1];
const first = { kind: "reference" as const, addedAt: ADDED };
const second = { kind: "reference" as const, addedAt: ADDED_2 };
const ref = (id: string, data: Omit<Data, "kind" | "addedAt">) => youtube(id, { ...second, ...data });

export const REFERENCES: Resource[] = [
  // ---------- First pass (2026-10-26) ----------
  youtube("Z1PCtIaM_GQ", {
    ...first,
    contentType: "breakdown",
    media: ["film", "live-action"],
    description:
      "A breakdown of how Jackie Chan stages fights: clear rhythm, props as weapons, real hits and reactions, and editing that lets each move land.",
    categories: ["fight-choreography", "action-scenes", "hit-reactions", "attacks", "staging"],
    tags: ["fight scene", "staging", "rhythm", "reaction", "props"],
    featured: 10,
  }),
  youtube("HEoUhlesN9E", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "A rapid-fire series of a hundred different walks from stop-motion animator Kevin Parry — a fast way to see how posture, rhythm and attitude change a character.",
    categories: ["walking", "body-language"],
    tags: ["walk", "attitude", "performance", "character walk"],
    featured: 9,
  }),
  youtube("vq9A5FD8G5w", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "A man walking filmed from the front and side in slow motion over a measuring grid — ideal for checking stride length, hip shift and arm swing.",
    categories: ["walking", "timing-spacing", "weight-balance"],
    tags: ["walk cycle", "grid", "front view", "side view", "slow motion"],
    featured: 8,
  }),
  youtube("lCpotGr0TB4", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "A run cycle reference with the frame number shown on each step, so you can read contact, passing and flight poses directly off the timing.",
    categories: ["running", "timing-spacing"],
    tags: ["run cycle", "frame numbers", "contact pose", "timing"],
    featured: 6,
  }),
  youtube("gUFzO12fSak", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "A knockout punch replayed in slow motion: study the transfer of weight, the head snap and how the body gives way after impact.",
    categories: ["punches", "impacts", "hit-reactions", "deaths", "slow-motion"],
    tags: ["knockout", "boxing", "impact", "slow motion", "head snap"],
    featured: 7,
  }),
  youtube("jMtosS43SLc", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "A punch to the face replayed in slow motion — watch how the head, face and body react in the frames after contact.",
    categories: ["punches", "impacts", "hit-reactions", "slow-motion"],
    tags: ["punch", "face", "slow motion", "impact", "deformation"],
  }),
  youtube("bWm2psdIrQU", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "Longsword sparring footage from a historical European martial arts school — real guards, binds, parries and footwork at full speed.",
    categories: ["melee-weapons", "blocking-parrying", "dodging", "martial-arts"],
    tags: ["longsword", "hema", "sparring", "parry", "footwork"],
    featured: 5,
  }),
  youtube("FPSk0Xu19uI", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description:
      "Climbing analysis of a cross move that carries momentum from hold to hold — good reference for weight shifts and flow in climbing animation.",
    categories: ["climbing-traversal", "momentum", "weight-balance"],
    tags: ["climbing", "bouldering", "momentum", "weight shift"],
  }),
  youtube("doaQC-S8de8", {
    ...first,
    contentType: "breakdown",
    media: ["film", "live-action"],
    description:
      "How Kurosawa layers movement — of actors, groups, weather and camera — so every shot carries energy. Essential for staging and camera work.",
    categories: ["camera", "staging", "action-scenes"],
    tags: ["staging", "composition", "camera", "blocking", "film"],
    featured: 8,
  }),
  external({
    ...first,
    verification: CHECKED,
    id: "bandai-namco-motion-dataset",
    url: "https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset",
    source: "github",
    format: "dataset",
    title: "Bandai Namco Research Motion Dataset",
    creator: "Bandai Namco Research",
    publishedAt: null,
    contentType: "mocap",
    media: [],
    description:
      "Two free motion-capture datasets in BVH: daily activities, fighting and dancing performed in many styles, plus locomotion and hand actions. Licensed CC BY-NC 4.0.",
    categories: ["motion-capture", "walking", "martial-arts", "body-language"],
    tags: ["mocap", "bvh", "dataset", "styles", "free"],
    accessNote: "Licensed CC BY-NC 4.0 (non-commercial). Read the repository's license before use.",
    featured: 4,
  }),
  external({
    ...first,
    verification: CHECKED,
    id: "wikipedia-the-horse-in-motion",
    url: "https://en.wikipedia.org/wiki/The_Horse_in_Motion",
    source: "wikipedia",
    format: "photo-study",
    title: "The Horse in Motion",
    creator: "Eadweard Muybridge",
    publishedAt: null,
    contentType: "reference",
    media: ["live-action"],
    description:
      "Muybridge's 1878 photo sequences of a galloping horse, which revealed leg positions artists had been drawing wrong — an early landmark of motion study.",
    categories: ["running", "creatures", "timing-spacing"],
    tags: ["muybridge", "chronophotography", "gallop", "animal locomotion", "history"],
    accessNote: "Links to the Wikipedia article about the 1878 series. Creator is the original photographer.",
  }),
  youtube("STyhoKG23b4", {
    ...first,
    contentType: "breakdown",
    media: ["film", "live-action"],
    description:
      "A video essay on how Jackie Chan sells being hit on screen — how the reaction is timed and how the body absorbs and passes on the blow.",
    categories: ["hit-reactions", "stunts", "fight-choreography"],
    tags: ["hit reaction", "stunt", "selling a hit", "film"],
    featured: 3,
  }),
  youtube("KXPb6SLFka4", {
    ...first,
    contentType: "reference",
    media: [],
    description:
      "A side-by-side of a limp ragdoll and NaturalMotion's Endorphin character physics — a clear lesson in why falls need muscle and intent.",
    categories: ["ragdoll", "falling", "procedural"],
    tags: ["ragdoll", "endorphin", "physics", "falling", "comparison"],
    featured: 4,
  }),
  youtube("keKc-GwBlng", {
    ...first,
    contentType: "breakdown",
    media: ["game"],
    description: "An explainer on how games simulate ragdoll bodies — useful background before you set up or animate around physics-driven falls.",
    categories: ["ragdoll", "falling", "game-animation"],
    tags: ["ragdoll", "game physics", "explainer"],
  }),
  youtube("SgGpPRBTBTI", {
    ...first,
    contentType: "breakdown",
    media: ["film", "live-action"],
    description: "Professional stuntwomen break down film stunts, good and bad — useful for falls, impacts and what makes a stunt read as real on screen.",
    categories: ["stunts", "falling", "action-scenes", "fight-choreography"],
    tags: ["stunts", "falls", "breakdown", "film"],
  }),
  youtube("pJMgNLWgHBs", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description: "An actor performing anger and frustration as facial-animation reference — watch how the brows, eyes and mouth build the expression.",
    categories: ["facial-expressions", "emotions"],
    tags: ["facial expression", "anger", "acting reference"],
  }),
  youtube("YTnyn0lWBsk", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description: "A forward jump presented at 24 frames per second, so you can step through take-off, flight and landing frame by frame.",
    categories: ["jumping", "timing-spacing"],
    tags: ["jump", "24fps", "frame by frame"],
  }),
  youtube("jZKvJY6gDfg", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description: "A pitcher's delivery at 1000 fps — a textbook example of anticipation, weight transfer and follow-through in a throw.",
    categories: ["lifting-throwing", "anticipation-follow-through", "momentum", "slow-motion"],
    tags: ["throw", "pitching", "slow motion", "follow through"],
  }),
  youtube("bAkEd8r7Nnw", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description: "Katana cuts filmed in 4K slow motion — reference for blade arcs, follow-through and what happens to the target.",
    categories: ["melee-weapons", "impacts", "slow-motion"],
    tags: ["katana", "sword", "slow motion", "cut"],
  }),
  youtube("ihEpzjIxd3g", {
    ...first,
    contentType: "reference",
    media: ["live-action"],
    description: "Dogs running and jumping in slow motion — quadruped gait, stretch through the spine and landings for creature animators.",
    categories: ["creatures", "running", "jumping", "slow-motion"],
    tags: ["quadruped", "dog", "slow motion", "creature"],
  }),

  // ---------- Second pass (2026-10-28): live-action reference ----------
  ref("maO16f6wcCA", {
    contentType: "reference",
    media: ["live-action"],
    description:
      "A hundred kicks from taekwondo, karate, capoeira, tricking and more, performed one after another — a fast catalogue of chamber, pivot and recovery for any kick you need to animate.",
    categories: ["kicks", "martial-arts"],
    tags: ["kick", "taekwondo", "martial arts", "catalogue"],
    featured: 8,
  }),
  ref("gwNVprZR6fQ", {
    contentType: "reference",
    media: ["live-action"],
    description:
      "Spinning kicks from 360 up to 900 degrees in slow motion — study how the head spots, the arms wind the spin and the support foot pivots before the kick lands.",
    categories: ["kicks", "martial-arts", "slow-motion", "momentum"],
    tags: ["kick", "spin", "slow motion", "taekwondo"],
  }),
  ref("egDRS_6Ga8E", {
    contentType: "reference",
    media: ["live-action"],
    description:
      "A short self-shot reference of a person lifting a box, offered free by its creator — a compact clip for weight shift, bent-knee lifting and effort.",
    categories: ["lifting-throwing", "weight-balance"],
    tags: ["lift", "weight", "acting reference"],
  }),
  ref("ZtAhVtC-qlk", {
    contentType: "reference",
    media: ["film", "live-action"],
    description:
      "A practice action short from the 87Eleven stunt team — real fight choreography shot and edited for camera, good for studying how hits, reactions and cuts are timed together.",
    categories: ["fight-choreography", "martial-arts", "action-scenes"],
    tags: ["fight scene", "stunt", "choreography", "film"],
    featured: 5,
  }),

  // ---------- Breakdowns of films, series and games ----------
  ref("dKmKjnDaN6U", {
    contentType: "breakdown",
    media: ["film", "live-action"],
    works: ["John Wick"],
    description:
      "Martial artist and action actor Scott Adkins talks through John Wick fight scenes — a practitioner's view of what makes close-quarters action read clearly on camera.",
    categories: ["fight-choreography", "martial-arts", "firearms", "action-scenes"],
    tags: ["fight scene", "gun-fu", "breakdown", "film"],
    featured: 6,
  }),
  ref("DEXEKq7qTlA", {
    contentType: "breakdown",
    media: ["film", "live-action"],
    description:
      "Stuntmen react to film sword fights, good and bad — useful for seeing which guards, cuts and parries sell real danger and which ones read as fake.",
    categories: ["melee-weapons", "blocking-parrying", "fight-choreography"],
    tags: ["sword", "parry", "breakdown", "film"],
  }),
  ref("OL83p4GxAvw", {
    contentType: "breakdown",
    media: ["film", "live-action"],
    description:
      "Stunt professionals react to Hollywood stunts, good and bad — useful for learning what makes a fall or impact look convincing on screen.",
    categories: ["stunts", "falling", "action-scenes"],
    tags: ["stunts", "falls", "breakdown", "film"],
  }),
  ref("oe_pLp5iihc", {
    contentType: "breakdown",
    media: ["film", "live-action"],
    description:
      "Professional stunt performers demonstrate falls seen in films and TV and explain the technique behind each — how the body is placed to take an impact.",
    categories: ["falling", "stunts", "impacts"],
    tags: ["falls", "stunts", "high fall", "breakdown"],
    featured: 5,
  }),
  ref("FLB_sLTgbPk", {
    contentType: "breakdown",
    media: ["anime", "film"],
    works: ["Demon Slayer: Kimetsu no Yaiba Infinity Castle"],
    description:
      "The ufotable team explains how the Infinity Castle film was animated, shared on the official Oscars channel — a rare first-hand look at sword combat, camera and effects in modern anime.",
    categories: ["stylized", "action-scenes", "melee-weapons", "camera"],
    tags: ["anime", "sakuga", "sword", "breakdown"],
    featured: 10,
  }),
  ref("XYCZzHWa9zY", {
    contentType: "breakdown",
    media: ["anime"],
    works: ["Demon Slayer: Kimetsu no Yaiba"],
    description:
      "An animator-focused breakdown of Demon Slayer's standout fight cuts — who animated them and how timing, effects and camera combine in its sword battles.",
    categories: ["stylized", "action-scenes", "melee-weapons"],
    tags: ["anime", "sakuga", "sword", "key animation"],
  }),
  ref("BjvWZXJwyuM", {
    contentType: "breakdown",
    media: ["anime"],
    works: ["Mob Psycho 100"],
    description:
      "A breakdown of Mob Psycho 100's first episode and the animators behind it — a close look at how strong poses and bold timing create energy.",
    categories: ["stylized", "posing", "timing-spacing"],
    tags: ["anime", "sakuga", "timing", "key animation"],
  }),
  ref("gzu7zW1vp4U", {
    contentType: "reference",
    media: ["anime"],
    works: ["My Hero Academia"],
    description:
      "The \"1st SMASH\" scene from My Hero Academia, shared by the TOHO animation channel — a clear anime punch with huge anticipation, impact frames and aftermath.",
    categories: ["punches", "stylized", "impacts", "anticipation-follow-through"],
    tags: ["anime", "punch", "impact", "anticipation"],
  }),
  ref("GKmxCdwQf8c", {
    contentType: "breakdown",
    media: ["animation", "film"],
    works: ["Spider-Man: Into the Spider-Verse"],
    description:
      "Sony Pictures Imageworks shows how Miles Morales was brought to life — a short official look at character animation in the film's comic-book style.",
    categories: ["stylized", "body-language", "posing"],
    tags: ["stylized", "stepped timing", "breakdown", "film"],
    featured: 9,
  }),
  ref("1Nw_c_CqPso", {
    contentType: "breakdown",
    media: ["animation", "film"],
    works: ["Spider-Man: Into the Spider-Verse"],
    description:
      "The filmmakers explain how Into the Spider-Verse makes every frame tell story like a comic panel — a lesson in dynamic staging and composition.",
    categories: ["staging", "stylized", "posing"],
    tags: ["staging", "composition", "stylized", "film"],
  }),
  ref("9jH0wDp5GnQ", {
    contentType: "breakdown",
    media: ["animation", "film"],
    works: ["Spider-Man: Into the Spider-Verse"],
    description:
      "A professional animator explains how Spider-Verse broke CG conventions — animating on twos, smears and hand-drawn effects — and why it works.",
    categories: ["stylized", "timing-spacing"],
    tags: ["stylized", "on twos", "smear", "breakdown"],
  }),
  ref("45vtNADT24w", {
    contentType: "breakdown",
    media: ["animation", "film"],
    works: ["The Bad Guys 2"],
    description:
      "A professional animator reacts to The Bad Guys 2 and points out its techniques — stylized timing, posing and graphic shapes you can borrow for appealing motion.",
    categories: ["stylized", "posing", "timing-spacing"],
    tags: ["stylized", "posing", "breakdown", "film"],
  }),
  ref("8nZCK6vi_Kc", {
    contentType: "breakdown",
    media: ["animation", "film"],
    works: ["Puss in Boots: The Last Wish"],
    description:
      "A behind-the-scenes look at how the final Wishing Star battle in DreamWorks' Puss in Boots: The Last Wish was produced — stylized sword choreography in a feature film.",
    categories: ["fight-choreography", "melee-weapons", "stylized", "action-scenes"],
    tags: ["sword", "stylized", "breakdown", "film"],
  }),
  ref("RHElv9Kk9gY", {
    contentType: "reference",
    media: ["animation"],
    works: ["Arcane"],
    description:
      "An animation test published on the official League of Legends channel — an early look at the style and character animation of Arcane.",
    categories: ["stylized", "body-language"],
    tags: ["stylized", "animation test", "series"],
  }),
  ref("Mz4-38d3-AE", {
    contentType: "breakdown",
    media: ["animation"],
    works: ["Arcane"],
    description:
      "Part one of the official Arcane documentary: how Riot Games and Fortiche set out to make the series — context for its art direction and animation pipeline.",
    categories: ["stylized", "workflow"],
    tags: ["documentary", "series", "workflow"],
  }),
  ref("DIPL-IHldog", {
    contentType: "breakdown",
    media: ["animation"],
    description:
      "An animated overview of many martial-art styles in twelve minutes — a quick primer on stances and signature techniques before you design a character's fighting style.",
    categories: ["martial-arts", "kicks", "punches"],
    tags: ["martial arts", "explainer", "styles"],
  }),
  ref("kZsboyfs-L4", {
    contentType: "breakdown",
    media: ["game", "anime"],
    works: ["Guilty Gear Xrd", "Dragon Ball FighterZ"],
    description:
      "How Arc System Works made 3D fighters look like hand-drawn anime — limited frames, held poses and smears — explained by a game-animation analyst.",
    categories: ["stylized", "game-animation", "timing-spacing", "attacks"],
    tags: ["anime", "fighting game", "on twos", "breakdown"],
    featured: 8,
  }),
  ref("7Dga-UqdBR8", {
    contentType: "breakdown",
    media: ["game"],
    works: ["Overwatch"],
    description:
      "How Overwatch gives each hero personality through first-person hands and weapons alone — a breakdown of readable, characterful viewmodel animation.",
    categories: ["game-animation", "body-language", "firearms"],
    tags: ["first person", "personality", "breakdown", "game"],
  }),
  ref("M_zhvfBbvaA", {
    contentType: "breakdown",
    media: ["game"],
    works: ["Punch-Out!!"],
    description:
      "How Punch-Out!! makes its boxers look good and feel responsive at the same time — telegraphed wind-ups, clear hit reactions and timing that teaches the player.",
    categories: ["punches", "hit-reactions", "anticipation-follow-through", "game-animation"],
    tags: ["punch", "telegraph", "game feel", "breakdown"],
  }),
  ref("cdu5yLO9lkc", {
    contentType: "breakdown",
    media: ["game"],
    description:
      "A long comparison of dodge and roll animations across many games, judging how each looks and feels — a reference library of evasive movement in one video.",
    categories: ["dodging", "game-animation"],
    tags: ["dodge", "roll", "comparison", "game feel"],
  }),

  // ---------- Professional game & film animation reels ----------
  ref("HiRw_bI-8fQ", {
    contentType: "reference",
    media: ["game"],
    works: ["Horizon Zero Dawn"],
    description:
      "Guerrilla animator Richard Oud's reel from Horizon Zero Dawn — study how large machines keep readable weight, wind-ups and personality in gameplay.",
    categories: ["creatures", "demo-reels", "game-animation"],
    tags: ["creature", "machine", "reel", "game"],
    featured: 6,
  }),
  ref("biikw9-8I8k", {
    contentType: "reference",
    media: ["game"],
    works: ["Horizon Forbidden West"],
    description:
      "Richard Oud's Horizon Forbidden West reel — creature and character gameplay animation to compare with the first game and see how a style evolves.",
    categories: ["creatures", "demo-reels", "game-animation"],
    tags: ["creature", "machine", "reel", "game"],
  }),
  ref("fwxKIv7oicE", {
    contentType: "reference",
    media: ["game"],
    works: ["Total War: Warhammer III"],
    description:
      "Creature animation from Total War: Warhammer III by Rebecca Belle — big monsters whose weight has to read from a strategy-game camera.",
    categories: ["creatures", "demo-reels", "game-animation"],
    tags: ["creature", "monster", "reel", "game"],
  }),
  ref("y_c31RDz3UU", {
    contentType: "reference",
    media: ["game"],
    works: ["Destiny 2: The Final Shape"],
    description:
      "Gameplay animation for combatants and bosses from Destiny 2: The Final Shape, posted by the animator — enemy attacks designed to be readable in a shooter.",
    categories: ["creatures", "demo-reels", "game-animation"],
    tags: ["enemy", "boss", "reel", "game"],
  }),
  ref("DOaFbR-woRs", {
    contentType: "reference",
    media: ["game"],
    works: ["Destiny"],
    description: "Victor Chavez's showreel from Destiny — professional shooter gameplay animation to study for clarity and responsiveness.",
    categories: ["demo-reels", "game-animation"],
    tags: ["reel", "shooter", "game"],
  }),
  ref("sA9FX4OLa48", {
    contentType: "reference",
    media: ["game"],
    works: ["Halo 5: Guardians"],
    description: "Travis Howe's Halo 5 animation reel — shipped AAA shooter animation, a benchmark for polish in gameplay animation.",
    categories: ["demo-reels", "game-animation"],
    tags: ["reel", "shooter", "game"],
  }),
  ref("ZwJW9H8ExcQ", {
    contentType: "reference",
    media: ["game"],
    works: ["Halo 4"],
    description: "Marcellis Wentz's gameplay animation reel from Halo 4 — compare with his process video to see the work behind each shot.",
    categories: ["demo-reels", "game-animation"],
    tags: ["reel", "shooter", "game"],
  }),
  ref("4mNlNPxdHDw", {
    contentType: "reference",
    media: ["game"],
    works: ["Apex Legends", "Titanfall 2"],
    description: "Shawn Wilson's showreel from nearly a decade on Apex Legends and Titanfall 2 — fast, readable first- and third-person shooter animation.",
    categories: ["demo-reels", "game-animation"],
    tags: ["reel", "shooter", "first person", "game"],
  }),
  ref("lY_HgtPWHOU", {
    contentType: "reference",
    media: ["game"],
    works: ["Bleeding Edge"],
    description: "Warwick Mellow's showreel of player-character animation for Bleeding Edge — how a cast of fighters gets distinct personalities and silhouettes.",
    categories: ["demo-reels", "game-animation", "body-language"],
    tags: ["reel", "personality", "game"],
  }),
  ref("xA7yKv_5L0s", {
    contentType: "reference",
    media: ["game"],
    works: ["Baldur's Gate 3"],
    description: "Bryan Noter's gameplay animation reel from Baldur's Gate 3, posted on his own channel — shipped character animation from a large RPG.",
    categories: ["demo-reels", "game-animation"],
    tags: ["reel", "rpg", "game"],
  }),
  ref("Pm9PRc-62KA", {
    contentType: "reference",
    media: ["game"],
    works: ["League of Legends"],
    description: "Adam Turnbull's animation for Senna in League of Legends — stylized poses, heavy-weapon handling and strong silhouettes readable from far above.",
    categories: ["demo-reels", "game-animation", "stylized", "firearms"],
    tags: ["reel", "stylized", "weapon", "game"],
  }),
  ref("_diLtfa-SB4", {
    contentType: "reference",
    media: ["game"],
    works: ["DOOM: The Dark Ages"],
    description: "Skai Chow's gameplay animation reel from DOOM: The Dark Ages — aggressive, punchy combat animation with strong impact.",
    categories: ["demo-reels", "game-animation", "impacts"],
    tags: ["reel", "impact", "game"],
  }),
  ref("JLpv6IvaInI", {
    contentType: "reference",
    media: ["game"],
    works: ["DOOM: The Dark Ages"],
    description: "Chris Street's Glory Strike and Execute animations from DOOM: The Dark Ages — brutal finishers and how they stage impact in first person.",
    categories: ["finishers", "demo-reels", "game-animation", "impacts"],
    tags: ["finisher", "execution", "reel", "game"],
  }),
  ref("gkoh9tfv3-o", {
    contentType: "reference",
    media: ["game"],
    works: ["DOOM: The Dark Ages"],
    description: "Ray Chase's cinematic animation reel from DOOM: The Dark Ages — cutscene acting, camera and action staging from a shipped AAA game.",
    categories: ["cutscenes", "camera", "demo-reels"],
    tags: ["cinematic", "cutscene", "reel", "game"],
  }),
  ref("2FhUGWvWrzg", {
    contentType: "reference",
    media: ["game"],
    works: ["For Honor"],
    description: "Cinematic animation from For Honor, where the animator handled both characters and cameras — study how melee duels are staged for cutscenes.",
    categories: ["cutscenes", "camera", "melee-weapons", "demo-reels"],
    tags: ["cinematic", "sword", "camera", "reel"],
  }),
  ref("FdloLIT87SY", {
    contentType: "reference",
    media: ["game"],
    works: ["For Honor"],
    description: "Pascal Mimeault's For Honor reel after six years on the game — weighty melee weapon combat from a sword-fighting game known for its duels.",
    categories: ["melee-weapons", "demo-reels", "game-animation"],
    tags: ["sword", "melee", "reel", "game"],
  }),
  ref("9Uv4WYt_h5Y", {
    contentType: "reference",
    media: ["animation", "film"],
    works: ["Spider-Man: Across the Spider-Verse"],
    description: "Shots Brock Boyts animated on Spider-Man: Across the Spider-Verse — feature-film character animation in the series' stylized, stepped look.",
    categories: ["demo-reels", "stylized", "body-language"],
    tags: ["reel", "stylized", "film"],
  }),
  ref("yi8xJCoXgcQ", {
    contentType: "reference",
    media: ["live-action"],
    works: ["God of War"],
    description: "Phone footage an animator shot for reference while making God of War — shows how professionals act out moves themselves before animating.",
    categories: ["workflow", "game-animation"],
    tags: ["video reference", "self reference", "game"],
  }),

  // ---------- Motion capture ----------
  ref("6gskZdJ8rF8", {
    contentType: "mocap",
    media: ["game"],
    works: ["Sifu"],
    description: "PlayStation's behind-the-scenes look at Sifu: combat workshops and motion-capture sessions with a Pak Mei kung fu master to keep the fighting authentic.",
    categories: ["motion-capture", "martial-arts", "performance-capture"],
    tags: ["mocap", "kung fu", "behind the scenes", "game"],
    featured: 6,
  }),
  ref("RWoTUkaKjZY", {
    contentType: "mocap",
    media: ["game"],
    works: ["Street Fighter 6"],
    description: "Official behind-the-scenes footage of wrestler Kenny Omega performing motion capture for Street Fighter 6 — how a real performer's moves become a fighter.",
    categories: ["motion-capture", "performance-capture", "martial-arts"],
    tags: ["mocap", "wrestling", "behind the scenes", "game"],
  }),
  ref("AhupJ96FMq8", {
    contentType: "mocap",
    media: ["game"],
    works: ["Ghost of Yōtei"],
    description: "SuperAlloy Interactive's highlight reel of the finishers and combat they helped create for Ghost of Yōtei — stunt-driven motion capture for sword combat.",
    categories: ["motion-capture", "melee-weapons", "finishers"],
    tags: ["mocap", "sword", "finisher", "game"],
  }),
  ref("RZiIlw-fce4", {
    contentType: "mocap",
    media: [],
    description: "An overview of a 158-move, 60 fps swordsman motion-capture pack — strikes, parries, hits, deaths, walks and turns, handy for planning a melee move set.",
    categories: ["motion-capture", "melee-weapons", "blocking-parrying", "hit-reactions", "deaths", "walking"],
    tags: ["mocap", "sword", "move set", "unreal engine"],
  }),
  ref("SAtwQa8t_3g", {
    contentType: "breakdown",
    media: ["game"],
    works: ["Overgrowth"],
    description: "Wolfire Games demonstrates the procedural animation in Overgrowth — physics-aware movement and reactions generated from very few keyframes.",
    categories: ["procedural", "ragdoll", "game-animation"],
    tags: ["procedural animation", "physics", "game"],
  }),
];
