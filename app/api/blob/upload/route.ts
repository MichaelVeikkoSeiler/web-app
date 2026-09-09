import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";

export async function POST(request: Request): Promise<NextResponse> {
  // Zweite Verteidigungslinie neben dem Proxy: Der Endpunkt legt Dateien im
  // Blob-Speicher ab und darf ohne gültigen Zugang nichts entgegennehmen.
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          addRandomSuffix: true,
          maximumSizeInBytes: 30 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload fehlgeschlagen" },
      { status: 400 },
    );
  }
}
