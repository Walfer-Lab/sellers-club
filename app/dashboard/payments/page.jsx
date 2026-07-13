"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { EarningsCard, Last30DaysCard, TotalSalesCard, ConversionRateCard } from "@/components/Analytics/AnalyticsStats";
import PaymentsReceipt from "@/components/Payments/PaymentsReceipt";

// Load modal bundles only when the user opens them
const AddPaymentMethod = dynamic(() => import("@/components/Payments/AddPaymentMethod"), { ssr: false });
const WithdrawAmount   = dynamic(() => import("@/components/Payments/WithdrawAmount"),   { ssr: false });


const Page = ()=> {
    const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false)
    const [showWithdrawAmount, setShowWithdrawAmount] = useState(false)

    return(
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            <div className="flex flex-row justify-between items-center">
                <p className="text-2xl text-black/80 font-general font-semibold">Payments</p>
                <button onClick={() => setShowWithdrawAmount(true)} className="text-sm font-general font-medium bg-violet-600/80 text-white px-4 py-2 rounded-lg cursor-pointer">Withdraw</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Last30DaysCard />
                <TotalSalesCard />
                <EarningsCard />
                <ConversionRateCard />
            </div>

            <div className="bg-gray-100 rounded-2xl p-4 space-y-1">
                <p className="text-sm text-gray-700 font-general font-medium">Add payment method to recieve your earnings</p>
                <button onClick={() => setShowAddPaymentMethod(true)} className="text-sm font-general font-medium bg-violet-600/80 text-white px-4 py-2 rounded-md cursor-pointer">Add Payment Method</button>
            </div>


            <PaymentsReceipt />

            {showAddPaymentMethod && (
                <AddPaymentMethod onClose={() => setShowAddPaymentMethod(false)} />
            )}
            {showWithdrawAmount && (
                <WithdrawAmount onClose={() => setShowWithdrawAmount(false)} />
            )}
        </main>
    )
}

export default Page;