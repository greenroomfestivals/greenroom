import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  return NextResponse.json(
    {
      name: "Stage Portal",
      short_name: "Stage",
      description: "Stage Judge Portal for Greenroom",
      start_url: `/${slug}/stage-portal`,
      display: "fullscreen",
      background_color: "#000000",
      theme_color: "#000000",
      icons: [
        {
          src: "/icons/stage-icon.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/stage-icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/stage-icon.png",
          sizes: "1024x1024",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    },
  );
}
