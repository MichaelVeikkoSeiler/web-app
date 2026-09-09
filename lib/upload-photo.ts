import { upload } from "@vercel/blob/client";

/**
 * Ist diese Seite das Schaufenster?
 *
 * Gelesen wird ein unsichtbarer Marker, den der Server nur im Demo-Modus
 * ausgibt — dieselbe Quelle wie der Hinweisstreifen. Eine eigene öffentliche
 * Umgebungsvariable würde irgendwann von der serverseitigen abweichen.
 *
 * WICHTIG: Das hier ist reine Benutzerführung, kein Schutz. Der eigentliche
 * Riegel sitzt serverseitig in /api/blob/upload und antwortet mit 401.
 */
function istSchaufenster() {
  return typeof document !== "undefined" && document.querySelector("[data-demo-mode]") !== null;
}

async function uploadImage(file: File) {
  if (istSchaufenster()) {
    // Bewusst ein harter Seitenwechsel statt router.push(): Diese Funktion ist
    // keine Komponente und hat keinen Router. Der vollstaendige Neuaufbau raeumt
    // ausserdem den halb begonnenen Upload-Vorgang mit auf.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/demo-hinweis";
    throw new Error("Schaufenster-Ansicht: Hochladen ist deaktiviert.");
  }

  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
  });
  return blob.url;
}

export const uploadPlantPhoto = uploadImage;
export const uploadAnimalPhoto = uploadImage;
export const uploadHeroImage = uploadImage;
export const uploadZoneImage = uploadImage;
export const uploadPlantDocPhoto = uploadImage;
