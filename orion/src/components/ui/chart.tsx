/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { ResponsiveContainer } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  }
>;

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactElement;
  }
>(({ id, className, children, config, ...props }, ref) => {
  return (
    <div ref={ref} className={`relative w-full h-full ${className || ""}`} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
});
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = ({
  content,
  ...props
}: any) => {
  return <>{props.children}</>;
};

export const ChartTooltipContent = ({
  active,
  payload,
  label,
}: any) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] p-2 text-xs shadow-md">
      {label && <div className="font-semibold mb-1 text-[#252923] dark:text-[#E5E9E4]">{label}</div>}
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-[11px] text-[#777B70] dark:text-[#8F998E]">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.color || item.fill || item.stroke }}
          />
          <span>{item.name}:</span>
          <span className="font-mono font-bold text-[#252923] dark:text-[#E5E9E4]">{item.value}</span>
        </div>
      ))}
    </div>
  );
};
