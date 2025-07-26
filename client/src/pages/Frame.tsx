import React from "react";
import { FeaturedCocktailsSection } from "./sections/FeaturedCocktailsSection";
import { FilterByIngredientSection } from "./sections/FilterByIngredientSection";
import { PopularRecipesSection } from "./sections/PopularRecipesSection";
import { FooterSection } from "./sections/FooterSection";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-[#161611]">
      <main className="flex flex-col w-full">
        <section className="flex flex-col w-full">
          <FeaturedCocktailsSection />
          <FilterByIngredientSection />
          <PopularRecipesSection />
          <FooterSection />
        </section>
      </main>
    </div>
  );
};
