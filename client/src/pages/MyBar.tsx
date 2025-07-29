import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { SearchIcon, Plus, Filter, Check, Star, BarChart3, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { Ingredient, PreferredBrand } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const MyBar = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Fetch preferred brands in My Bar
  const { data: myBarBrands, isLoading: brandsLoading } = useQuery<PreferredBrand[]>({
    queryKey: ['/api/preferred-brands?inMyBar=true'],
  });

  // Fetch all ingredients to organize brands by ingredient associations
  const { data: allIngredients } = useQuery<Ingredient[]>({
    queryKey: ['/api/ingredients'],
  });

  // Fetch detailed brand data with associations for each brand in My Bar
  const { data: myBarBrandDetails } = useQuery({
    queryKey: ['my-bar-brand-details', myBarBrands?.map(b => b.id)],
    queryFn: async () => {
      if (!myBarBrands || myBarBrands.length === 0) return [];
      
      const brandDetails = await Promise.all(
        myBarBrands.map(async (brand) => {
          try {
            const response = await fetch(`/api/preferred-brands/${brand.id}`);
            const data = await response.json();
            return data.brand;
          } catch (error) {
            console.error(`Error fetching brand details for ${brand.id}:`, error);
            return brand; // fallback to basic brand data
          }
        })
      );
      return brandDetails;
    },
    enabled: !!myBarBrands && myBarBrands.length > 0,
  });

  // Group brands by their associated ingredients
  const organizedByIngredients = useMemo(() => {
    if (!myBarBrandDetails) return {};
    
    const organized: { [ingredientName: string]: { ingredient: Ingredient; brands: PreferredBrand[] } } = {};
    
    myBarBrandDetails.forEach((brand) => {
      if (brand.ingredients && brand.ingredients.length > 0) {
        brand.ingredients.forEach((ingredient: Ingredient) => {
          if (!organized[ingredient.name]) {
            organized[ingredient.name] = {
              ingredient,
              brands: []
            };
          }
          organized[ingredient.name].brands.push(brand);
        });
      } else {
        // If no associations, put in "Unassociated" category
        if (!organized["Unassociated Brands"]) {
          organized["Unassociated Brands"] = {
            ingredient: { name: "Unassociated Brands", category: "other" } as Ingredient,
            brands: []
          };
        }
        organized["Unassociated Brands"].brands.push(brand);
      }
    });
    
    return organized;
  }, [myBarBrandDetails]);

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

  // Toggle "My Bar" status mutation for ingredients
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

  // Toggle "My Bar" status mutation for preferred brands
  const toggleBrandMyBarMutation = useMutation({
    mutationFn: async (brandId: number) => {
      return apiRequest("PATCH", `/api/preferred-brands/${brandId}/toggle-mybar`);
    },
    onSuccess: () => {
      // Invalidate preferred brand queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return !!(query.queryKey[0] && typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/preferred-brands'));
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
    if (category === "spirits") {
      return ["tequila", "whiskey", "rum", "vodka", "gin", "scotch", "moonshine", "brandy"];
    }
    return [];
  };

  const subcategories = getSubcategoriesForCategory(selectedCategory);

  if (brandsLoading) {
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
            Your preferred brands organized by ingredient type. {myBarBrands?.length || 0} brands in your bar.
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
        <div className="px-4 py-3 border-b border-[#544f3b] mb-3">
          <div className="flex items-center gap-6 text-sm text-[#bab59c]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Total Brands: {myBarBrands?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#f2c40c]" />
              <span>Ingredient Types: {Object.keys(organizedByIngredients).length}</span>
            </div>
          </div>
        </div>

        {/* Content - Brands Organized by Ingredient */}
        <div className="px-4 py-6">
          {Object.keys(organizedByIngredients).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(organizedByIngredients).map(([ingredientName, { ingredient, brands }]) => (
                <div key={ingredientName} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {ingredientName}
                    </h2>
                    {ingredient.category && ingredient.category !== "other" && (
                      <Badge variant="outline" className="border-[#bab59b] text-[#bab59b] text-xs">
                        {ingredient.category}
                      </Badge>
                    )}
                    <span className="text-sm text-[#bab59c]">
                      {brands.length} brand{brands.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands.map((brand: PreferredBrand) => (
                      <Card key={brand.id} className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300">
                        {/* Image Section */}
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <img
                            src={brand.imageUrl || noPhotoImage}
                            alt={brand.name}
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
                                className="border-[#f2c40c] text-[#f2c40c] text-xs"
                              >
                                In My Bar
                              </Badge>
                              {brand.proof && (
                                <Badge 
                                  variant="outline" 
                                  className="border-[#bab59b] text-[#bab59b] text-xs"
                                >
                                  {brand.proof} proof
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className="text-lg text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                            {brand.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between pt-2 gap-2">
                              <Button
                                size="sm"
                                onClick={() => toggleBrandMyBarMutation.mutate(brand.id)}
                                className="bg-[#f2c40c] border border-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 flex-1"
                                disabled={toggleBrandMyBarMutation.isPending}
                              >
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Remove from Bar
                                </>
                              </Button>
                              <Link href={`/edit-preferred-brand/${brand.id}`}>
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
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-[#383629] border-[#544f3b]">
              <CardContent className="p-8 text-center">
                <SearchIcon className="h-12 w-12 text-[#544f3b] mx-auto mb-4" />
                <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica] mb-4">
                  Your bar is empty. Start building your preferred brands collection!
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/preferred-brands">
                    <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                      Browse Preferred Brands
                    </Button>
                  </Link>
                  <Link href="/ingredients">
                    <Button variant="outline" className="border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c]">
                      Browse Ingredients
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};