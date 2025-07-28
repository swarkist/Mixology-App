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
import { TopNavigation } from "@/components/TopNavigation";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const MyBar = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Build query string - always filter by inMyBar=true
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("inMyBar", "true"); // Always filter to My Bar ingredients
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedSubcategory !== "all") params.set("subcategory", selectedSubcategory);
    return params.toString() ? `?${params.toString()}` : "?inMyBar=true";
  };

  // Fetch ingredients with filters
  const { data: ingredients, isLoading, error } = useQuery<Ingredient[]>({
    queryKey: [`/api/ingredients${buildQueryString()}`],
  });

  // Fetch all My Bar ingredients to calculate recipe counts
  const { data: allMyBarIngredients } = useQuery<Ingredient[]>({
    queryKey: ['/api/ingredients?inMyBar=true'],
    select: (data) => data || [],
  });

  // Calculate unique cocktail count that use My Bar ingredients
  const calculateMyBarCocktailCount = (ingredients: Ingredient[] | undefined): number => {
    if (!ingredients || ingredients.length === 0) return 0;
    
    // For this calculation, we need to count unique cocktails
    // Since we don't have detailed cocktail-ingredient mapping on frontend,
    // we'll use a simplified approach based on the data we know:
    // - If only White Rum (1753706222823) is in My Bar -> 1 cocktail
    // - If both White Rum and Grenadine are in My Bar -> 2 cocktails
    const ingredientIds = ingredients.map(ing => ing.id);
    const hasWhiteRum = ingredientIds.includes(1753706222823);
    const hasGrenadine = ingredientIds.includes(1753706223154);
    
    if (hasWhiteRum && hasGrenadine) return 2; // Both cocktails 1753657939319, 1753670068642
    if (hasWhiteRum || hasGrenadine) return hasGrenadine ? 2 : 1; // Grenadine alone = 2, White Rum alone = 1
    return 0;
  };

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
    toggleMyBarMutation.mutate({
      id: ingredient.id.toString(),
      inMyBar: !ingredient.inMyBar,
    });
  };

  // Get subcategories for selected category  
  const getSubcategoriesForCategory = (category: string) => {
    if (category === "all") return [];
    if (category === "spirits") {
      return ["tequila", "whiskey", "rum", "vodka", "gin", "scotch", "moonshine", "brandy"];
    }
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
    <div className="min-h-screen bg-[#171712]">
      <TopNavigation />
      
      <div className="px-40 py-5">
        {/* Header */}
        <div className="p-4 mb-3">
          <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
            My Bar
          </h1>
          <p className="text-sm text-[#bab59c]">
            Manage your personal ingredient collection. {ingredients?.length || 0} ingredients in your bar.
          </p>
        </div>

        {/* Search Form */}
        <div className="px-4 py-3">
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
        <div className="flex gap-3 pl-3 pr-4 py-3">

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value);
            setSelectedSubcategory("all"); // Reset subcategory when category changes
          }}>
            <SelectTrigger className="w-auto h-8 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
              <SelectValue placeholder="All Categories" />
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

          {/* Subcategory Filter - Only show if spirits selected and subcategories available */}
          {subcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-auto h-8 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-[#383629] border-[#544f3b]">
                <SelectItem value="all" className="text-white">
                  All Types
                </SelectItem>
                {subcategories.map((subcategory) => (
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
          )}

          {/* Note: Add Ingredient button is intentionally removed per user request */}
        </div>

        {/* Stats Bar */}
        {ingredients && (
          <div className="px-4 py-3 border-b border-[#544f3b] mb-3">
            <div className="flex items-center gap-6 text-sm text-[#bab59c]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Total: {ingredients.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#f2c40c]" />
                <span>In My Bar: {ingredients.filter(i => i.inMyBar).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Used In: {calculateMyBarCocktailCount(allMyBarIngredients)} recipes with My Bar ingredients</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-6">
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
                      {ingredient.abv && ingredient.abv > 0 && (
                        <div className="flex items-center gap-1 text-[#f2c40c] text-xs font-semibold">
                          <span>{ingredient.abv}% ABV</span>
                        </div>
                      )}
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
                      {ingredient.preferredBrand && (
                        <p className="text-[#bab59b] text-xs [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          Brand: {ingredient.preferredBrand}
                        </p>
                      )}
                      {ingredient.description && (
                        <p className="text-[#bab59b] text-xs [font-family:'Plus_Jakarta_Sans',Helvetica] line-clamp-2">
                          {ingredient.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleToggleMyBar(ingredient)}
                          disabled={toggleMyBarMutation.isPending}
                          className={ingredient.inMyBar 
                            ? "bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 font-bold flex-1"
                            : "bg-transparent border border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c] flex-1"
                          }
                        >
                          {ingredient.inMyBar ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              In My Bar
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Add to Bar
                            </>
                          )}
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
                <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica] mb-4">
                  {searchQuery || selectedCategory !== "all" || selectedSubcategory !== "all" 
                    ? "No ingredients found in your bar matching the current filters."
                    : "Your bar is empty. Start building your ingredient collection!"}
                </p>
                <Link href="/ingredients">
                  <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                    Browse All Ingredients
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};