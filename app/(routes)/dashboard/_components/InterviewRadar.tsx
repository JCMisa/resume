/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import { ShieldCheck } from "lucide-react";

export default function InterviewRadar({ data }: { data: any[] }) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px]">
      <div className="flex items-center justify-between border-b pb-3 mb-1">
        <div>
          <span className="text-[11px] font-bold font-mono text-muted-foreground uppercase tracking-widest">
            Telemetry Framework
          </span>
          <h3 className="text-lg font-black tracking-tight mt-0.5">
            Spoken Competencies
          </h3>
        </div>
        <ShieldCheck className="size-4.5 text-muted-foreground/50" />
      </div>

      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid className="stroke-stone-100 dark:stroke-stone-800" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10, fontWeight: 700, fill: "currentColor" }}
              className="text-stone-500 dark:text-stone-400"
            />
            <Radar
              name="Averages"
              dataKey="value"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.15}
              strokeWidth={2.5}
            />
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-stone-900 text-stone-50 border border-stone-800 px-3 py-2 rounded-xl text-xs font-mono font-bold">
                      <span>
                        {payload[0].payload.subject}: {payload[0].value}%
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
