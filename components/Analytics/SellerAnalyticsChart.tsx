"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipContentProps,
} from "recharts";
import { createClient } from "@/utils/SupabaseClient"; 
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartLineData02Icon } from "@hugeicons/core-free-icons";
import { ChartBarLineIcon } from "@hugeicons/core-free-icons";
import { ChartHistogramIcon } from "@hugeicons/core-free-icons";

// ---------- Types ----------

type TrendPoint = {
  day: string;
  earnings: number;
  sales_count: number;
};

type ChartType = "line" | "bar" | "area";
type Metric = "earnings" | "sales_count";
type RangeDays = 7 | 30 | 90;

// ---------- Data hook ----------

function useSellerTrend(sellerId: string, days: RangeDays) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();
    let cancelled = false;

    async function fetchTrend() {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_seller_daily_trend", {
        p_seller_id: sellerId,
        p_days: days,
      });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setData([]);
      } else {
        setData((data as TrendPoint[]) ?? []);
        setError(null);
      }
      setLoading(false);
    }

    fetchTrend();
    return () => {
      cancelled = true;
    };
  }, [sellerId, days]);

  return { data, loading, error };
}

// ---------- Formatting ----------

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const formatMetricValue = (metric: Metric, value: number) =>
  metric === "earnings" ? `₹${value.toLocaleString("en-IN")}` : value.toString();

const METRIC_LABEL: Record<Metric, string> = {
  earnings: "Earnings",
  sales_count: "Sales",
};

// ---------- Custom tooltip, monochrome + violet ----------

function ChartTooltip({ active, payload, label, metric }: TooltipContentProps<number, string> & { metric: Metric }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black text-white rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-400 font-general mb-1">{formatDay(label as string)}</p>
      <p className="text-sm font-general font-medium text-violet-400">
        {METRIC_LABEL[metric]}: {formatMetricValue(metric, payload[0].value as number)}
      </p>
    </div>
  );
}

// ---------- Controls ----------

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-general font-medium transition-colors ${
        active ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}


function ChartInner({
  data,
  chartType,
  metric,
}: {
  data: TrendPoint[];
  chartType: ChartType;
  metric: Metric;
}) {
  const tooltipRenderer = (props: TooltipContentProps<number, string>) => (
    <ChartTooltip {...props} metric={metric} />
  );

  const xAxis = (
    <XAxis
      dataKey="day"
      tickFormatter={formatDay}
      tick={{ fontSize: 11, fill: "#6b7280" }}
      axisLine={false}
      tickLine={false}
      interval="preserveStartEnd"
    />
  );
  const yAxis = (
    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={40} />
  );
  const grid = <CartesianGrid stroke="#e5e7eb" vertical={false} />;
  const margin = { top: 8, right: 8, left: -16, bottom: 0 };

  if (chartType === "line") {
    return (
      <LineChart data={data} margin={margin}>
        {grid}
        {xAxis}
        {yAxis}
        <Tooltip content={tooltipRenderer as any} />
        <Line
          type="monotone"
          dataKey={metric}
          stroke="#8b5cf6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#8b5cf6" }}
        />
      </LineChart>
    );
  }

  if (chartType === "bar") {
    return (
      <BarChart data={data} margin={margin}>
        {grid}
        {xAxis}
        {yAxis}
        <Tooltip content={tooltipRenderer as any} cursor={{ fill: "#e5e7eb" }} />
        <Bar dataKey={metric} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }

  return (
    <AreaChart data={data} margin={margin}>
      <defs>
        <linearGradient id="violetFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
      {grid}
      {xAxis}
      {yAxis}
      <Tooltip content={tooltipRenderer as any} />
      <Area
        type="monotone"
        dataKey={metric}
        stroke="#8b5cf6"
        strokeWidth={2.5}
        fill="url(#violetFade)"
      />
    </AreaChart>
  );
}

// ---------- Main component ----------

export default function SellerAnalyticsChart({ sellerId: sellerIdProp = "" }: { sellerId?: string }) {
  const [resolvedSellerId, setResolvedSellerId] = useState(sellerIdProp);

  useEffect(() => {
    if (sellerIdProp) {
      setResolvedSellerId(sellerIdProp);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setResolvedSellerId(user.id);
    });
  }, [sellerIdProp]);

  const [chartType, setChartType] = useState<ChartType>("area");
  const [metric, setMetric] = useState<Metric>("earnings");
  const [range, setRange] = useState<RangeDays>(30);

  const { data, loading, error } = useSellerTrend(resolvedSellerId, range);

  const total = useMemo(
    () => data.reduce((sum, point) => sum + point[metric], 0),
    [data, metric]
  );
  

  return (
    <div className="flex flex-col bg-gray-100 rounded-2xl p-4 sm:p-6 gap-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600 font-general font-medium">{METRIC_LABEL[metric]} trend</p>
          <p className="text-2xl text-violet-500/90 font-general font-medium">
            {loading ? "..." : formatMetricValue(metric, total)}
          </p>
        </div>

        {/* Metric toggle */}
        <div className="flex gap-2">
          <SegmentButton active={metric === "earnings"} onClick={() => setMetric("earnings")}>
            Earnings
          </SegmentButton>
          <SegmentButton active={metric === "sales_count"} onClick={() => setMetric("sales_count")}>
            Sales
          </SegmentButton>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[220px] sm:h-[280px] md:h-[320px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-gray-500 font-general font-medium">Loading chart...</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-red-500 font-general">Couldn't load chart: {error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-gray-500 font-general">No data for this range yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ChartInner data={data} chartType={chartType} metric={metric} />
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer controls: chart type + range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("line")}
            className={`p-2 rounded-lg ${chartType === "line" ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}
            aria-label="Line chart"
          >
            <HugeiconsIcon icon={ChartLineData02Icon} size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`p-2 rounded-lg ${chartType === "bar" ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}
            aria-label="Bar chart"
          >
            <HugeiconsIcon icon={ChartHistogramIcon} size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`p-2 rounded-lg ${chartType === "area" ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}
            aria-label="Area chart"
          >
            <HugeiconsIcon icon={ChartBarLineIcon} size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex gap-2">
          <SegmentButton active={range === 7} onClick={() => setRange(7)}>
            7D
          </SegmentButton>
          <SegmentButton active={range === 30} onClick={() => setRange(30)}>
            30D
          </SegmentButton>
          <SegmentButton active={range === 90} onClick={() => setRange(90)}>
            90D
          </SegmentButton>
        </div>
      </div>
    </div>
  );
}