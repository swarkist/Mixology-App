import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { SearchIcon, Plus, Filter, Check, Star, BarChart3, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { Ingredient } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const Ingredients = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedSubcategory !== "all") params.set("subcategory", selectedSubcategory);
    return params.toString() ? `?${params.toString()}` : "";
  };

  // Fetch ingredients with filters
  const { data: ingredients, isLoading, error } = useQuery<Ingredient[]>({
    queryKey: [`/api/ingredients${buildQueryString()}`],
  });



  // Toggle "My Bar" status mutation
  const toggleMyBarMutation = useMutation({
    mutationFn: async ({ id, inMyBar }: { id: string; inMyBar: boolean }) => {
      return apiRequest("PATCH", `/api/ingredients/${id}/toggle-mybar`, { inMyBar });
    },
    onSuccess: () => {
      // Invalidate all ingredient queries to ensure proper cache updates across all views
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return !!(query.queryKey[0] && typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/ingredients'));
        }
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleToggleMyBar = (ingredient: Ingredient) => {
    // My Bar functionality has been moved to preferred brands system
    console.log("My Bar functionality moved to preferred brands");
  };

  // Get subcategories for selected category  
  const getSubcategoriesForCategory = (category: string) => {
    if (category === "all") return [];
    // For now, return empty array - subcategories can be added later
    return [];
  };

  const subcategories = getSubcategoriesForCategory(selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161611] text-white p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="bg-[#383629] border-[#544f3b] animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-[#544f3b] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#544f3b] rounded w-full mb-1"></div>
                <div className="h-3 bg-[#544f3b] rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#161611] text-white p-10">
        <Card className="bg-[#383629] border-[#544f3b]">
          <CardContent className="p-8 text-center">
            <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Error loading ingredients. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171712] pb-20 md:pb-0">
      <TopNavigation />
      
      <div className="px-4 md:px-40 py-5">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Ingredients
          </h1>
          <p className="text-sm text-[#bab59c]">
            Manage your bar and explore {ingredients?.length || 0} ingredients. Build your perfect home bar collection.
          </p>
        </div>

        {/* Search Form */}
        <div className="py-3">
          <form onSubmit={handleSearch} className="h-12">
            <div className="flex h-full rounded-lg bg-[#383629] overflow-hidden">
              <div className="pl-4 flex items-center">
                <SearchIcon className="h-5 w-5 text-[#bab59c]" />
              </div>
              <Input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent h-full text-white placeholder:text-[#bab59c] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica] pl-2 pr-4 py-2"
              />
            </div>
          </form>
        </div>

        {/* Filters and Controls */}
        <div className="space-y-3 py-3">
          {/* Filter Row */}
          <div className="flex gap-2 overflow-x-auto">
            {/* Category Filter */}
            <div className="flex-shrink-0">
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedSubcategory("all"); // Reset subcategory when category changes
              }}>
                <SelectTrigger className="w-auto min-w-[100px] h-8 gap-1 pl-3 pr-1 rounded-lg bg-[#383629] border-0 text-xs font-medium text-white">
                  <SelectValue placeholder="Categories" />
                </SelectTrigger>
                <SelectContent className="bg-[#383629] border-[#544f3b]">
                  <SelectItem value="all" className="text-white">
                    All Categories
                  </SelectItem>
                  {INGREDIENT_CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category} 
                      value={category}
                      className="text-white capitalize"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory Filter */}
            {subcategories.length > 0 && (
              <div className="flex-shrink-0">
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger className="w-auto min-w-[120px] h-8 gap-1 pl-3 pr-1 rounded-lg bg-[#383629] border-0 text-xs font-medium text-white">
                    <SelectValue placeholder="Subcategories" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#383629] border-[#544f3b]">
                    <SelectItem value="all" className="text-white">
                      All Subcategories
                    </SelectItem>
                    {subcategories.map((subcategory: string) => (
                      <SelectItem 
                        key={subcategory} 
                        value={subcategory}
                        className="text-white capitalize"
                      >
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Action Button Row */}
          <div className="flex justify-center">
            <Link href="/add-ingredient" className="w-full max-w-xs">
              <Button
                size="sm"
                className="w-full h-10 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold"
              >
                Add Ingredient
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        {ingredients && (
          <div className="py-3 border-b border-[#544f3b] mb-3">
            <div className="flex items-center gap-6 text-sm text-[#bab59c] overflow-x-auto">
              <div className="flex items-center gap-2 flex-shrink-0">
                <BarChart3 className="h-4 w-4" />
                <span>Total: {ingredients.length}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Check className="h-4 w-4 text-[#f2c40c]" />
                <span>In My Bar: 0</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Star className="h-4 w-4" />
                <span>Used In: 3 recipes</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="py-6">
          {ingredients && ingredients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ingredients.map((ingredient: Ingredient) => (
                <Card key={ingredient.id} className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300">
                  {/* Image Section */}
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={ingredient.imageUrl || noPhotoImage}
                      alt={ingredient.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = noPhotoImage;
                      }}
                    />
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="border-[#bab59b] text-[#bab59b] text-xs"
                        >
                          {ingredient.category}
                        </Badge>
                        {ingredient.usedInRecipesCount > 0 && (
                          <div className="flex items-center gap-1 text-[#bab59b] text-xs">
                            <BarChart3 className="h-3 w-3" />
                            <span>{ingredient.usedInRecipesCount}</span>
                          </div>
                        )}
                      </div>
                      {/* ABV/Proof display removed - now managed in preferred brands */}
                    </div>
                    <CardTitle className="text-lg text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {ingredient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ingredient.subCategory && (
                        <p className="text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica] capitalize">
                          {ingredient.subCategory}
                        </p>
                      )}
                      {/* Preferred brand display removed - now managed in separate preferred brands system */}
                      {ingredient.description && (
                        <p className="text-[#bab59b] text-xs [font-family:'Plus_Jakarta_Sans',Helvetica] line-clamp-2">
                          {ingredient.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleToggleMyBar(ingredient)}
                          className="bg-transparent border border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c] flex-1"
                          disabled
                        >
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            My Bar (Use Preferred Brands)
                          </>
                        </Button>
                        <Link href={`/edit-ingredient/${ingredient.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 text-[#bab59b] hover:text-[#f2c40c] hover:bg-[#383629]"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#383629] border-[#544f3b]">
              <CardContent className="p-8 text-center">
                <SearchIcon className="h-12 w-12 text-[#544f3b] mx-auto mb-4" />
                <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  No ingredients found. Try adjusting your search or filters.
                </p>
                <Link href="/add-ingredient">
                  <Button className="mt-4 bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                    Add Your First Ingredient
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};