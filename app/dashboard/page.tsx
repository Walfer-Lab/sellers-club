"use client";
import { Last30DaysCard, TotalSalesCard, TotalViewsCard, TotalProductsCard } from "@/components/Analytics/AnalyticsStats";

const Page = ()=> {
    return(
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            <p className="text-2xl text-black/80 font-general font-semibold">Dashboard</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Last30DaysCard />
                <TotalProductsCard />
                <TotalSalesCard />
                <TotalViewsCard />
            </div>

            <p className="text-lg text-black/80 font-general font-semibold">Recent Products</p>
            <div className="bg-gray-100 rounded-2xl p-4">
                <p className="text-sm text-gray-500 font-general font-medium text-center">No products yet</p>
                <button className="px-4 py-2 bg-violet-700/80 text-white font-general font-medium cursor-pointer hover:bg-violet-700">Add First Product</button>
            </div>

        </main>
    )
}

export default Page;