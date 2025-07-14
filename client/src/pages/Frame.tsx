import React from "react";
import { FeaturedCocktailsSection } from "./sections/FeaturedCocktailsSection";
import { FilterByIngredientSection } from "./sections/FilterByIngredientSection";
import { PopularRecipesSection } from "./sections/PopularRecipesSection";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white">
      <main className="flex flex-col w-full bg-[#161611]">
        <section className="flex flex-col w-full">
          <FeaturedCocktailsSection />
          <FilterByIngredientSection />
          <PopularRecipesSection />
        </section>
      </main>
    </div>
  );
};
