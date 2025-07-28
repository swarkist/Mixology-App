import React, { useState } from "react";
import { Search as SearchIcon, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TopNavigation } from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import type { Ingredient } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/schema";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const MyBar = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch ingredients that are in my bar
  const { data: myBarIngredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients?inMyBar=true"],
  });

  // Filter ingredients based on search and category
  const filteredIngredients = myBarIngredients?.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.preferredBrand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex flex-col w-[1280px] bg-white">
      <div className="flex flex-col self-stretch bg-[#171712]">
        <TopNavigation />
        
        <div className="flex justify-center items-start self-stretch px-40 py-5">
          <div className="flex flex-col flex-grow overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start self-stretch p-4">
              <div className="flex flex-col w-72">
                <p className="text-[32px] font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  My Bar
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col self-stretch px-4 py-3">
              <div className="flex self-stretch h-12">
                <div className="flex justify-start items-start self-stretch flex-grow rounded-xl">
                  <div className="flex justify-center items-center self-stretch pl-4 rounded-tl-xl rounded-bl-xl bg-[#383629]">
                    <div className="h-6 relative overflow-hidden">
                      <SearchIcon className="w-5 h-5 text-[#bab59c]" />
                    </div>
                  </div>
                  <div className="flex justify-start items-center self-stretch flex-grow overflow-hidden pl-2 pr-4 py-2 rounded-tr-xl rounded-br-xl bg-[#383629]">
                    <Input
                      type="text"
                      placeholder="Search ingredients"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="border-0 bg-transparent text-base text-[#bab59c] placeholder:text-[#bab59c] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex justify-start items-start self-stretch gap-3 pl-3 pr-4 py-3">
              <div className="flex justify-center items-center h-8 gap-2 pl-4 pr-2 rounded-2xl bg-[#383629] cursor-pointer">
                <p className="text-sm font-medium text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Category
                </p>
                <ChevronDown className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Ingredients Grid - Following exact Figma layout */}
            <div className="flex flex-col self-stretch px-4 py-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-[#bab59c]">Loading your bar...</p>
                </div>
              ) : filteredIngredients.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {myBarIngredients?.length === 0 ? "Your bar is empty" : "No ingredients found"}
                    </h3>
                    <p className="text-[#bab59c] mb-6">
                      {myBarIngredients?.length === 0 
                        ? "Start building your personal ingredient collection"
                        : "Try adjusting your search criteria"}
                    </p>
                    {myBarIngredients?.length === 0 && (
                      <Link href="/ingredients">
                        <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]">
                          Browse Ingredients
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {filteredIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex flex-col relative">
                      {/* Ingredient Card */}
                      <div className="flex flex-col justify-center items-center w-72 h-80 gap-3 px-4 py-6 rounded-2xl bg-[#26261c]">
                        {/* Image */}
                        <div 
                          className="w-60 h-60 rounded-2xl bg-cover bg-center"
                          style={{ backgroundImage: `url(${ingredient.imageUrl || noPhotoImage})` }}
                        />
                        
                        {/* Content */}
                        <div className="flex flex-col justify-center items-center gap-1">
                          <p className="text-base font-medium text-white text-center [font-family:'Plus_Jakarta_Sans',Helvetica]">
                            {ingredient.name}
                          </p>
                          {ingredient.preferredBrand && (
                            <p className="text-sm text-[#bab59c] text-center [font-family:'Plus_Jakarta_Sans',Helvetica]">
                              {ingredient.preferredBrand}
                            </p>
                          )}
                          {ingredient.abv && (
                            <p className="text-sm font-medium text-[#f2c40c] text-center">
                              {ingredient.abv}% ABV
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <div className="flex justify-center mt-3">
                        <Link href={`/edit-ingredient/${ingredient.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#bab59c] hover:text-[#f2c40c] hover:bg-[#383629]"
                          >
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};