"use client";

import { useEffect, useState } from "react";
import { Last30DaysCard, TotalSalesCard, TotalViewsCard, TotalProductsCard } from "@/components/Analytics/AnalyticsStats";
import ProductCard from "@/components/Products/ProductCard";
import { createClient } from "@/utils/SupabaseClient";
import Link from "next/link";

// ─── Recent Products Section ──────────────────────────────────────────────────

function RecentProducts() {
    const [productIds, setProductIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecentProducts() {
            const supabase = createClient();

            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) { setLoading(false); return; }

            // sellers.id IS the auth user id — no separate lookup needed
            const { data: products } = await supabase
                .from("products")
                .select("id")
                .eq("seller_id", userData.user.id)
                .order("created_at", { ascending: false })
                .limit(5);

            setProductIds((products ?? []).map((p) => p.id));
            setLoading(false);
        }

        fetchRecentProducts();
    }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-white animate-pulse">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                        <div className="flex flex-row space-y-2">
                            <div className="h-4 bg-gray-100 rounded-lg w-3/5" />
                            <div className="h-3 bg-gray-100 rounded-lg w-2/5" />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
                    </div>
                ))}
            </div>
        );
    }

    if (productIds.length === 0) {
        return (
            <div className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500 font-general font-medium text-center">No products yet.</p>
                <Link href="/dashboard/products/new" className="px-3 py-1.5 bg-violet-700/80 text-sm text-white font-general font-medium cursor-pointer hover:bg-violet-700 rounded-lg transition-colors">
                    Add First Product
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-row overflow-x-scroll scrollbar-none gap-4">
            {productIds.map((id) => (
                <ProductCard key={id} productId={id} />
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Page = () => {
    const [sellerId, setSellerId] = useState("");
    const [metrics, setMetrics] = useState({ total_products: 0, total_sales_count: 0, total_views: 0 });

    useEffect(() => {
        async function fetchMetrics() {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;
            setSellerId(userData.user.id);

            const { data } = await supabase
                .from("seller_metrics")
                .select("total_products, total_sales_count, total_views")
                .eq("seller_id", userData.user.id)
                .single();

            if (data) setMetrics(data);
        }
        fetchMetrics();
    }, []);

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            <p className="text-2xl text-black/80 font-general font-semibold">Dashboard</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Last30DaysCard sellerId={sellerId} />
                <TotalProductsCard value={metrics.total_products} />
                <TotalSalesCard value={metrics.total_sales_count} />
                <TotalViewsCard value={metrics.total_views} />
            </div>

            <p className="text-lg text-black/80 font-general font-semibold">Recent Products</p>
            <RecentProducts />

            <p className="text-lg text-black/80 font-general font-semibold">Guide</p>
            <div className="bg-violet-400/70 rounded-2xl p-4">
                <p className="text-md text-black/90 font-general font-medium">Learn how top sellers on our platform make more sells</p>
                <p className="text-sm text-black/80 font-general font-medium mb-4">We have collected best practices from top sellers</p>
                <Link href="https:blogs.pdflovers.app/" className="px-3 py-2 bg-black/80 text-sm text-white font-general font-medium cursor-pointer hover:bg-black rounded-lg transition-colors">Read Guide</Link>
            </div>

            <p className="text-lg text-black/80 font-general font-semibold">Quick Actions</p>
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/products/new" className="text-sm text-violet-800/80 font-general font-medium cursor-pointer">
                    Add new product
                </Link>
                <Link href="/dashboard/payments" className="text-sm text-violet-800/80 font-general font-medium cursor-pointer">
                    Add payment method
                </Link>
                <Link href="/dashboard/analytics" className="text-sm text-violet-800/80 font-general font-medium cursor-pointer">
                    View analytics
                </Link>
                <Link href="/dashboard/settings" className="text-sm text-violet-800/80 font-general font-medium cursor-pointer">
                    Manage your account
                </Link>
            </div>
        </main>
    );
};

export default Page;