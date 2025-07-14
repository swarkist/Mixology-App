import { SearchIcon, ChevronDown } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const FilterByIngredientSection = (): JSX.Element => {
  // Featured cocktails data
  const featuredCocktails = [
    {
      name: "Citrus Bliss",
      description: "A refreshing blend of citrus flavors.",
      image: "..//figmaAssets/depth-7--frame-0.png",
    },
    {
      name: "Minty Fresh",
      description: "Cool and invigorating with a hint of mint.",
      image: "..//figmaAssets/depth-7--frame-0-1.png",
    },
    {
      name: "Cherry Delight",
      description: "Sweet and tangy with a cherry finish.",
      image: "..//figmaAssets/depth-7--frame-0-2.png",
    },
  ];

  // Filter ingredients data
  const filterIngredients = [
    "Vodka",
    "Gin",
    "Rum",
    "Tequila",
    "Whiskey",
    "Brandy",
  ];

  // Popular recipes data
  const popularRecipes = [
    {
      name: "Classic Martini",
      description: "A timeless cocktail with a sophisticated taste.",
      image: "..//figmaAssets/depth-7--frame-0-3.png",
    },
    {
      name: "Mojito",
      description: "A Cuban classic with refreshing mint and lime.",
      image: "..//figmaAssets/depth-7--frame-0-4.png",
    },
    {
      name: "Old Fashioned",
      description: "A rich and complex whiskey-based cocktail.",
      image: "..//figmaAssets/depth-7--frame-0-5.png",
    },
    {
      name: "Margarita",
      description: "A zesty and tangy tequila cocktail.",
      image: "..//figmaAssets/depth-7--frame-0-6.png",
    },
    {
      name: "Cosmopolitan",
      description: "A vibrant and fruity vodka cocktail.",
      image: "/figmaAssets/depth-7--frame-0-7.png",
    },
    {
      name: "Daiquiri",
      description: "A simple and refreshing rum cocktail.",
      image: "..//figmaAssets/depth-7--frame-0-8.png",
    },
  ];

  return (
    <section className="flex justify-center px-4 md:px-8 lg:px-40 py-5 w-full">
      <div className="flex flex-col max-w-[960px] w-full">
        {/* Hero Banner */}
        <div className="w-full mb-6">
          <div className="relative w-full h-[480px] rounded-lg overflow-hidden bg-[linear-gradient(90deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.4)_100%),url(..//figmaAssets/depth-6--frame-0.png)_50%_50%_/_cover]">
            <div className="flex flex-col items-center gap-2 absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/3 w-full max-w-[633px] px-4">
              <h1 className="font-extrabold text-white text-4xl md:text-5xl text-center tracking-tight leading-tight [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Mixology With Some Twists
              </h1>
              <p className="text-white text-center [font-family:'Plus_Jakarta_Sans',Helvetica]">
                My bar where I pull recipes and tweak them to fit my flavor
                pallet (sweet to tangy).
              </p>
            </div>

            {/* SearchIcon Bar */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-1/4 w-full max-w-[480px] px-4">
              <div className="flex h-16 rounded-lg overflow-hidden">
                <div className="flex items-center bg-[#26261c] border-l border-t border-b border-[#544f3a] rounded-l-lg pl-4">
                  <SearchIcon className="h-5 w-5 text-[#bab59b]" />
                </div>
                <Input
                  className="flex-1 h-full bg-[#26261c] border-t border-b border-[#544f3a] rounded-none text-[#bab59b] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#bab59b]"
                  placeholder="SearchIcon for recipes or ingredients"
                />
                <div className="bg-[#26261c] border-r border-t border-b border-[#544f3a] rounded-r-lg p-2">
                  <Button className="h-full bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] font-bold rounded-lg">
                    SearchIcon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Cocktails Section */}
        <div className="mb-4">
          <h2 className="px-4 pt-5 pb-3 font-bold text-white text-[22px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Featured Cocktails
          </h2>
          <div className="flex flex-wrap gap-3 p-4">
            {featuredCocktails.map((cocktail, index) => (
              <Card
                key={`featured-${index}`}
                className="flex-1 min-w-60 bg-transparent border-0"
              >
                <CardContent className="p-0 space-y-4">
                  <div
                    className="w-full h-[330px] rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${cocktail.image})` }}
                  />
                  <div className="space-y-1">
                    <h3 className="font-medium text-white text-base [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {cocktail.name}
                    </h3>
                    <p className="font-normal text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {cocktail.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filter by Ingredient Section */}
        <div className="mb-4">
          <h2 className="px-4 pt-5 pb-3 font-bold text-white text-[22px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Filter by Ingredient
          </h2>
          <div className="flex flex-wrap gap-3 px-4 py-3">
            {filterIngredients.map((ingredient, index) => (
              <Badge
                key={`ingredient-${index}`}
                className="h-8 pl-4 pr-2 py-0 bg-[#383528] hover:bg-[#4a4735] text-white font-medium text-sm cursor-pointer flex items-center gap-2"
              >
                {ingredient}
                <ChevronDown className="w-4 h-4 text-white" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Popular Recipes Section */}
        <div>
          <h2 className="px-4 pt-5 pb-3 font-bold text-white text-[22px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Popular Recipes
          </h2>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {popularRecipes.slice(0, 5).map((recipe, index) => (
                <Card
                  key={`recipe-${index}`}
                  className="w-full bg-transparent border-0"
                >
                  <CardContent className="p-0 space-y-3">
                    <div
                      className="w-full h-[235px] rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${recipe.image})` }}
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

            <div className="flex gap-3">
              {popularRecipes.slice(5).map((recipe, index) => (
                <Card
                  key={`recipe-extra-${index}`}
                  className="w-44 bg-transparent border-0"
                >
                  <CardContent className="p-0 space-y-3">
                    <div
                      className="w-full h-[235px] rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${recipe.image})` }}
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
          </div>
        </div>
      </div>
    </section>
  );
};
