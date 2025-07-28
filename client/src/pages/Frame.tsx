import React from "react";
import { FilterByIngredientSection } from "./sections/FilterByIngredientSection";
import { FooterSection } from "./sections/FooterSection";
import { TopNavigation } from "@/components/TopNavigation";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-[#161611]">
      <TopNavigation />
      <main className="flex flex-col w-full">
        <section className="flex flex-col w-full">
          <FilterByIngredientSection />
          <FooterSection />
        </section>
      </main>
    </div>
  );
};
