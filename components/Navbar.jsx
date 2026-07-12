"use client";

import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Home03Icon,
    PackageIcon,
    Analytics01Icon,
    MoneyBag02Icon,
    Settings02Icon,
    UserCircleIcon,
    Logout01Icon,
} from '@hugeicons/core-free-icons';
import { usePathname } from "next/navigation";

const NavLinksTop = [
    { label: "Dashboard",    path: "/dashboard",    navIcon: Home03Icon },
    { label: "Products",     path: "/dashboard/products",     navIcon: PackageIcon },
    { label: "Analytics",    path: "/dashboard/analytics",    navIcon: Analytics01Icon },
    { label: "Payments",     path: "/dashboard/payments",     navIcon: MoneyBag02Icon },
    { label: "Settings",     path: "/dashboard/settings",     navIcon: Settings02Icon },
];

const MobileNavTop = [
    { label: "Account",      path: "/dashboard/account",      navIcon: UserCircleIcon },
];

const MobileNavBottom = [
    { label: "Dashboard",    path: "/dashboard",    navIcon: Home03Icon },
    { label: "Products",     path: "/dashboard/products",     navIcon: PackageIcon },
    { label: "Analytics",    path: "/dashboard/analytics",    navIcon: Analytics01Icon },
    { label: "Payments",     path: "/dashboard/payments",     navIcon: MoneyBag02Icon },
    { label: "Settings",     path: "/dashboard/settings",     navIcon: Settings02Icon },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <>
            {/* =========================================
                DESKTOP NAVBAR
            ========================================= */}
            <aside className="fixed left-0 top-0 z-50 h-screen w-64 hidden lg:flex flex-col justify-between bg-white border-r border-gray-100 py-6 px-4">
                
                {/* Top Section */}
                <div className="w-full flex flex-col">
                    
                    {/* Logo */}
                    <div className="px-3 mb-8">
                        <p className="text-2xl text-gray-900 font-cabinet font-semibold tracking-tight">
                            Seller's Club
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1 w-full">
                        {NavLinksTop.map(({ label, path, navIcon }) => {
                            const isActive = 
                            path === "/dashboard" 
                                ? pathname === "/dashboard" 
                                : pathname === path || pathname.startsWith(`${path}/`);

                            return (
                                <Link
                                    key={label}
                                    href={path}
                                    className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-md font-general transition-all duration-200 ${
                                        isActive 
                                            ? "bg-gray-50 text-gray-900 font-semibold" 
                                            : "text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    <div className={`transition-colors duration-200 ${
                                        isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-900"
                                    }`}>
                                        <HugeiconsIcon 
                                            icon={navIcon} 
                                            size={20} 
                                            strokeWidth={isActive ? 2 : 1.5} 
                                        />
                                    </div>
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section / Account Navigation */}
                <div className="w-full border-t border-gray-300 pt-4 mt-auto">
                    <Link 
                        href="/logout" 
                        className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-md font-general font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                    >
                        <HugeiconsIcon icon={Logout01Icon} size={20} />
                        Logout
                    </Link>
                </div>
                
            </aside>
            

            {/* =========================================
                MOBILE NAVBAR (TOP)
            ========================================= */}
            <div className="fixed z-50 flex flex-row justify-between items-center px-5 py-4 top-0 left-0 w-full lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-100">
                <p className="text-gray-900 text-xl font-bold font-cabinet tracking-tight">
                    Seller's Club
                </p>
                <div className="flex flex-row gap-5 items-center">
                    {MobileNavTop.map(({ label, path, navIcon }) => (
                        <Link
                            key={label}
                            href={path}
                            aria-label={label}
                            className="text-gray-500 transition-colors hover:text-gray-900"
                        >
                            <HugeiconsIcon icon={navIcon} size={24} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* =========================================
                MOBILE NAVBAR (BOTTOM)
            ========================================= */}
            <div className="fixed z-50 bottom-0 left-0 w-full lg:hidden flex flex-row justify-evenly items-center bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe">
                {MobileNavBottom.map(({ label, path, navIcon }) => {
                    const isActive = 
                    path === "/dashboard" 
                        ? pathname === "/dashboard" 
                        : pathname === path || pathname.startsWith(`${path}/`);

                    return (
                        <Link 
                            key={label} 
                            href={path} 
                            className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${
                                isActive ? "text-gray-900" : "text-gray-600"
                            }`} 
                        >
                            <HugeiconsIcon 
                                icon={navIcon} 
                                size={24} 
                                strokeWidth={isActive ? 2 : 1.5}
                            />
                            <p className={`text-[10px] font-general ${
                                isActive ? "font-bold" : "font-medium"
                            }`}>
                                {label}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}