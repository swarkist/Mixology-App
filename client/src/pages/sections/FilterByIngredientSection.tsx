import { SearchIcon, ChevronDown } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { openMixi } from "@/lib/mixiBus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navigation, DesktopNavigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import type { Cocktail } from "@shared/schema";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const FilterByIngredientSection = (): JSX.Element => {
  // Fetch featured cocktails from API
  const { data: featuredCocktails } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails?featured=true"],
  });

  // Fetch popular cocktails from API (cocktails with popularityCount > 0)
  const { data: popularRecipes } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails?popular=true"],
  });

  return (
    <>
      <section className="flex justify-center px-4 md:px-8 lg:px-40 py-5 w-full pb-20 md:pb-5">
      <div className="flex flex-col max-w-[960px] w-full">
        {/* Hero Banner */}
        <div className="w-full mb-6">
          <div 
            className="relative w-full h-[480px] rounded-lg overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%), url(/hero-bg-new.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="flex flex-col items-center gap-2 absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/3 w-full max-w-[633px] px-4">
              <h1 className="font-extrabold text-white md:text-5xl text-center tracking-tight [font-family:'Plus_Jakarta_Sans',Helvetica] text-[47px]">
                A Mix On Mixology
              </h1>
              <p className="text-white text-center [font-family:'Plus_Jakarta_Sans',Helvetica]">My bar where I pull recipes and tweak them to fit my flavor pallet.</p>
            </div>

            {/* Ask Mixi CTA (replaces the old Search bar) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-1/4 w-full max-w-[480px] px-4">
              <div className="flex h-16 rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    openMixi({
                      seed: "Tell me your spirits or mood and I'll suggest cocktails.",
                      context: null
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] font-bold rounded-lg border border-[#544f3a] transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#161611]"
                  aria-label="Ask Mixi for help"
                >
                  <MixiIconBartender size={18} />
                  Ask Mixi
                </button>
              </div>
              <p className="mt-2 text-center text-[#bab59b]">Mixi is here to help you</p>
            </div>
          </div>
        </div>



        {/* Featured Cocktails Section */}
        <div>
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            <h2 className="font-bold text-white text-[22px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Featured Cocktails
            </h2>
            <Link href="/cocktails?featured=true">
              <Button variant="outline" size="sm" className="bg-[#383529] border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] font-medium">
                View All
              </Button>
            </Link>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredCocktails && featuredCocktails.length > 0 ? (
                featuredCocktails.slice(0, 4).map((cocktail, index) => (
                  <Link key={`featured-${index}`} href={`/recipe/${cocktail.id}`}>
                    <Card className="w-full bg-transparent border-0 cursor-pointer hover:transform hover:scale-105 transition-transform">
                      <CardContent className="p-0 space-y-4">
                        <div
                          className="w-full h-[320px] rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${cocktail.imageUrl || noPhotoImage})` }}
                        />
                        <div className="space-y-1 pb-3">
                          <h3 className="font-medium text-white text-base [font-family:'Plus_Jakarta_Sans',Helvetica]">
                            {cocktail.name}
                          </h3>
                          <p className="font-normal text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                            {cocktail.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="w-full text-center py-8">
                  <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    No featured cocktails available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Popular Recipes Section */}
        <div>
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            <h2 className="font-bold text-white text-[22px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Popular Recipes
            </h2>
            <Link href="/cocktails?popular=true">
              <Button variant="outline" size="sm" className="bg-[#383529] border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] font-medium">
                View All
              </Button>
            </Link>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {popularRecipes && popularRecipes.length > 0 ? (
                popularRecipes.slice(0, 5).map((recipe, index) => (
                  <Link key={`recipe-${index}`} href={`/recipe/${recipe.id}`}>
                    <Card className="w-full bg-transparent border-0 cursor-pointer hover:transform hover:scale-105 transition-transform">
                      <CardContent className="p-0 space-y-3">
                        <div
                          className="w-full h-[247px] rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${recipe.imageUrl || noPhotoImage})` }}
                        />
                        <div className="space-y-1 pb-3">
                          <h3 className="font-medium text-white text-base [font-family:'Plus_Jakarta_Sans',Helvetica]">
                            {recipe.name}
                          </h3>
                          <p className="font-normal text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                            {recipe.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    No popular recipes available
                  </p>
                </div>
              )}
            </div>

            {popularRecipes && popularRecipes.length > 5 && (
              <div className="flex gap-3">
                {popularRecipes.slice(5).map((recipe, index) => (
                  <Card
                    key={`recipe-extra-${index}`}
                    className="w-44 bg-transparent border-0"
                  >
                    <CardContent className="p-0 space-y-3">
                      <div
                        className="w-full h-[247px] rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${recipe.imageUrl || noPhotoImage})` }}
                      />
                      <div className="space-y-1 pb-3">
                        <h3 className="font-medium text-white text-base [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {recipe.name}
                        </h3>
                        <p className="font-normal text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {recipe.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
      {/* Mobile Navigation */}
      <Navigation />
    </>
  );
};
