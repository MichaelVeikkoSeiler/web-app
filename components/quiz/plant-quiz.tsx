"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Sparkles } from "lucide-react";
import { playCorrectSound, playWrongSound, playQuizEndSound } from "@/lib/sounds";

export type QuizSubject = {
  id: string;
  kind: "plant" | "animal";
  name: string;
  germanName: string | null;
  scientificName: string;
  imageUrl: string;
  zoneIds: number[];
};

export type QuizZone = { id: number; name: string };

type Option = { id: string; label: string };
type Question = {
  type: "photo" | "latin" | "zone";
  subject: QuizSubject;
  prompt: string;
  options: Option[];
  correctOptionId: string;
};

const QUESTION_COUNT = 10;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildPhotoQuestions(pool: QuizSubject[]): Question[] {
  return pool.map((subject) => {
    const distractors = shuffle(pool.filter((s) => s.id !== subject.id)).slice(0, 2);
    const options = shuffle([subject, ...distractors]).map((s) => ({ id: s.id, label: s.name }));
    return {
      type: "photo",
      subject,
      prompt: "Wie heisst das?",
      options,
      correctOptionId: subject.id,
    };
  });
}

function buildLatinQuestions(pool: QuizSubject[]): Question[] {
  const eligible = pool.filter((s) => s.germanName);
  return eligible.map((subject) => {
    const distractors = shuffle(pool.filter((s) => s.id !== subject.id)).slice(0, 2);
    const options = shuffle([subject, ...distractors]).map((s) => ({
      id: s.id,
      label: s.scientificName,
    }));
    return {
      type: "latin",
      subject,
      prompt: `Wie lautet der lateinische Name von «${subject.germanName}»?`,
      options,
      correctOptionId: subject.id,
    };
  });
}

function buildZoneQuestions(pool: QuizSubject[], zones: QuizZone[]): Question[] {
  const eligible = pool.filter(
    (s) => s.zoneIds.length > 0 && zones.length - s.zoneIds.length >= 2,
  );
  return eligible.map((subject) => {
    const correctZoneId = shuffle(subject.zoneIds)[0];
    const correctZone = zones.find((z) => z.id === correctZoneId)!;
    const distractorZones = shuffle(zones.filter((z) => !subject.zoneIds.includes(z.id))).slice(
      0,
      2,
    );
    const options = shuffle([correctZone, ...distractorZones]).map((z) => ({
      id: `zone-${z.id}`,
      label: z.name,
    }));
    return {
      type: "zone",
      subject,
      prompt: `In welcher Zone kommt «${subject.name}» vor?`,
      options,
      correctOptionId: `zone-${correctZoneId}`,
    };
  });
}

function buildQuestions(pool: QuizSubject[], zones: QuizZone[]): Question[] {
  if (pool.length < 3) return [];
  const all = [
    ...buildPhotoQuestions(pool),
    ...buildLatinQuestions(pool),
    ...buildZoneQuestions(pool, zones),
  ];
  return shuffle(all).slice(0, Math.min(QUESTION_COUNT, all.length));
}

export function PlantQuiz({ pool, zones }: { pool: QuizSubject[]; zones: QuizZone[] }) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  if (pool.length < 3) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Noch nicht genügend Pflanzen oder Tiere mit Fotos für ein Quiz. Es braucht mindestens drei
        fotografierte Einträge.
      </p>
    );
  }

  function handleStart() {
    setQuestions(buildQuestions(pool, zones));
    setIndex(0);
    setSelectedId(null);
    setScore(0);
    setStarted(true);
  }

  if (!started || questions === null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-8 text-center">
        <Sparkles className="h-8 w-8 text-sage-dark" strokeWidth={1.5} />
        <p className="font-display text-lg text-forest">Wie gut kennst du deinen Garten?</p>
        <p className="max-w-sm text-sm text-forest-muted">
          {QUESTION_COUNT} zufällige Fragen zu deinen eigenen Pflanzen und Tieren — Fotos
          erkennen, lateinische Namen zuordnen und wissen, wer in welcher Zone zuhause ist.
        </p>
        <button
          onClick={handleStart}
          className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
        >
          Los geht's
        </button>
      </div>
    );
  }

  const finished = index >= questions.length;

  function handleRestart() {
    setQuestions(buildQuestions(pool, zones));
    setIndex(0);
    setSelectedId(null);
    setScore(0);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-8 text-center">
        <Leaf className="h-8 w-8 text-sage-dark" strokeWidth={1.5} />
        <p className="font-display text-lg text-forest">Dein Ergebnis</p>
        <p className="font-display text-4xl text-forest">
          {score} / {questions.length}
        </p>
        <p className="text-sm text-forest-muted">Nochmal spielen oder beenden?</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleRestart}
            className="flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
          >
            Nochmal spielen
          </button>
          <Link
            href="/"
            className="flex min-h-11 items-center justify-center rounded-full border border-border bg-warm-white px-6 text-sm font-medium text-forest active:scale-95"
          >
            Beenden
          </Link>
        </div>
      </div>
    );
  }

  const current = questions[index];

  function handleSelect(optionId: string) {
    if (selectedId !== null) return;
    setSelectedId(optionId);
    if (optionId === current.correctOptionId) {
      setScore((s) => s + 1);
      playCorrectSound();
    } else {
      playWrongSound();
    }
  }

  function handleNext() {
    setSelectedId(null);
    setIndex((i) => {
      const next = i + 1;
      if (next >= questions!.length) playQuizEndSound();
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-forest-muted">
        Frage {index + 1} von {questions.length}
      </p>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-warm-white sm:aspect-video">
        <Image
          key={current.subject.id}
          src={current.subject.imageUrl}
          alt={current.type === "photo" ? "Errate anhand des Fotos" : `Foto von ${current.subject.name}`}
          fill
          sizes="(max-width: 767px) 100vw, 700px"
          className="object-cover"
          priority
        />
      </div>

      <p className="text-sm font-medium text-forest">{current.prompt}</p>

      <div className="flex flex-col gap-2">
        {current.options.map((option) => {
          const showResult = selectedId !== null;
          const isCorrectOption = option.id === current.correctOptionId;
          const isWrongSelected = showResult && selectedId === option.id && !isCorrectOption;

          let style = "border-border bg-warm-white text-forest hover:border-sage";
          if (showResult && isCorrectOption) style = "border-care bg-care/40 text-care-text";
          else if (isWrongSelected) style = "border-attention bg-attention/40 text-attention-text";

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={showResult}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${style}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {selectedId !== null && (
        <button
          onClick={handleNext}
          className="flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
        >
          {index + 1 < questions.length ? "Weiter" : "Ergebnis anzeigen"}
        </button>
      )}
    </div>
  );
}
