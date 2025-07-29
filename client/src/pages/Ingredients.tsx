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
              className="bg-transparent border-0 text-white placeholder:text-[#bab59c] focus:ring-0 pl-2"
            />
          </div>
        </form>

        {/* Filters + Button */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSubcategory("all"); }}>
            <SelectTrigger className="min-w-[120px] h-8 bg-[#383629] border-0 text-xs text-white">
              <SelectValue placeholder="Categories" />
            </SelectTrigger>
            <SelectContent className="bg-[#383629] border-[#544f3b]">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-white capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {subcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="min-w-[120px] h-8 bg-[#383629] border-0 text-xs text-white">
                <SelectValue placeholder="Subcategories" />
              </SelectTrigger>
              <SelectContent className="bg-[#383629] border-[#544f3b]">
                <SelectItem value="all" className="text-white">All Subcategories</SelectItem>
                {subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub} className="text-white capitalize">{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Link href="/add-ingredient" className="ml-auto">
            <Button size="sm" className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold">
              Add Ingredient
            </Button>
          </Link>
        </div>

        {/* Ingredient Cards */}
        {ingredients && ingredients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ingredients.map((ingredient) => (
              <Card key={ingredient.id} className="bg-[#383629] border-[#544f3b]">
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                  <img
                    src={ingredient.imageUrl || noPhotoImage}
                    alt={ingredient.name}
                    className="h-full w-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).src = noPhotoImage)}
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <Badge className="border-[#bab59b] text-[#bab59b] text-xs">{ingredient.category}</Badge>
                    {ingredient.usedInRecipesCount > 0 && (
                      <div className="flex items-center text-xs text-[#bab59b]">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {ingredient.usedInRecipesCount}
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-white text-lg">{ingredient.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {ingredient.subCategory && <p className="capitalize text-sm text-[#bab59b]">{ingredient.subCategory}</p>}
                  {ingredient.description && <p className="text-xs text-[#bab59b] line-clamp-2">{ingredient.description}</p>}
                  <div className="flex justify-between items-center pt-2">
                    <Button size="sm" disabled className="flex-1 border border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c]">
                      <Plus className="h-3 w-3 mr-1" /> My Bar (Preferred Brands)
                    </Button>
                    <Link href={`/edit-ingredient/${ingredient.id}`}>
                      <Button size="sm" variant="ghost" className="px-2 text-[#bab59b] hover:text-[#f2c40c]">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#383629] border-[#544f3b]">
            <CardContent className="p-8 text-center">
              <SearchIcon className="h-12 w-12 text-[#544f3b] mx-auto mb-4" />
              <p className="text-[#bab59b]">No ingredients found. Try adjusting your search or filters.</p>
              <Link href="/add-ingredient">
                <Button className="mt-4 bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                  Add Your First Ingredient
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      <Navigation />
    </div>
  );
};
