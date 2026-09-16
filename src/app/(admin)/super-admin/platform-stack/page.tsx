import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInfraMetrics } from "@/features/admin/services/infra.service";

export default async function PlatformStackPage() {
  const usageData = await getInfraMetrics();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Stack</h1>
        <p className="text-muted-foreground mt-2">
          A comprehensive directory of the technologies, frameworks, and cloud services powering the Greenroom platform.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {usageData.platforms.map((platform) => (
            <Card key={platform.name} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <CardDescription>{platform.role}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mt-1">{platform.plan}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 mt-auto">
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   {platform.description}
                 </p>
                 <div className="mt-4 pt-4 border-t text-xs font-medium text-muted-foreground flex justify-between">
                   <span>Cost</span>
                   <span>{platform.cost}</span>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
