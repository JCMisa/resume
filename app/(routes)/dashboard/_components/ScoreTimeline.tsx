/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { AreaChartIcon } from "lucide-react";

export default function ScoreTimeline({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 border rounded-3xl p-6 h-[360px] flex flex-col items-center justify-center text-center">
        <AreaChartIcon className="size-8 text-muted-foreground/30 mb-2 stroke-1" />
        <h4 className="text-sm font-bold text-muted-foreground">
          No tracking entries captured
        </h4>
        <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">
          Run an AI Resume Analysis checkpoint to see your optimization
          trajectory map live.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px]">
      <div className="flex items-center justify-between border-b pb-3 mb-2">
        <div>
          <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase tracking-widest">
            Historical Progress
          </span>
          <h3 className="text-lg font-black tracking-tight mt-0.5">
            ATS Matching Trajectory
          </h3>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--primary)"
                  stopOpacity={0.25}
                />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fontWeight: 600 }}
              stroke="currentColor"
              className="text-muted-foreground/40"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fontWeight: 600 }}
              stroke="currentColor"
              className="text-muted-foreground/40"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-stone-900 text-stone-50 border border-stone-800 p-3 rounded-xl shadow-xl text-left">
                      <p className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">
                        {payload[0].payload.date}
                      </p>
                      <p className="text-xs font-black mt-0.5 text-primary truncate max-w-[180px]">
                        {payload[0].payload.title}
                      </p>
                      <p className="text-lg font-black mt-1 tabular-nums">
                        {payload[0].value}
                        <span className="text-xs font-normal text-stone-400">
                          /100
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#scoreColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
