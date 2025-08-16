import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  SearchIcon,
  Star,
  TrendingUp,
  Grid,
  List,
  Filter,
  StarIcon,
  X,
  Edit2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Cocktail } from "@shared/schema";
import { SPIRIT_SUBCATEGORIES } from "@shared/schema";
import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { openMixi } from "@/lib/mixiBus";
import TopNavigation from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { useDebounce } from "@/lib/useDebounce";
import { getQueryParam, setQueryParamReplace } from "@/lib/url";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const CocktailList = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [term, setTerm] = useState(() => getQueryParam("q"));
  const debounced = useDebounce(term, 250);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [spiritFilter, setSpiritFilter] = useState<string>("all");
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);
  
  const isAdmin = user?.role === 'admin' || user?.role === 'reviewer';

  // Update URL when debounced search term changes
  useEffect(() => { 
    setQueryParamReplace("q", debounced); 
  }, [debounced]);

  // Check if Featured or Popular filters are active (not search)
  const hasSpecificFilters = showOnlyFeatured || showOnlyPopular;

  // Clear all filters function
  const clearAllFilters = () => {
    setShowOnlyFeatured(false);
    setShowOnlyPopular(false);
    setTerm('');
    setSpiritFilter('all');
    
    // Clear URL params
    if (typeof window !== 'undefined') {
      const { pathname } = window.location;
      window.history.replaceState({}, '', pathname);
    }
  };

  // Parse URL params for non-search filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const featured = urlParams.get("featured");
    const popular = urlParams.get("popular");

    if (featured === "true") setShowOnlyFeatured(true);
    if (popular === "true") setShowOnlyPopular(true);
  }, []);

  // Build query string for backend filters (not search)
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (showOnlyFeatured) params.set("featured", "true");
    if (showOnlyPopular) params.set("popular", "true");
    return params.toString() ? `?${params.toString()}` : "";
  };

  // Fetch cocktails with filters (but not search - that's client-side)
  const {
    data: allCocktails,
    isLoading,
    error,
  } = useQuery<Cocktail[]>({
    queryKey: [
      "/api/cocktails",
      {
        featured: showOnlyFeatured,
        popular: showOnlyPopular,
      },
    ],
    queryFn: async () => {
      const response = await fetch(`/api/cocktails${buildQueryString()}`);
      if (!response.ok) throw new Error("Failed to fetch cocktails");
      return response.json();
    },
  });

  // Client-side filtering for search
  const visibleCocktails = useMemo(() => {
    if (!allCocktails) return [];
    if (!debounced) return allCocktails;
    
    const q = debounced.toLowerCase();
    return allCocktails.filter((cocktail: Cocktail) =>
      cocktail.name?.toLowerCase().includes(q) ||
      cocktail.description?.toLowerCase().includes(q)
    );
  }, [allCocktails, debounced]);

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return apiRequest(`/api/cocktails/${id}/toggle-featured`, { method: "PATCH", body: { featured } });
    },
    onSuccess: () => {
      // Invalidate all cocktail queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
    },
  });

  // Increment popularity mutation
  const incrementPopularityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/cocktails/${id}/increment-popularity`, { method: "PATCH" });
    },
    onSuccess: () => {
      // Invalidate all cocktail queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
    },
  });



  const handleToggleFeatured = (cocktail: Cocktail) => {
    toggleFeaturedMutation.mutate({
      id: cocktail.id.toString(),
      featured: !cocktail.isFeatured,
    });
  };

  const handleStartMaking = (cocktail: Cocktail) => {
    incrementPopularityMutation.mutate(cocktail.id.toString());
    setLocation(`/recipe/${cocktail.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171712] text-white p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className="bg-[#383629] border-[#544f3b] animate-pulse"
            >
              <CardContent className="p-6">
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
      <div className="min-h-screen bg-[#171712] text-white p-10">
        <Card className="bg-[#383629] border-[#544f3b]">
          <CardContent className="p-8 text-center">
            <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Error loading cocktails. Please try again.
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
            Cocktails
          </h1>
          <p className="text-sm text-[#bab59c]">
            Explore our curated collection of cocktail recipes, perfect for any
            occasion. Find your new favorite drink today.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={term}
          onChange={setTerm}
          placeholder="Search cocktails..."
          autoFocus
        />

        {/* Ask Mixi CTA */}
        <div className="px-3 py-2">
          <button
            onClick={() =>
              openMixi({
                seed: "Tell me your spirits or mood and I'll suggest cocktails.",
                context: null
              })
            }
            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium underline hover:no-underline transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#171712] rounded"
            aria-label="Ask Mixi for cocktail suggestions"
          >
            <MixiIconBartender size={14} />
            Need ideas? Ask Mixi
          </button>
        </div>

        {/* Filter and Action Buttons */}
        <div className="px-3 py-3 space-y-3">
          {/* First Row: Filter Buttons and Add Cocktail */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={showOnlyFeatured ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              className={`h-8 px-3 rounded-lg text-xs ${showOnlyFeatured ? "bg-[#f2c40c] text-[#161611] hover:bg-[#e6b00a] hover:text-[#161611]" : "bg-[#383629] border-0 text-white hover:bg-[#444133]"}`}
            >
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Button>

            <Button
              variant={showOnlyPopular ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyPopular(!showOnlyPopular)}
              className={`h-8 px-3 rounded-lg text-xs ${showOnlyPopular ? "bg-[#f2c40c] text-[#161611] hover:bg-[#e6b00a] hover:text-[#161611]" : "bg-[#383629] border-0 text-white hover:bg-[#444133]"}`}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Popular
            </Button>

            {hasSpecificFilters && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setShowOnlyFeatured(false);
                  setShowOnlyPopular(false);
                  // Keep search term, only clear Featured/Popular filters
                  const url = new URL(window.location.href);
                  url.searchParams.delete("featured");
                  url.searchParams.delete("popular");
                  window.history.replaceState({}, "", url);
                }}
                className="h-8 px-3 rounded-lg text-xs bg-[#544f3b] border-0 text-[#bab59b] hover:bg-[#665b47] hover:text-white transition-colors inline-flex items-center gap-1"
                aria-label="Clear Featured and Popular filters"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear filters
              </Button>
            )}

            {isAdmin && (
              <Link href="/add-cocktail">
                <Button
                  size="sm"
                  className="h-8 px-4 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold text-xs"
                >
                  Add Cocktail
                </Button>
              </Link>
            )}
          </div>

          {/* Second Row: View Mode Buttons - Hidden for now */}
          {/* <div className="flex justify-end items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-8 px-2 ${viewMode === "grid" ? "bg-[#f2c40c] text-[#161611]" : "bg-[#383629] text-white hover:bg-[#444133]"}`}
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-8 px-2 ${viewMode === "list" ? "bg-[#f2c40c] text-[#161611]" : "bg-[#383629] text-white hover:bg-[#444133]"}`}
              >
                <List className="h-3 w-3" />
              </Button>
            </div>
          </div> */}
        </div>

        {/* Cocktail Grid */}
        <div className="px-4 py-6">
          {visibleCocktails.length === 0 ? (
            <EmptyState 
              term={term} 
              onClear={() => setTerm("")}
              isFilterResult={hasSpecificFilters}
              onClearFilters={() => {
                setShowOnlyFeatured(false);
                setShowOnlyPopular(false);
                // Keep search term, only clear Featured/Popular filters
                const url = new URL(window.location.href);
                url.searchParams.delete("featured");
                url.searchParams.delete("popular");
                window.history.replaceState({}, "", url);
              }}
            />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {visibleCocktails.map((cocktail: Cocktail) => (
                <Card
                  key={cocktail.id}
                  className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Cocktail Image */}
                  <div
                    className="w-full h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: cocktail.imageUrl
                        ? `url(${cocktail.imageUrl})`
                        : `url(${noPhotoImage})`,
                    }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cocktail.isFeatured && (
                          <Badge className="bg-[#f2c40c] text-[#161611] font-bold hover:bg-[#e6b00a] hover:text-[#161611]">
                            Featured
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-[#bab59b] text-sm">
                          <TrendingUp className="h-4 w-4" />
                          <span>{cocktail.popularityCount} crafted</span>
                        </div>
                      </div>
                      {isAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(cocktail)}
                          className="text-[#bab59b] hover:text-[#f2c40c]"
                          disabled={toggleFeaturedMutation.isPending || user?.role === 'reviewer'}
                        >
                          <StarIcon
                            className={`h-4 w-4 ${cocktail.isFeatured ? "fill-[#f2c40c] text-[#f2c40c]" : ""}`}
                          />
                        </Button>
                      ) : (
                        <StarIcon
                          className={`h-4 w-4 ${cocktail.isFeatured ? "fill-[#f2c40c] text-[#f2c40c]" : "text-[#bab59b]"}`}
                        />
                      )}
                    </div>
                    <CardTitle className="text-xl text-white truncate [font-family:'Plus_Jakarta_Sans',Helvetica]" title={cocktail.name}>
                      {cocktail.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex-1">
                      {cocktail.description && (
                        <p className="text-[#bab59b] text-sm mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {cocktail.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Link href={`/recipe/${cocktail.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 border-0"
                        >
                          View Recipe
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link href={`/edit-cocktail/${cocktail.id}`}>
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
