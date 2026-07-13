"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/SupabaseClient";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoneyBag02Icon } from "@hugeicons/core-free-icons";
import { ChartLineData02Icon } from "@hugeicons/core-free-icons";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { ShoppingCart02Icon } from "@hugeicons/core-free-icons";
import { Calculator01Icon } from "@hugeicons/core-free-icons";
import { Target02Icon } from "@hugeicons/core-free-icons";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { Package02Icon } from "@hugeicons/core-free-icons";
import { FlashIcon } from "@hugeicons/core-free-icons";

// ---------- Formatters ----------

const formatNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toString();

const formatCurrency = (n: number) => `₹${formatNumber(n)}`; 

const formatPercent = (n: number) => `${n}%`;

// ---------- Cards that fetch their own data (sellerId optional, defaults to "") ----------

export function EarningsCard({ sellerId = "" }: { sellerId?: string }) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();
    supabase
      .from("seller_metrics")
      .select("total_earnings")
      .eq("seller_id", sellerId)
      .single()
      .then(({ data }) => setValue(data?.total_earnings ?? 0));
  }, [sellerId]);

  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Earnings</p>
        <HugeiconsIcon icon={MoneyBag02Icon} size={18} strokeWidth={1.5} className="text-violet-800/90" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">
        {value === null ? "..." : formatCurrency(value)}
      </p>
    </div>
  );
}

export function GrossSalesVolumeCard({ sellerId = "" }: { sellerId?: string }) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();
    supabase
      .from("seller_metrics")
      .select("gross_sales_volume")
      .eq("seller_id", sellerId)
      .single()
      .then(({ data }) => setValue(data?.gross_sales_volume ?? 0));
  }, [sellerId]);

  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Gross Sales Volume</p>
        <HugeiconsIcon icon={ChartLineData02Icon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">
        {value === null ? "..." : formatCurrency(value)}
      </p>
    </div>
  );
}

export function Last30DaysCard({ sellerId = "" }: { sellerId?: string }) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();
    supabase
      .from("seller_metrics")
      .select("earnings_last_30_days")
      .eq("seller_id", sellerId)
      .single()
      .then(({ data }) => setValue(data?.earnings_last_30_days ?? 0));
  }, [sellerId]);

  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Last 30 Days</p>
        <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">
        {value === null ? "..." : formatCurrency(value)}
      </p>
    </div>
  );
}

// ---------- Cards that receive a value as prop (value defaults to 0) ----------

export function TotalSalesCard({ value = 0 }: { value?: number }) {
  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Total Sales</p>
        <HugeiconsIcon icon={ShoppingCart02Icon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">{formatNumber(value)}</p>
    </div>
  );
}

export function AverageOrderValueCard({ value = 0 }: { value?: number }) {
  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Avg Order Value</p>
        <HugeiconsIcon icon={Calculator01Icon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">{formatCurrency(value)}</p>
    </div>
  );
}

export function ConversionRateCard({ value = 0 }: { value?: number }) {
  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Conversion Rate</p>
        <HugeiconsIcon icon={Target02Icon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">{formatPercent(value)}</p>
    </div>
  );
}

export function TotalViewsCard({ value = 0 }: { value?: number }) {
  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Total Views</p>
        <HugeiconsIcon icon={ViewIcon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">{formatNumber(value)}</p>
    </div>
  );
}

export function TotalProductsCard({ value = 0 }: { value?: number }) {
  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Total Products</p>
        <HugeiconsIcon icon={Package02Icon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">{formatNumber(value)}</p>
    </div>
  );
}

export function LiveProductsCard({ value = 0 }: { value?: number }) {
  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-general font-medium">Live Products</p>
        <HugeiconsIcon icon={FlashIcon} size={18} strokeWidth={1.5} className="text-violet-800/80" />
      </div>
      <p className="text-lg text-gray-700/90 font-general font-medium">{formatNumber(value)}</p>
    </div>
  );
}