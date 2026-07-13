"use client";

import {Last30DaysCard,TotalViewsCard,TotalProductsCard, TotalSalesCard} from "@/components/Analytics/AnalyticsStats";
import SellerAnalyticsChart from "@/components/Analytics/SellerAnalyticsChart";



const Page = ()=> {
    return(
        <>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
            <p className="text-black font-general font-semibold text-2xl">Analytics</p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Last30DaysCard />
                <TotalViewsCard/>
                <TotalProductsCard/>
                <TotalSalesCard />
            </div>

            <SellerAnalyticsChart />
        </main>
        </>
    )
}

export default Page;