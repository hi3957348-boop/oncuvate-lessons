import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const clips = [
  ["vocab-photographic-memory.mp3", "Photographic memory. An unusually strong ability to remember what you see. Cam uses her photographic memory to store a busy scene."],
  ["vocab-carriage.mp3", "Carriage. A small wheeled bed or seat for a baby. The baby rested in a carriage near the bench."],
  ["vocab-insulated.mp3", "Insulated. Made to keep heat in or out. The insulated bag kept the bottle ready."],
  ["vocab-squirm.mp3", "Squirm. To twist and move because you are uncomfortable. The baby began to squirm before waking."],
  ["vocab-alarm.mp3", "Alarm. A warning sound that signals danger or trouble. A loud alarm changed the quiet moment."],
  ["vocab-commotion.mp3", "Commotion. Noisy and confused activity. The runner caused a commotion in the mall."],
  ["vocab-bump-into.mp3", "Bump into. To hit someone by accident while moving. He bumped into shoppers as he ran."],
  ["vocab-clutch.mp3", "Clutch. To hold something very tightly. A frightened shopper clutched her bag."],
  ["vocab-cradle.mp3", "Cradle. To hold someone gently and carefully. Eric cradled the baby in one arm."],
  ["vocab-cooperation.mp3", "Cooperation. Working together to help. The officer asked everyone for cooperation."],
  ["vocab-suspect.mp3", "Suspect. A person thought to be connected to a crime. The description pointed police toward one suspect."],
  ["vocab-apprehend.mp3", "Apprehend. To catch and arrest someone. Officers hurried to apprehend the runner."],
  ["vocab-evidence.mp3", "Evidence. Information that helps show what is true. Page evidence can strengthen a detective's idea."],
  ["vocab-witness.mp3", "Witness. A person who saw or heard an event. A witness explained what happened inside."],
  ["vocab-handcuff.mp3", "Handcuff. To put metal restraints around a person's wrists. The police handcuffed the man they stopped."],
  ["vocab-declare.mp3", "Declare. To say something firmly and clearly. A witness declared that the first idea was wrong."],
  ["focus-ch1.mp3", "Chapter one. Where are Cam and Eric? What are they doing before the alarm? Which visible details does Cam store?"],
  ["question-ch1-1.mp3", "What were Cam and Eric doing before the alarm?"],
  ["question-ch1-2.mp3", "Which two details did Cam store from the sudden scene?"],
  ["focus-ch2.mp3", "Chapter two. Who comes out of the store? Which direction does each person move? What object or item goes with each person?"],
  ["question-ch2-1.mp3", "Who left the jewelry store after the alarm?"],
  ["question-ch2-2.mp3", "Track one person from Chapter two. Record the person, direction, object, and page."],
  ["focus-ch3.mp3", "Chapter three. Who gives the inside story? What did each witness see or not see? Which new fact changes the first guess?"],
  ["question-ch3-1.mp3", "Who are the witnesses Cam and Eric question?"],
  ["question-ch3-2.mp3", "What do the witnesses say happened inside?"],
  ["question-ch3-3.mp3", "Which new evidence changes the first suspect idea?"],
  ["practice-riverlight.mp3", "Riverlight Mall was crowded after lunch. A red alarm light flashed above a small kiosk. Most shoppers turned toward the glass exit. One person in a gray coat ran the other way. A paper bag fell beside an empty teal carriage. Mina noticed red laces and an empty hand. Then the runner stopped and looked back. Why?"],
];

let apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey && process.argv[2]) {
  const envText = await readFile(process.argv[2], "utf8");
  apiKey = envText.match(/^\uFEFF?OPENAI_API_KEY=(.+)$/m)?.[1]?.trim();
}
if (!apiKey) throw new Error("OPENAI_API_KEY is required.");

const outputDir = fileURLToPath(new URL("./assets/audio/", import.meta.url));
await mkdir(outputDir, { recursive: true });

for (const [filename, input] of clips) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "coral",
      input,
      instructions: "Speak in clear, warm, natural American English for an upper-elementary learner. Use a calm teacher-like tone, lively but not theatrical. Pause naturally at punctuation.",
      response_format: "mp3",
    }),
  });
  if (!response.ok) {
    throw new Error(`${filename}: ${response.status} ${await response.text()}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(join(outputDir, filename), bytes);
  console.log(`${filename} ${bytes.length}`);
}

console.log(`Generated ${clips.length} MP3 files.`);
