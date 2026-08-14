"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Leaf, Loader2 } from "lucide-react";

type QuizPlant = { id: number; name: string; imageUrl: string };
type Question = { plant: QuizPlant; options: QuizPlant[] };

const QUESTION_COUNT = 5;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(pool: QuizPlant[]): Question[] {
  if (pool.length < 3) return [];
  const questionPlants = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
  return questionPlants.map((plant) => {
    const distractors = shuffle(pool.filter((p) => p.id !== plant.id)).slice(0, 2);
    return { plant, options: shuffle([plant, ...distractors]) };
  });
}

export function PlantQuiz({ pool }: { pool: QuizPlant[] }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Fragen werden erst clientseitig zufällig zusammengestellt, damit die
  // Zufallsauswahl nicht mit dem serverseitig gerenderten HTML kollidiert.
  useEffect(() => {
    setQuestions(buildQuestions(pool));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pool.length < 3) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Noch nicht genügend Pflanzen mit Fotos für ein Quiz. Es braucht mindestens drei
        Pflanzen mit Foto.
      </p>
    );
  }

  if (questions === null) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-warm-white p-10 text-forest-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const finished = index >= questions.length;

  function handleRestart() {
    setQuestions(buildQuestions(pool));
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
        <button
          onClick={handleRestart}
          className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  const current = questions[index];

  function handleSelect(optionId: number) {
    if (selectedId !== null) return;
    setSelectedId(optionId);
    if (optionId === current.plant.id) setScore((s) => s + 1);
  }

  function handleNext() {
    setSelectedId(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-forest-muted">
        Frage {index + 1} von {questions.length}
      </p>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-warm-white sm:aspect-video">
        <Image
          key={current.plant.id}
          src={current.plant.imageUrl}
          alt="Welche Pflanze ist das?"
          fill
          sizes="(max-width: 767px) 100vw, 700px"
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-col gap-2">
        {current.options.map((option) => {
          const showResult = selectedId !== null;
          const isCorrectOption = option.id === current.plant.id;
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
              {option.name}
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
