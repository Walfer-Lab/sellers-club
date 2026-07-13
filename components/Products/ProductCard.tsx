"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/SupabaseClient";
import ProductActionMenu from "@/components/Products/ProductActionMenu";

// ─── Types ───────────────────────────────────────────────────────────────────

type Product = {
    id: string;
    title: string;
    price: number;
    discount: number;
    is_live: boolean;
    created_at: string;
    image_urls: string[] | null;
    category: string | null;
    seller_id: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, discount: number) {
    const discounted = discount > 0 ? price * (1 - discount / 100) : price;
    return `₹${discounted.toFixed(2)}`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
    return (
        <div className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-white animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-3/5" />
                <div className="h-3 bg-gray-100 rounded-lg w-2/5" />
                <div className="flex gap-2 mt-1">
                    <div className="h-5 w-14 bg-gray-100 rounded-full" />
                    <div className="h-5 w-20 bg-gray-100 rounded-full" />
                </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ProductCardProps = {
    productId?: string;
};

export default function ProductCard({ productId }: ProductCardProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            setError("No product ID provided.");
            return;
        }

        async function fetchProduct() {
            setLoading(true);
            setError(null);

            const supabase = createClient();

            // Get current user
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                setError("Not authenticated.");
                setLoading(false);
                return;
            }

            // Fetch product — must belong to this seller. sellers.id IS the
            // auth user id, so no separate lookup is needed.
            const { data, error: productError } = await supabase
                .from("products")
                .select("id, title, price, discount, is_live, created_at, image_urls, category, seller_id")
                .eq("id", productId)
                .eq("seller_id", userData.user.id)
                .single();

            if (productError || !data) {
                setError("Product not found or access denied.");
                setLoading(false);
                return;
            }

            // Parse image_urls from JSONB (can be array or stringified array)
            let imageUrls: string[] | null = null;
            if (data.image_urls) {
                if (Array.isArray(data.image_urls)) {
                    imageUrls = data.image_urls as string[];
                } else if (typeof data.image_urls === "string") {
                    try { imageUrls = JSON.parse(data.image_urls); } catch { imageUrls = null; }
                }
            }

            setProduct({ ...data, image_urls: imageUrls });
            setLoading(false);
        }

        fetchProduct();
    }, [productId]);

    if (loading) return <ProductCardSkeleton />;

    if (error || !product) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-red-100 bg-red-50">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-400 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <p className="text-sm text-red-500 font-general font-medium">{error ?? "Product unavailable."}</p>
            </div>
        );
    }

    const thumbnail = product.image_urls?.[0] ?? null;

    return (
        <div
            id={`product-card-${product.id}`}
            className="group flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200"
        >
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={product.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="4" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-general font-semibold truncate leading-snug">
                    {product.title}
                </p>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                    {/* Live / Draft badge */}
                    {product.is_live ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-general font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-general font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Draft
                        </span>
                    )}

                    {/* Price */}
                    <span className="text-sm font-general font-semibold text-gray-800">
                        {formatPrice(product.price, product.discount)}
                    </span>
                    {product.discount > 0 && (
                        <span className="text-xs font-general text-gray-400 line-through">
                            ₹{product.price.toFixed(2)}
                        </span>
                    )}

                    {/* Upload date */}
                    <span className="text-xs text-gray-400 font-general ml-auto">
                        {formatDate(product.created_at)}
                    </span>
                </div>
            </div>

            {/* Action menu */}
            <ProductActionMenu productId={product.id} />
        </div>
    );
}
