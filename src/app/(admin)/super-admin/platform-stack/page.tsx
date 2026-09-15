import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getInfraMetrics } from "@/features/admin/services/infra.service";

export default async function PlatformStackPage() {
  const usageData = await getInfraMetrics();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Platform Stack & Usage
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor your active technology stack, real-time infrastructure usage,
          and estimated monthly costs.
        </p>
      </div>

      {/* OVERVIEW SECTION */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Estimated Cost (MTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usageData.totalCost}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div className="text-xl font-bold text-green-600">
              All Systems Operational
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approaching Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <div className="text-lg font-bold text-yellow-600">
              Neon Storage (40%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INFRASTRUCTURE USAGE CARDS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Infrastructure Usage</h2>
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
                    <div className="font-bold">{platform.cost}</div>
                    <Badge variant="outline" className="mt-1">
                      {platform.plan}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2 mt-auto">
                {platform.metrics.map((metric) => {
                  const percentage = metric.limit
                    ? (metric.used / metric.limit) * 100
                    : 0;
                  const isWarning = percentage > 80;

                  return (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">
                          {metric.label}
                        </span>
                        <span>
                          {metric.used.toLocaleString()}{" "}
                          {metric.limit
                            ? `/ ${metric.limit.toLocaleString()} ${metric.unit}`
                            : metric.unit}
                        </span>
                      </div>
                      {metric.limit ? (
                        <Progress
                          value={percentage}
                          indicatorClassName={
                            isWarning ? "bg-red-500" : "bg-primary"
                          }
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          Pay-as-you-go (No limit)
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
