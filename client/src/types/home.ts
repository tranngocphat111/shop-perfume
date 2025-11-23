import type { Inventory } from "./index";

/**
 * Types for Home page components
 */

/**
 * Hero Carousel Types
 */
export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface HeroCarouselProps {
  slides: HeroSlide[];
}

/**
 * Categories Section Types
 */
export interface HomeCategory {
  name: string;
  image: string;
  link: string;
}

export interface CategoriesSectionProps {
  categories: HomeCategory[];
}

/**
 * Best Sellers Section Types
 */
export interface BestSellersSectionProps {
  inventories: Inventory[];
  loading: boolean;
}

