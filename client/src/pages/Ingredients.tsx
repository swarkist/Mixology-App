import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { SearchIcon, Plus, Edit2, BarChart3, Check, Star } from "lucide-react";
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

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedSubcategory !== "all") params.set("subcategory", selectedSubcategory);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: ingredients, isLoading, error } = useQuery<Ingredient[]>({
    queryKey: ["ingredients", searchQuery, selectedCategory, selectedSubcategory],
    queryFn: async () => {
      const qs = buildQueryString();
      return apiRequest("GET", `/api/ingredients${qs}`);
    }
  });

  const toggleMyBarMutation = useMutation({
    mutationFn: async ({ id, inMyBar }: { id: string; inMyBar: boolean }) => {
      return apiRequest("PATCH", `/api/ingredients/${id}/toggle-mybar`, { inMyBar });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/ingredients')
      });
    },
  });

  const handleToggleMyBar = (ingredient: Ingredient) => {
    toggleMyBarMutation.mutate({
      id: ingredient.id.toString(),
      inMyBar: !ingredient.inMyBar
    });
  };

  const getSubcategoriesForCategory = (category: string) => {
    if (category === "all") return [];
    return [];
  };

  const subcategories = getSubcategoriesForCategory(selectedCategory);

  if (isLoading) {
    return <div className="min-h-screen bg-[#161611] text-white p-10">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#161611] text-white p-10">Error loading ingredients.</div>;
  }

  return (
    <div className="min-h-screen bg-[#171712] pb-20 md:pb-0">
      <TopNavigation />
      <div className="px-4 py-5 max-w-7xl mx-auto">
        <h1 className="text-[32px] font-bold text-white mb-3">Ingredients</h1>
        <p className="text-sm text-[#bab59c] mb-4">
          Manage your bar and explore {ingredients?.length || 0} ingredients.
        </p>

        {/* Search */}
        <form onSubmit={(e) => e.preventDefault()} className="mb-4">
          <div className="flex items-center bg-[#383629] rounded-lg h-12">
            <div className="pl-4">
              <SearchIcon className="h-5 w-5 text-[#bab59c]" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ingredients..."
              className="bg-transparent border-0 text-white placeholder:text-[#bab59c] focus:ring-0 pl-2 [font-family:'Plus_Jakarta_Sans',Helvetica]"
            />
          </div>
        </form>

        {/* Filters and Controls - HORIZONTAL SCROLLING FIX APPLIED */}
        <div className="flex flex-wrap gap-3 py-3">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value);
            setSelectedSubcategory("all"); // Reset subcategory when category changes
          }}>
            <SelectTrigger className="w-auto min-w-[120px] h-8 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
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

          {/* Subcategory Filter */}
          {subcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-auto min-w-[140px] h-8 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
                <SelectValue placeholder="All Subcategories" />
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
          )}

          <Link href="/add-ingredient" className="ml-auto">
            <Button
              size="sm"
              className="h-8 px-4 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold whitespace-nowrap"
            >
              Add Ingredient
            </Button>
          </Link>
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
                <span>In My Bar: {ingredients.filter(i => i.inMyBar).length}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Star className="h-4 w-4" />
                <span>Used In: {ingredients.reduce((sum, i) => sum + i.usedInRecipesCount, 0)} recipes</span>
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
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => ((e.target as HTMLImageElement).src = noPhotoImage)}
                    />
                  </div>

                  {/* Content Section */}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="bg-[#544f3b] text-[#bab59b] border-0 text-xs [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {ingredient.category}
                      </Badge>
                      {ingredient.usedInRecipesCount > 0 && (
                        <div className="flex items-center text-xs text-[#bab59b]">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          <span>{ingredient.usedInRecipesCount}</span>
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-white text-lg [font-family:'Plus_Jakarta_Sans',Helvetica] leading-tight">
                      {ingredient.name}
                    </CardTitle>
                    
                    {ingredient.subCategory && (
                      <p className="text-sm text-[#bab59b] capitalize [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {ingredient.subCategory}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {ingredient.description && (
                      <p className="text-sm text-[#bab59b] line-clamp-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {ingredient.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleToggleMyBar(ingredient)}
                        size="sm"
                        variant="outline"
                        className={`flex-1 h-8 text-xs [font-family:'Plus_Jakarta_Sans',Helvetica] ${
                          ingredient.inMyBar 
                            ? "bg-[#f2c40c] text-[#161611] border-[#f2c40c] hover:bg-[#e0b40a]" 
                            : "bg-transparent border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c] hover:bg-[#383629]"
                        }`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {ingredient.inMyBar ? "In My Bar" : "Add to Bar"}
                      </Button>
                      
                      <Link href={`/edit-ingredient/${ingredient.id}`}>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c] hover:bg-[#383629] h-8 px-3 text-xs [font-family:'Plus_Jakarta_Sans',Helvetica]"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#bab59b] py-12">
              <p className="text-lg [font-family:'Plus_Jakarta_Sans',Helvetica]">
                No ingredients found
              </p>
              <p className="text-sm mt-2">
                Try adjusting your search or add some ingredients to get started
              </p>
            </div>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};