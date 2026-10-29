import type { Resource } from "@/lib/types";

/**
 * Descriptions for large batches of similar records — archived key-animation
 * cuts and demo reels — written once per language and filled in from each
 * record's own verified fields (creator, works, theme tag). Nothing here adds a
 * fact the record doesn't already carry.
 */
type Locale = "en" | "ru" | "ja" | "zh";
type Fields = Pick<Resource, "blurb" | "creator" | "works" | "tags" | "media">;

/** What a Sakugabooru cut is good for, keyed by its theme tag (tags[1]). */
const FOCUS: Record<string, Record<Locale, string>> = {
  fight: {
    en: "the fight choreography, impact timing and effects",
    ru: "хореографию боя, тайминг ударов и эффекты",
    ja: "殺陣、打撃のタイミング、エフェクト",
    zh: "打斗编排、打击节奏和特效",
  },
  acting: {
    en: "the acting choices, posing and timing",
    ru: "актёрские решения, позы и тайминг",
    ja: "芝居の選択、ポーズ、タイミング",
    zh: "表演选择、姿势和节奏",
  },
  running: {
    en: "the run — weight shifts, stride and overlapping action",
    ru: "бег — перенос веса, шаг и захлёст",
    ja: "走り — 重心移動、ストライド、フォロースルー",
    zh: "奔跑——重心转移、步幅和跟随动作",
  },
  walk: {
    en: "the walk and how character comes through the gait",
    ru: "походку и характер, который она передаёт",
    ja: "歩きと、歩き方に出るキャラクター性",
    zh: "走路，以及步态中体现的角色性格",
  },
  falling: {
    en: "the fall — weight, impact and follow-through",
    ru: "падение — вес, удар и инерцию",
    ja: "落下 — 重さ、衝撃、フォロースルー",
    zh: "坠落——重量、冲击和跟随动作",
  },
  animals: {
    en: "animal motion and how it is simplified into drawings",
    ru: "движение животных и то, как его упрощают в рисунке",
    ja: "動物の動きと、それを作画に落とし込む省略",
    zh: "动物运动，以及如何把它简化成画面",
  },
  creature: {
    en: "creature weight, scale and motion",
    ru: "вес, масштаб и движение существ",
    ja: "クリーチャーの重さ・スケール・動き",
    zh: "生物的重量、体型与动作",
  },
  dance: {
    en: "dance timing, rhythm and posing",
    ru: "тайминг, ритм и позы в танце",
    ja: "ダンスのタイミング、リズム、ポーズ",
    zh: "舞蹈的节奏、韵律和姿势",
  },
  crying: {
    en: "emotional acting and facial animation",
    ru: "эмоциональную игру и мимику",
    ja: "感情の芝居と表情作画",
    zh: "情感表演和面部动画",
  },
  sports: {
    en: "athletic body mechanics",
    ru: "механику тела в спорте",
    ja: "スポーツのボディメカニクス",
    zh: "运动中的身体力学",
  },
  genga: {
    en: "the key drawings and timing behind the finished cut",
    ru: "ключевые рисунки и тайминг, стоящие за готовой сценой",
    ja: "完成カットの裏にある原画とタイミング",
    zh: "成片背后的原画与节奏",
  },
  performance: {
    en: "performance, staging and posing",
    ru: "игру, мизансцену и позы",
    ja: "芝居、演出、ポーズ",
    zh: "表演、调度和姿势",
  },
  rotation: {
    en: "rotation and keeping volumes consistent as forms turn",
    ru: "вращение и сохранение объёмов при повороте",
    ja: "回り込みと、回転時の立体の保ち方",
    zh: "转身动作，以及转动时如何保持体积",
  },
};
const DEFAULT_FOCUS: Record<Locale, string> = {
  en: "timing, spacing and drawing choices",
  ru: "тайминг, интервалы и решения в рисунке",
  ja: "タイミング、スペーシング、作画の判断",
  zh: "节奏、间距和作画上的取舍",
};

function list(locale: Locale, works: readonly string[]): string {
  if (locale === "ja") return works.map((w) => `『${w}』`).join("、");
  if (locale === "zh") return works.map((w) => `《${w}》`).join("、");
  if (locale === "ru") return works.map((w) => `«${w}»`).join(", ");
  return works.length > 1 ? `${works.slice(0, -1).join(", ")} and ${works.at(-1)}` : (works[0] ?? "");
}

export function blurbText(locale: Locale, r: Fields): string {
  const who = r.creator ?? "";
  const works = r.works ?? [];
  const has = works.length > 0;
  const game = r.media.includes("game");
  switch (r.blurb) {
    case "sakuga":
    case "genga": {
      const focus = (FOCUS[r.tags[1] ?? ""] ?? DEFAULT_FOCUS)[locale];
      const work = works[0] ?? "";
      if (r.blurb === "genga") {
        return {
          en: `Production materials from ${work} by ${who}, archived on Sakugabooru. Compare them with the final cut to study ${focus}.`,
          ru: `Производственные материалы к «${work}» (${who}), архив Sakugabooru. Сравните их с готовой сценой, чтобы изучить ${focus}.`,
          ja: `『${work}』の制作素材（${who}、Sakugabooru収蔵）。完成カットと見比べて、${focus}を研究できます。`,
          zh: `《${work}》的制作资料（${who}），收录于 Sakugabooru。与成片对比，研究${focus}。`,
        }[locale];
      }
      return {
        en: `A cut from ${work} animated by ${who}, archived on Sakugabooru. Step through it frame by frame to study ${focus}.`,
        ru: `Сцена из «${work}», анимация — ${who}; архив Sakugabooru. Смотрите покадрово, чтобы изучить ${focus}.`,
        ja: `『${work}』より、${who}による作画カット（Sakugabooru収蔵）。コマ送りで${focus}を研究できます。`,
        zh: `《${work}》中由 ${who} 绘制的片段，收录于 Sakugabooru。逐帧观看，研究${focus}。`,
      }[locale];
    }
    case "student-reel":
      return {
        en: `An entry-level ${game ? "game animation" : "animation"} portfolio posted by ${who}. A useful benchmark for what a junior reel contains — compare its range, polish and sense of weight with your own work.`,
        ru: `Портфолио начинающего ${game ? "аниматора игр" : "аниматора"}, опубликованное на канале ${who}. Хороший ориентир того, что входит в рил джуниора: сравните разнообразие, чистоту и ощущение веса со своей работой.`,
        ja: `${who}が公開した、新人${game ? "ゲーム" : ""}アニメーターのポートフォリオ。新人リールの目安として、幅・仕上げ・重さの表現を自分の作品と比べてみましょう。`,
        zh: `由 ${who} 发布的入门级${game ? "游戏" : ""}动画作品集。可作为新人作品集的参照——把它的动作范围、完成度和重量感与自己的作品对比。`,
      }[locale];
    case "studio-reel":
      return {
        en: `Studio reel from ${who}${has ? `, featuring ${list("en", works)}` : ""}. Shows the range and polish a production animation team delivers across characters and projects.`,
        ru: `Шоурил студии ${who}${has ? ` (проекты: ${list("ru", works)})` : ""}. Показывает, какой диапазон и уровень отделки выдаёт производственная команда аниматоров на разных персонажах и проектах.`,
        ja: `${who}のスタジオリール${has ? `（${list("ja", works)}）` : ""}。制作チームがキャラクターやプロジェクトを越えて届ける幅と仕上がりがわかります。`,
        zh: `${who} 的工作室作品集${has ? `（${list("zh", works)}）` : ""}。展示专业动画团队在不同角色和项目中的产出范围与打磨水平。`,
      }[locale];
    case "rig-reel":
      return {
        en: `Rigging demo reel by ${who}${has ? `, with work from ${list("en", works)}` : ""}. Watch how the rigs deform under extreme poses and which controls a game rig gives animators.`,
        ru: `Рил по риггингу от ${who}${has ? ` (проекты: ${list("ru", works)})` : ""}. Посмотрите, как риги деформируются в крайних позах и какие контролы игровой риг даёт аниматору.`,
        ja: `${who}によるリギングのデモリール${has ? `（${list("ja", works)}）` : ""}。極端なポーズでの変形や、ゲーム用リグがアニメーターに用意するコントロールに注目。`,
        zh: `${who} 的绑定演示作品集${has ? `（${list("zh", works)}）` : ""}。观察绑定在极端姿势下的变形，以及游戏绑定为动画师提供了哪些控制器。`,
      }[locale];
    case "reel":
    default:
      return {
        en: `${game ? "Game animation" : "3D animation"} reel by ${who}${has ? `, with work from ${list("en", works)}` : ""}. Finished, production-quality motion — scrub through it to study posing, timing and how each action reads.`,
        ru: `Шоурил ${game ? "игровой" : "3D-"}анимации от ${who}${has ? ` (проекты: ${list("ru", works)})` : ""}. Готовая анимация продакшен-уровня — смотрите покадрово, изучая позы, тайминг и читаемость каждого действия.`,
        ja: `${who}による${game ? "ゲーム" : "3D"}アニメーションのリール${has ? `（${list("ja", works)}の仕事を含む）` : ""}。製品レベルの完成モーション — コマ送りでポーズ、タイミング、動きの読みやすさを研究できます。`,
        zh: `${who} 的${game ? "游戏" : "三维"}动画作品集${has ? `，包含${list("zh", works)}中的工作` : ""}。成品级的动作——逐帧拖动，研究姿势、节奏和每个动作的可读性。`,
      }[locale];
  }
}

/** Short note for the details page, when the batch has one. */
export function blurbNote(locale: Locale, r: Pick<Resource, "blurb">): string | undefined {
  if (r.blurb !== "sakuga" && r.blurb !== "genga") return undefined;
  return {
    en: "Found through AnimationReference.org. Credits come from Sakugabooru's artist tags.",
    ru: "Найдено через AnimationReference.org. Авторы указаны по тегам художников на Sakugabooru.",
    ja: "AnimationReference.org経由で収集。クレジットはSakugabooruのアーティストタグに基づきます。",
    zh: "通过 AnimationReference.org 收集。署名来自 Sakugabooru 的画师标签。",
  }[locale];
}
