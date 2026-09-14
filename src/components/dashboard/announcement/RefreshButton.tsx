"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-9 text-muted-foreground hover:text-foreground"
      onClick={() => router.refresh()}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Refresh
    </Button>
  );
}
