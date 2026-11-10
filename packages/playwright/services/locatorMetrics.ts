import { LocatorRegistry, type LocatorMetrics } from "../registry/locatorRegistry.js";

export async function getLocatorMetrics(registry = new LocatorRegistry()): Promise<LocatorMetrics & { reuseRate: number; repairRate: number }> {
  const metrics = await registry.metrics();
  const attempts = metrics.reuseCount + metrics.missCount;
  return {
    ...metrics,
    reuseRate: attempts === 0 ? 0 : Number((metrics.reuseCount / attempts).toFixed(4)),
    repairRate: metrics.locatorCount === 0 ? 0 : Number((metrics.repairCount / metrics.locatorCount).toFixed(4)),
  };
}
