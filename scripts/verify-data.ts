/**
 * Library health check.
 *   npm run verify:data
 *
 * Always: validates every curated record (allowlisted URLs, known categories, unique ids).
 * With YOUTUBE_API_KEY set: checks every curated YouTube video against the official API and
 * reports deleted/private/age-restricted videos and title changes. Exit code 1 on problems,
 * so it can run in CI on a schedule.
 */
import { CURATED_LIBRARY, validateRecord } from "@/lib/data";
import { REFERENCES } from "@/lib/data/references";
import { TUTORIALS } from "@/lib/data/tutorials";
import { THIRD_SAKUGA, THIRD_YOUTUBE } from "@/lib/data/collection-3";
import { FOURTH_PASS } from "@/lib/data/collection-4";
import { fetchVideos, mapVideo, youtubeConfigured } from "@/lib/sources/youtube";

async function main() {
  let problems = 0;
  const all = [...REFERENCES, ...TUTORIALS, ...THIRD_YOUTUBE, ...THIRD_SAKUGA, ...FOURTH_PASS];

  for (const record of all) {
    const issues = validateRecord(record);
    if (issues.length) {
      problems += 1;
      console.log(`✗ ${record.id}: ${issues.join("; ")}`);
    }
  }

  const byMethod = new Map<string, number>();
  for (const r of CURATED_LIBRARY) byMethod.set(r.verification?.method ?? "none", (byMethod.get(r.verification?.method ?? "none") ?? 0) + 1);
  console.log(`Library: ${all.filter((r) => r.kind === "reference").length} references, ${all.filter((r) => r.kind === "tutorial").length} tutorials (${THIRD_SAKUGA.length} from Sakugabooru)`);
  console.log(`Verification: ${[...byMethod].map(([k, v]) => `${k}=${v}`).join(", ")}`);

  if (!youtubeConfigured()) {
    console.log("YOUTUBE_API_KEY not set — skipping live availability check.");
  } else {
    const yt = CURATED_LIBRARY.filter((r) => r.youtubeId);
    const videos = await fetchVideos(yt.map((r) => r.youtubeId!));
    for (const r of yt) {
      const v = videos.get(r.youtubeId!);
      if (!v || v === "missing") {
        problems += 1;
        console.log(`✗ ${r.id}: deleted or private on YouTube — remove it or replace the link`);
        continue;
      }
      const live = mapVideo(v, r.kind);
      if (!live) continue;
      if (live.availability !== "available") {
        problems += 1;
        console.log(`✗ ${r.id}: ${live.availability} on YouTube`);
      }
      if (live.title !== r.title) console.log(`! ${r.id}: title changed → "${live.title}"`);
      if (r.creator === null && live.creator) console.log(`! ${r.id}: channel confirmed as "${live.creator}" — update the record`);
    }
    console.log(`Checked ${yt.length} YouTube videos.`);
  }

  console.log(problems ? `\n${problems} problem(s) found.` : "\nAll records OK.");
  process.exitCode = problems ? 1 : 0;
}

void main();
