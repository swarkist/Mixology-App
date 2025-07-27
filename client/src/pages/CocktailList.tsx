import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { SearchIcon, Star, TrendingUp, Grid, List, Filter, StarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { Cocktail } from "@shared/schema";
import { SPIRIT_SUBCATEGORIES } from "@shared/schema";
import { DesktopNavigation, Navigation } from "@/components/Navigation";

export const CocktailList = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [spiritFilter, setSpiritFilter] = useState<string>("all");
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  // Parse URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get("search");
    const featured = urlParams.get("featured");
    const popular = urlParams.get("popular");
    
    if (search) setSearchQuery(search);
    if (featured === "true") setShowOnlyFeatured(true);
    if (popular === "true") setShowOnlyPopular(true);
  }, []);

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (showOnlyFeatured) params.set("featured", "true");
    if (showOnlyPopular) params.set("popular", "true");
    return params.toString() ? `?${params.toString()}` : "";
  };

  // Fetch cocktails with filters
  const { data: cocktails, isLoading, error } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails", { search: searchQuery, featured: showOnlyFeatured, popular: showOnlyPopular }],
    queryFn: async () => {
      const response = await fetch(`/api/cocktails${buildQueryString()}`);
      if (!response.ok) throw new Error('Failed to fetch cocktails');
      return response.json();
    },
  });

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return apiRequest("PATCH", `/api/cocktails/${id}/featured`, { featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
    },
  });

  // Increment popularity mutation
  const incrementPopularityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/cocktails/${id}/popularity`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/cocktails${buildQueryString()}`);
  };

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
            <Card key={i} className="bg-[#383629] border-[#544f3b] animate-pulse">
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
    <div className="min-h-screen bg-[#171712]">
      <DesktopNavigation />
      
      <div className="px-40 py-5">
        {/* Header */}
        <div className="p-4 mb-3">
          <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Cocktails
          </h1>
          <p className="text-sm text-[#bab59c]">
            Explore our curated collection of cocktail recipes, perfect for any occasion. Find your new favorite drink today.
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
                placeholder="Search cocktails"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent h-full text-white placeholder:text-[#bab59c] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica] pl-2 pr-4 py-2"
              />
            </div>
          </form>
        </div>

        {/* Sort and Filter Buttons */}
        <div className="flex gap-3 pl-3 pr-4 py-3">
          <Select>
            <SelectTrigger className="w-auto h-8 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#383629] border-[#544f3b]">
              <SelectItem value="name" className="text-white">Name</SelectItem>
              <SelectItem value="date" className="text-white">Date</SelectItem>
              <SelectItem value="popularity" className="text-white">Popularity</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-auto h-8 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent className="bg-[#383629] border-[#544f3b]">
              <SelectItem value="all" className="text-white">All</SelectItem>
              <SelectItem value="featured" className="text-white">Featured</SelectItem>
              <SelectItem value="popular" className="text-white">Popular</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showOnlyFeatured ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
            className={`h-8 px-4 rounded-lg ${showOnlyFeatured ? "bg-[#f2c40c] text-[#161611]" : "bg-[#383629] border-0 text-white hover:bg-[#444133]"}`}
          >
            <Star className="h-4 w-4 mr-2" />
            Featured
          </Button>

          <Button
            variant={showOnlyPopular ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyPopular(!showOnlyPopular)}
            className={`h-8 px-4 rounded-lg ${showOnlyPopular ? "bg-[#f2c40c] text-[#161611]" : "bg-[#383629] border-0 text-white hover:bg-[#444133]"}`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular
          </Button>

          <div className="flex ml-auto gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 px-3 ${viewMode === "grid" ? "bg-[#f2c40c] text-[#161611]" : "bg-[#383629] text-white hover:bg-[#444133]"}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-8 px-3 ${viewMode === "list" ? "bg-[#f2c40c] text-[#161611]" : "bg-[#383629] text-white hover:bg-[#444133]"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cocktail Grid */}
        <div className="px-4 py-6">
          {cocktails && cocktails.length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {cocktails.map((cocktail: Cocktail) => (
                <Card key={cocktail.id} className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cocktail.isFeatured && (
                          <Badge className="bg-[#f2c40c] text-[#161611] font-bold">
                            Featured
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-[#bab59b] text-sm">
                          <TrendingUp className="h-4 w-4" />
                          <span>{cocktail.popularityCount} views</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(cocktail)}
                        className="text-[#bab59b] hover:text-[#f2c40c]"
                        disabled={toggleFeaturedMutation.isPending}
                      >
                        <StarIcon className={`h-4 w-4 ${cocktail.isFeatured ? "fill-[#f2c40c] text-[#f2c40c]" : ""}`} />
                      </Button>
                    </div>
                    <CardTitle className="text-xl text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {cocktail.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cocktail.description && (
                      <p className="text-[#bab59b] text-sm mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {cocktail.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Link href={`/recipe/${cocktail.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#544f3b] text-[#bab59b] hover:text-white"
                        >
                          View Recipe
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartMaking(cocktail)}
                        className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 border-0"
                        disabled={incrementPopularityMutation.isPending}
                      >
                        Start Making
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#bab59c] text-lg [font-family:'Plus_Jakarta_Sans',Helvetica]">
                No cocktails found. Try adjusting your filters or search terms.
              </p>
              <Link href="/add-cocktail">
                <Button className="mt-4 bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 font-bold">
                  Add Your First Cocktail
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};