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
      icon: [{ url: "/icons/stage-icon.png", type: "image/png" }],
      apple: [{ url: "/icons/stage-icon.png", type: "image/png" }],
      shortcut: "/icons/stage-icon.png",
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
