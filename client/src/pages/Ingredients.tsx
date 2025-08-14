import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { SearchIcon, Plus, Filter, Check, Star, BarChart3, Edit2, X, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Ingredient } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { useDebounce } from "@/lib/useDebounce";
import { getQueryParam, setQueryParamReplace } from "@/lib/url";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const Ingredients = (): JSX.Element => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [term, setTerm] = useState(() => getQueryParam("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(() => getQueryParam("category") || "");

  
  const isAdmin = user?.role === 'admin' || user?.role === 'reviewer';
  const debounced = useDebounce(term, 300);

  // Check if category filters are active (not search)
  const hasCategoryFilters = Boolean(selectedCategory);

  // Fetch all ingredients first 
  const { data: allIngredients, isLoading, error } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Handle URL state synchronization
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("search");
    url.searchParams.delete("category");
    
    if (debounced.trim()) url.searchParams.set("search", debounced.trim());
    if (selectedCategory) url.searchParams.set("category", selectedCategory);
    
    window.history.replaceState({}, "", url);
  }, [debounced, selectedCategory]);

  // Filter ingredients based on search and filters
  const visibleIngredients = useMemo(() => {
    if (!allIngredients) return [];
    
    let filtered = [...allIngredients];
    
    // Apply search filter
    if (debounced.trim()) {
      const q = debounced.toLowerCase();
      filtered = filtered.filter((ingredient: Ingredient) =>
        ingredient.name?.toLowerCase().includes(q) ||
        ingredient.description?.toLowerCase().includes(q)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((ingredient: Ingredient) => 
        ingredient.category === selectedCategory
      );
    }
    
    
    return filtered;
  }, [allIngredients, debounced, selectedCategory]);



  // Toggle "My Bar" status mutation
  const toggleMyBarMutation = useMutation({
    mutationFn: async ({ id, inMyBar }: { id: string; inMyBar: boolean }) => {
      return apiRequest(`/api/ingredients/${id}/toggle-mybar`, { method: "PATCH", body: { inMyBar } });
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



  const handleToggleMyBar = (ingredient: Ingredient) => {
    // My Bar functionality has been moved to preferred brands system
    console.log("My Bar functionality moved to preferred brands");
  };



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
        <div className="p-4 mb-3">
          <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Ingredients
          </h1>
          <p className="text-sm text-[#bab59c]">
            Manage your bar and explore {allIngredients?.length || 0} ingredients. Build your perfect home bar collection.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar 
          value={term}
          onChange={setTerm}
          placeholder="Search ingredients..."
        />

        {/* Filter and Action Buttons */}
        <div className="px-3 py-3 space-y-3">
          {/* Category Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            {INGREDIENT_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedCategory === category) {
                    setSelectedCategory("");
                  } else {
                    setSelectedCategory(category);
                  }
                }}
                className={`h-8 px-3 rounded-lg text-xs capitalize ${
                  selectedCategory === category
                    ? "bg-[#f2c40c] text-[#161611] hover:bg-[#e6b00a] hover:text-[#161611]"
                    : "bg-[#383629] border-0 text-white hover:bg-[#444133]"
                }`}
              >
                {category}
              </Button>
            ))}

            {hasCategoryFilters && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSelectedCategory("");
                  // Clear URL params for filters
                  const url = new URL(window.location.href);
                  url.searchParams.delete("category");
                  window.history.replaceState({}, "", url);
                }}
                className="h-8 px-3 rounded-lg text-xs bg-[#544f3b] border-0 text-[#bab59b] hover:bg-[#665b47] hover:text-white transition-colors inline-flex items-center gap-1"
                aria-label="Clear category filters"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear filters
              </Button>
            )}

            {isAdmin && (
              <Link href="/add-ingredient">
                <Button
                  size="sm"
                  className="h-8 px-4 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold text-xs"
                >
                  Add Ingredient
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {visibleIngredients && (
          <div className="py-3 border-b border-[#544f3b] mb-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#bab59c]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Total: {visibleIngredients.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#f2c40c]" />
                <span>In My Bar: 0</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Used In: 3 recipes</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-6">
          {visibleIngredients.length === 0 ? (
            <EmptyState 
              term={term} 
              onClear={() => setTerm("")}
              isFilterResult={hasCategoryFilters}
              onClearFilters={() => {
                setSelectedCategory("");
                // Clear URL params for filters
                const url = new URL(window.location.href);
                url.searchParams.delete("category");
                window.history.replaceState({}, "", url);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleIngredients.map((ingredient: Ingredient) => (
                <Card key={ingredient.id} className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Image Section */}
                  <div
                    className="w-full h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: ingredient.imageUrl
                        ? `url(${ingredient.imageUrl})`
                        : `url(${noPhotoImage})`,
                    }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#f2c40c] text-[#161611] font-bold">
                          {ingredient.category}
                        </Badge>
                        {ingredient.usedInRecipesCount > 0 && (
                          <div className="flex items-center gap-1 text-[#bab59b] text-sm">
                            <BarChart3 className="h-4 w-4" />
                            <span>{ingredient.usedInRecipesCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-white truncate [font-family:'Plus_Jakarta_Sans',Helvetica]" title={ingredient.name}>
                      {ingredient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex-1">
                      {ingredient.subCategory && (
                        <p className="text-[#bab59b] text-sm mb-2 [font-family:'Plus_Jakarta_Sans',Helvetica] capitalize">
                          {ingredient.subCategory}
                        </p>
                      )}
                      {ingredient.description && (
                        <p className="text-[#bab59b] text-sm mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {ingredient.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Link href={`/ingredient/${ingredient.id}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-transparent border border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c]"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Ingredient
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link href={`/edit-ingredient/${ingredient.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-3 text-[#bab59b] hover:text-[#f2c40c] hover:bg-[#383629]"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};