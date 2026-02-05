"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
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
}

interface HeroSliderProps {
    deals?: Deal[];
}

export default function HeroSlider({ deals = [] }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // LOGIC: Prepare Slides based on Deals count
    // 1. If 3+ deals -> Show all deals
    // 2. If < 3 deals -> Show deals + fill remainder with defaults up to 3
    const slides = React.useMemo(() => {
        let combinedSlides: any[] = [];

        // Add existing deals
        if (deals && deals.length > 0) {
            combinedSlides = deals.map((deal) => ({
                type: "deal",
                image: deal.image || (Array.isArray(deal.images) && deal.images.length > 0 ? deal.images[0] : DEFAULT_IMAGES[0]),
                title: deal.dealName || deal.title || "Special Offer",
                description: deal.description || "Limited time offer",
                discount: deal.discount,
            }));
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
        <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg group">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"
                        }`}
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
                    <div className="absolute bottom-0 left-0 p-4 sm:p-8 text-white max-w-2xl">
                        {slide.type === "deal" && (
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <span className="bg-primary px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Exclusive Deal
                                </span>
                                {slide.discount && (
                                    <span className="bg-green-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold">
                                        {slide.discount}% OFF
                                    </span>
                                )}
                            </div>
                        )}
                        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{slide.title}</h2>
                        <p className="text-sm sm:text-lg text-gray-200 line-clamp-2">{slide.description}</p>
                    </div>
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
