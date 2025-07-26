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
    queryKey: [`/api/cocktails${buildQueryString()}`],
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
      <div className="min-h-screen bg-[#161611] text-white p-10">
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
      <div className="min-h-screen bg-[#161611] text-white p-10">
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
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="border-b border-[#544f3b] px-10 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/">
              <h1 className="text-3xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                Cocktail Recipes
              </h1>
            </Link>
            <p className="text-[#bab59b] mt-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Explore our collection of {cocktails?.length || 0} cocktail recipes
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#544f3b] rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${viewMode === "grid" ? "bg-[#f2c40c] text-[#161611]" : "text-[#bab59b] hover:text-white"}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 ${viewMode === "list" ? "bg-[#f2c40c] text-[#161611]" : "text-[#bab59b] hover:text-white"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Link href="/add-cocktail">
              <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 font-bold">
                Add Recipe
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-64">
            <div className="flex items-center h-10 rounded-lg bg-[#383529] overflow-hidden">
              <div className="pl-4 flex items-center">
                <SearchIcon className="h-5 w-5 text-[#bab59b]" />
              </div>
              <Input
                type="text"
                placeholder="Search cocktails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent h-full text-white placeholder:text-[#bab59b] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica]"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#bab59b]" />
            <Button
              variant={showOnlyFeatured ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              className={showOnlyFeatured ? "bg-[#f2c40c] text-[#161611]" : "border-[#544f3b] text-[#bab59b] hover:text-white"}
            >
              <Star className="h-4 w-4 mr-1" />
              Featured
            </Button>
            <Button
              variant={showOnlyPopular ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyPopular(!showOnlyPopular)}
              className={showOnlyPopular ? "bg-[#f2c40c] text-[#161611]" : "border-[#544f3b] text-[#bab59b] hover:text-white"}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Popular
            </Button>
          </div>

          {/* Spirit Filter */}
          <Select value={spiritFilter} onValueChange={setSpiritFilter}>
            <SelectTrigger className="w-40 bg-[#383629] border-[#544f3b] text-white">
              <SelectValue placeholder="All Spirits" />
            </SelectTrigger>
            <SelectContent className="bg-[#383629] border-[#544f3b]">
              <SelectItem value="all" className="text-white hover:bg-[#544f3b]">
                All Spirits
              </SelectItem>
              {SPIRIT_SUBCATEGORIES.map((spirit) => (
                <SelectItem 
                  key={spirit} 
                  value={spirit}
                  className="text-white hover:bg-[#544f3b] capitalize"
                >
                  {spirit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="px-10 py-8">
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
                      size="sm"
                      onClick={() => handleStartMaking(cocktail)}
                      disabled={incrementPopularityMutation.isPending}
                      className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 font-bold"
                    >
                      Start Making This
                    </Button>
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
                No cocktails found. Try adjusting your search or filters.
              </p>
              <Link href="/add-cocktail">
                <Button className="mt-4 bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                  Add Your First Recipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};