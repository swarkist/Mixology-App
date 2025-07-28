import React from "react";
import { FilterByIngredientSection } from "./sections/FilterByIngredientSection";
import { FooterSection } from "./sections/FooterSection";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-[#161611]">
      <main className="flex flex-col w-full">
        <section className="flex flex-col w-full">
          <FilterByIngredientSection />
          <FooterSection />
        </section>
      </main>
    </div>
  );
};
