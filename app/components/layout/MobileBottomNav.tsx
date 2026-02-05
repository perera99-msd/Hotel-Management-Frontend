"use client";
import { Calendar, DoorOpen, Home, Luggage, UtensilsCrossed } from "lucide-react"; // Ensure you have these icons
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
    const pathname = usePathname();

    // Define links specific to Customer Dashboard
    const navItems = [
        { name: "Bookings", href: "/dashboard/customer/bookings", icon: Calendar },
        { name: "Rooms", href: "/dashboard/customer/ExploreRooms", icon: DoorOpen },
        { name: "Home", href: "/dashboard/customer", icon: Home },
        { name: "Trips", href: "/dashboard/customer/trip-packages", icon: Luggage },
        { name: "Orders", href: "/dashboard/customer/RestaurantMenu", icon: UtensilsCrossed },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            {/* Gradient Fade above the bar for smooth transition */}
            <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />

            {/* Main Bar Container */}
            <nav className="bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] pb-2 pt-1 px-4 transition-all duration-300">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="group relative flex flex-col items-center justify-center w-16 h-14"
                            >
                                {/* Active Indicator (Glowing background) */}
                                {isActive && (
                                    <span className="absolute top-1 w-10 h-8 bg-primary/10 rounded-2xl -z-10 animate-in fade-in zoom-in duration-200" />
                                )}

                                {/* Icon */}
                                <Icon
                                    size={22}
                                    className={`transition-all duration-300 mb-1 ${isActive
                                        ? "text-primary stroke-[2.5px] -translate-y-0.5"
                                        : "text-gray-400 group-hover:text-gray-600"
                                        }`}
                                />

                                {/* Label (Optional: Hide inactive for ultra-minimalism, or keep all for clarity. Kept all for UX) */}
                                <span
                                    className={`text-[10px] font-medium transition-all duration-300 ${isActive ? "text-primary translate-y-0" : "text-gray-400"
                                        }`}
                                >
                                    {item.name}
                                </span>

                                {/* Active Dot (Optional Accent) */}
                                {isActive && (
                                    <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}