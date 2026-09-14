import type { Metadata, Viewport } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: "Stage Judge Portal",
    manifest: `/${slug}/stage-portal/manifest.webmanifest`,
    robots: {
      index: false,
      follow: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Stage Portal",
    },
    icons: {
      icon: [
        { url: "/icons/stage-icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/icons/stage-icon.png", type: "image/png", sizes: "512x512" }],
      shortcut: "/icons/stage-icon.png",
    },
    openGraph: {
      type: "website",
      title: "Stage Judge Portal | Greenroom",
      description: "Dedicated stage and judging portal for Greenroom festivals.",
      siteName: "Greenroom",
      images: [
        {
          url: "https://greenroomfestivals.in/icons/stage-icon.png",
          width: 512,
          height: 512,
          alt: "Stage Portal",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Stage Judge Portal | Greenroom",
      description: "Dedicated stage and judging portal for Greenroom festivals.",
      images: ["https://greenroomfestivals.in/icons/stage-icon.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#d72626",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StagePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-y-auto overflow-x-hidden bg-background">
      {children}
    </div>
  );
}
