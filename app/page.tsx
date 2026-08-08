import { AlertCircle } from "lucide-react";
import { TodoList } from "@/components/home/todo-list";
import { getTodoItems } from "@/lib/plants-query";
import { HeroImage } from "@/components/home/hero-image";
import { getHeroImageUrl } from "@/lib/actions/settings";

export default async function Home() {
  const [todoItems, heroImageUrl] = await Promise.all([
    getTodoItems(),
    getHeroImageUrl(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <HeroImage initialUrl={heroImageUrl} />

      <div className="text-center">
        <h1 className="font-display text-3xl text-forest sm:text-4xl">
          Willkommen in deinem Garten
        </h1>
        <p className="mt-1 text-lg text-forest-muted">Euer digitales Gartenjournal</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg text-forest">
          <AlertCircle className="h-5 w-5 text-attention-text" />
          Traktanden
        </h2>
        <TodoList items={todoItems} />
      </section>
    </div>
  );
}
