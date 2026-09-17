import type { MetadataRoute } from "next";

/**
 * Damit Android und iOS beim "Zum Startbildschirm hinzufügen" ein richtiges
 * App-Symbol und einen Namen bekommen, statt sich selbst etwas zusammenzubauen.
 *
 * ACHTUNG: Das Manifest und die Icons müssen im Proxy von der Zugangssperre
 * ausgenommen sein. Browser laden das Manifest häufig ohne Cookies – sonst
 * bliebe es gesperrt und das Symbol generisch.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HORTTIA by Veikko",
    short_name: "HORTTIA",
    description: "Das digitale Gartenjournal für unsere Familie",
    lang: "de-CH",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#f7f5ef",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // Android schneidet Symbole rund oder als Quadrat mit runden Ecken zu.
      // Diese Fassung ist randlos, damit dabei nichts vom Blatt abgeschnitten wird.
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
