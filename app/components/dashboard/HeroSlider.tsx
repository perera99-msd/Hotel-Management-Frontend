"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// Default hero images from public folder
const DEFAULT_IMAGES = [
    "/images/1.jpg",
    "/images/2.jpg",
    "/images/3.jpg",
];

interface Deal {
    _id?: string;
    dealName?: string;
    title?: string;
    description?: string;
    image?: string;
    images?: string[];
    discount?: number;
    status?: string;
    dealType?: 'room' | 'food' | 'trip';
    discountType?: 'percentage' | 'bogo';
    menuItemIds?: string[];
    tripPackageIds?: string[];
    roomIds?: string[];
    roomTypeRaw?: string[];
}

interface HeroSliderProps {
    deals?: Deal[];
}

export default function HeroSlider({ deals = [] }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const router = useRouter();

    const normalizeDealType = (value?: string) => {
        const normalized = (value || '').toLowerCase();
        if (normalized.includes('trip')) return 'trip';
        if (normalized.includes('food') || normalized.includes('meal') || normalized.includes('menu')) return 'food';
        return 'room';
    };

    const resolveDealType = (deal?: Deal) => {
        if (Array.isArray(deal?.tripPackageIds) && deal.tripPackageIds.length > 0) return 'trip';
        if (Array.isArray(deal?.roomIds) && deal.roomIds.length > 0) return 'room';
        if (Array.isArray(deal?.roomTypeRaw) && deal.roomTypeRaw.length > 0) return 'room';
        if (Array.isArray(deal?.menuItemIds) && deal.menuItemIds.length > 0) return 'food';
        if (deal?.dealType) return normalizeDealType(deal.dealType);
        return 'room';
    };

    const handleDealClick = (dealType?: Deal['dealType']) => {
        const normalizedType = (dealType || 'room').toLowerCase();
        if (normalizedType === 'food') {
            router.push('/dashboard/customer/RestaurantMenu');
        } else if (normalizedType === 'trip') {
            router.push('/dashboard/customer/trip-packages');
        } else {
            router.push('/dashboard/customer/ExploreRooms');
        }
    };

    // LOGIC: Prepare Slides based on Deals count
    // 1. If 3+ deals -> Show all deals
    // 2. If < 3 deals -> Show deals + fill remainder with defaults up to 3
    const slides = React.useMemo(() => {
        let combinedSlides: any[] = [];

        // Add existing deals
        if (deals && deals.length > 0) {
            combinedSlides = deals.map((deal) => {
                const inferredType = resolveDealType(deal);
                return {
                    type: "deal",
                    image: deal.image || (Array.isArray(deal.images) && deal.images.length > 0 ? deal.images[0] : DEFAULT_IMAGES[0]),
                    title: deal.dealName || deal.title || "Special Offer",
                    description: deal.description || "Limited time offer",
                    discount: deal.discount,
                    dealType: inferredType,
                    discountType: deal.discountType || 'percentage',
                    rawDeal: deal
                };
            });
        }

        // Fill with defaults if fewer than 3 slides
        if (combinedSlides.length < 3) {
            const needed = 3 - combinedSlides.length;
            for (let i = 0; i < needed; i++) {
                combinedSlides.push({
                    type: "default",
                    image: DEFAULT_IMAGES[i],
                    title: i === 0 ? "Welcome to Our Hotel" : i === 1 ? "Luxury & Comfort" : "Premium Experience",
                    description: i === 0
                        ? "Experience luxury, comfort, and premium services."
                        : i === 1
                            ? "Indulge in world-class amenities and exceptional hospitality."
                            : "Your perfect stay awaits with our exclusive services.",
                });
            }
        }

        return combinedSlides;
    }, [deals]);

    // Auto-slide effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000); // 5 seconds per slide
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    if (slides.length === 0) return null;

    return (
        <div className="relative w-full h-[260px] sm:h-[360px] lg:h-[480px] rounded-2xl overflow-hidden shadow-2xl group">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"} cursor-default`}
                >
                    {/* Image */}
                    <div className="relative w-full h-full">
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                            onError={(e) => {
                                // Fallback to a solid gradient if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>

                    {/* Text Content */}
                    <div className="absolute bottom-0 left-0 p-4 sm:p-8 text-white max-w-3xl z-10">
                        {slide.type === "deal" && (
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <span className="bg-primary/90 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                    Exclusive Deal
                                </span>
                                {slide.discountType === 'bogo' ? (
                                    <span className="bg-emerald-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                        BOGO
                                    </span>
                                ) : slide.discount && (
                                    <span className="bg-green-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                        {slide.discount}% OFF
                                    </span>
                                )}
                            </div>
                        )}
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2 drop-shadow">{slide.title}</h2>
                        <p className="text-sm sm:text-lg text-gray-200 line-clamp-2 drop-shadow">{slide.description}</p>
                        {slide.type === "deal" && (
                            <p className="text-xs sm:text-sm text-white/70 mt-2">Tap to view deal</p>
                        )}
                    </div>

                    {/* Hover Premium Panel */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                        <div
                            className="absolute bottom-6 left-6 right-6 sm:left-10 sm:right-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 text-white shadow-2xl pointer-events-auto z-20"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-white/70">Featured</p>
                                    <h3 className="text-lg sm:text-2xl font-semibold">{slide.title}</h3>
                                    <p className="text-xs sm:text-sm text-white/80 line-clamp-2">{slide.description}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDealClick(resolveDealType(slide.rawDeal));
                                    }}
                                    className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-white/90"
                                >
                                    View Deal
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Action */}
                    {slide.type === "deal" && (
                        <div className="absolute bottom-10 right-4 z-30 sm:hidden">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDealClick(resolveDealType(slide.rawDeal));
                                }}
                                className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-4 py-2 text-xs font-semibold shadow-md"
                            >
                                View Deal
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* Navigation Buttons (Hidden by default, shown on hover) */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all ${idx === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white"
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
