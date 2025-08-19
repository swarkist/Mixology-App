import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Heart, Edit, Edit2, BarChart3, Check, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { PreferredBrand } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { useDebounce } from "@/lib/useDebounce";
import { getQueryParam, setQueryParamReplace } from "@/lib/url";
import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { openMixi } from "@/lib/mixiBus";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

// Define brand type categories based on common spirits and mixers
const BRAND_CATEGORIES = [
  "spirits",
  "liqueurs",
  "mixers",
  "bitters",
  "syrups",
  "other",
] as const;

const preferredBrandsQueryKey = ["/api/preferred-brands", { inMyBar: true }] as const;

export default function MyBar() {
  const { user } = useAuth();
  const [term, setTerm] = useState(() => getQueryParam("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(() => getQueryParam("category") || "");
  const queryClient = useQueryClient();
  
  const isLoggedIn = !!user;
  const debounced = useDebounce(term, 300);

  // Check if category filters are active (not search)
  const hasCategoryFilters = Boolean(selectedCategory);

  // Handle URL state synchronization
  useEffect(() => {
    if (debounced.trim()) {
      setQueryParamReplace("search", debounced.trim());
    } else {
      setQueryParamReplace("search", "");
    }
  }, [debounced]);

  useEffect(() => {
    if (selectedCategory.trim()) {
      setQueryParamReplace("category", selectedCategory.trim());
    } else {
      setQueryParamReplace("category", "");
    }
  }, [selectedCategory]);

  // Fetch all preferred brands with inMyBar filter
  const { data: allMyBarItems = [], isLoading, error } = useQuery({
    queryKey: preferredBrandsQueryKey,
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append("inMyBar", "true");
        const response = await fetch(`/api/preferred-brands?${params}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Failed to fetch my bar items: ${response.status}`);
        }
        return data;
      } catch (error) {
        console.error("Error fetching my bar items:", error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isLoggedIn,
  });

  // Helper function to categorize brands based on name patterns
  const categorizeBrand = (brandName: string): string => {
    const name = brandName.toLowerCase();
    
    // Spirits patterns
    if (name.includes('whiskey') || name.includes('whisky') || name.includes('bourbon') || 
        name.includes('scotch') || name.includes('rye') || name.includes('vodka') || 
        name.includes('gin') || name.includes('rum') || name.includes('tequila') || 
        name.includes('cognac') || name.includes('brandy') || name.includes('moonshine')) {
      return 'spirits';
    }
    
    // Liqueurs patterns
    if (name.includes('liqueur') || name.includes('schnapps') || name.includes('amaretto') ||
        name.includes('baileys') || name.includes('kahlua') || name.includes('cointreau') ||
        name.includes('grand marnier') || name.includes('triple sec') || name.includes('curacao')) {
      return 'liqueurs';
    }
    
    // Bitters patterns
    if (name.includes('bitter') || name.includes('angostura') || name.includes('peychaud')) {
      return 'bitters';
    }
    
    // Syrups patterns
    if (name.includes('syrup') || name.includes('grenadine') || name.includes('simple syrup') ||
        name.includes('cherry syrup') || name.includes('vanilla syrup')) {
      return 'syrups';
    }
    
    // Mixers patterns  
    if (name.includes('tonic') || name.includes('soda') || name.includes('ginger beer') ||
        name.includes('club soda') || name.includes('mixer') || name.includes('juice')) {
      return 'mixers';
    }
    
    return 'other';
  };

  // Filter items based on search and category
  const visibleMyBarItems = useMemo(() => {
    if (!allMyBarItems) return [];
    
    let filtered = allMyBarItems;
    
    // Apply search filter
    if (debounced.trim()) {
      const q = debounced.toLowerCase();
      filtered = filtered.filter((item: PreferredBrand) =>
        item.name?.toLowerCase().includes(q)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item: PreferredBrand) => {
        const itemCategory = categorizeBrand(item.name || '');
        return itemCategory === selectedCategory;
      });
    }
    
    return filtered;
  }, [allMyBarItems, debounced, selectedCategory]);

  const toggleMyBarMutation = useMutation({
    mutationFn: async (brandId: number) => {
      return apiRequest(`/api/preferred-brands/${brandId}/toggle-mybar`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferredBrandsQueryKey });
    },
  });

  const handleToggleMyBar = async (brand: PreferredBrand) => {
    try {
      await toggleMyBarMutation.mutateAsync(brand.id);
    } catch (error) {
      console.error("Error toggling My Bar:", error);
    }
  };

  // Show login message for non-logged-in users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#171712] pb-20 md:pb-0">
        <TopNavigation />
        <div className="px-4 md:px-40 py-5">
          <div className="p-4 mb-3">
            <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              My Bar
            </h1>
            <div className="text-center py-12">
              <p className="text-[#bab59c] text-lg mb-4">
                Please login to see or manage your bar.
              </p>
              <Link href="/login">
                <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold">
                  Login to Continue
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171712] pb-20 md:pb-0">
        <TopNavigation />
        <div className="px-4 md:px-40 py-5">
          <div className="p-4 mb-3">
            <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              My Bar
            </h1>
            <p className="text-sm text-[#bab59c]">Loading your bar...</p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#171712] pb-20 md:pb-0">
        <TopNavigation />
        <div className="px-4 md:px-40 py-5">
          <div className="p-4 mb-3">
            <h1 className="text-[32px] font-bold text-white mb-3 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              My Bar
            </h1>
            <div className="text-center py-12">
              <p className="text-[#bab59c] text-lg mb-4">
                Error loading your bar. Please try again.
              </p>
            </div>
          </div>
        </div>
        <Navigation />
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
            My Bar
          </h1>
          <p className="text-sm text-[#bab59c]">
            Manage your personal collection of spirits, liqueurs, and ingredients. 
            Add items to track what you have available for crafting cocktails.
          </p>
        </div>

        {/* Search */}
        <SearchBar 
          value={term}
          onChange={setTerm}
          placeholder="Search my bar..."
        />

        {/* Ask Mixi CTA with My Bar Context */}
        <div className="px-3 py-2">
          <button
            onClick={() =>
              openMixi({
                seed: "Hi there! I'm here to help you find cocktails you can make with your bar items.",
                context: {
                  myBar: visibleMyBarItems
                },
                initialUserMessage: "I want cocktail suggestions based on what's in my bar. What can I make?"
              })
            }
            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium underline hover:no-underline transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#171712] rounded"
            aria-label="Ask Mixi about cocktails you can make"
          >
            <MixiIconBartender size={14} />
            What can I make with my bar?
          </button>
        </div>

        {/* Filter and Action Buttons */}
        <div className="px-3 py-3 space-y-3">
          <div className="flex gap-2 flex-wrap justify-between">
            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {BRAND_CATEGORIES.map((category) => (
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href="/preferred-brands">
                <Button
                  size="sm"
                  className="h-8 px-4 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Items
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b border-[#544f3b] mb-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#bab59c]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Total Items: {visibleMyBarItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#f2c40c]" />
              <span>Available for mixing</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {visibleMyBarItems.length === 0 ? (
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
              {visibleMyBarItems.map((item: PreferredBrand) => (
                <Card key={item.id} className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Image Section */}
                  <div
                    className="w-full h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: item.imageUrl
                        ? `url(${item.imageUrl})`
                        : `url(${noPhotoImage})`,
                    }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-[#f2c40c] text-[#161611] font-bold hover:bg-[#e6b00a] hover:text-[#161611] capitalize">
                        {categorizeBrand(item.name || '')}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-white truncate [font-family:'Plus_Jakarta_Sans',Helvetica]" title={item.name}>
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex-1">
                      {item.proof && (
                        <p className="text-[#bab59b] text-sm mb-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {item.proof}% ABV
                        </p>
                      )}
                      <p className="text-[#bab59b] text-sm mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        Added to your personal bar collection
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        size="sm"
                        onClick={() => handleToggleMyBar(item)}
                        className="flex-1 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] border-0"
                        disabled={toggleMyBarMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Remove from Bar
                      </Button>
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
}