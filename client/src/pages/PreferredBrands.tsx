import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star, Heart, Edit, Edit2, BarChart3, Check, Camera } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { PreferredBrand } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import BrandFromImageDialog from "@/components/BrandFromImageDialog";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { useDebounce } from "@/lib/useDebounce";
import { setQueryParamReplace, getQueryParam } from "@/lib/url";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

const preferredBrandsQueryKey = ["/api/preferred-brands", { inMyBar: true }] as const;

export default function PreferredBrands() {
  const { user } = useAuth();
  const [term, setTerm] = useState(() => getQueryParam("search") || "");
  const [ocrOpen, setOcrOpen] = useState(false);
  const [draftBrand, setDraftBrand] = useState<{ name?: string; proof?: number | null } | null>(null);
  const queryClient = useQueryClient();
  
  const isLoggedIn = !!user;
  const debounced = useDebounce(term, 300);

  // Handle URL state synchronization
  useEffect(() => {
    if (debounced.trim()) {
      setQueryParamReplace("search", debounced.trim());
    } else {
      setQueryParamReplace("search", "");
    }
  }, [debounced]);

  // Fetch all brands first
  const { data: allBrands = [], isLoading, error } = useQuery({
    queryKey: ["/api/preferred-brands"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/preferred-brands`);
        if (!response.ok) {
          throw new Error(`Failed to fetch brands: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching preferred brands:", error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter brands based on search
  const visibleBrands = useMemo(() => {
    if (!allBrands) return [];
    
    if (!debounced.trim()) return allBrands;
    
    const q = debounced.toLowerCase();
    return allBrands.filter((brand: PreferredBrand) =>
      brand.name?.toLowerCase().includes(q)
    );
  }, [allBrands, debounced]);

  const toggleMyBarMutation = useMutation({
    mutationFn: async (brandId: number) => {
      return apiRequest(`/api/preferred-brands/${brandId}/toggle-mybar`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
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
              Preferred Brands
            </h1>
            <div className="text-center py-12">
              <p className="text-[#bab59c] text-lg mb-4">
                Please login to see or add your preferred brands.
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
              Preferred Brands
            </h1>
            <p className="text-sm text-[#bab59c]">Loading your preferred brands...</p>
          </div>
          <div className="px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="bg-[#383629] border-[#544f3b] animate-pulse">
                  <div className="h-48 bg-[#544f3b] rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-[#544f3b] rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#544f3b] rounded w-full mb-1"></div>
                    <div className="h-3 bg-[#544f3b] rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              Preferred Brands
            </h1>
            <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
              <p className="text-red-200">Failed to load preferred brands. Please try refreshing the page.</p>
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
            Preferred Brands
          </h1>
          <p className="text-sm text-[#bab59c]">
            Manage your preferred spirit and mixer brands. Build your collection with {visibleBrands?.length || 0} brands.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={term}
          onChange={setTerm}
          placeholder="Search preferred brands..."
        />

        {/* Action Buttons */}
        <div className="px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => setOcrOpen(true)}
              className="w-full sm:w-auto border-[#f2c40c] text-[#f2c40c] bg-transparent hover:bg-[#f2c40c] hover:text-[#161611] transition-colors font-medium border-2"
            >
              <Camera className="w-4 h-4 mr-2 flex-shrink-0" />
              Add via Photo
            </Button>
            <Link href="/add-preferred-brand" className="w-full sm:w-auto">
              <Button className="w-full bg-[#f2c40c] hover:bg-[#d9ad0b] text-black font-semibold px-6 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                Add Preferred Brand
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        {visibleBrands && (
          <div className="px-4 py-3 border-b border-[#544f3b] mb-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#bab59c]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Total: {visibleBrands.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#f2c40c]" />
                <span>In My Bar: {allBrands.filter((b: any) => b.inMyBar).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Used In: {allBrands.reduce((sum: number, b: PreferredBrand) => sum + (b.usedInRecipesCount || 0), 0)} recipes</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-6">
          {visibleBrands && visibleBrands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleBrands.map((brand: PreferredBrand) => (
                <Card key={brand.id} className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Image Section */}
                  <div
                    className="w-full h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: brand.imageUrl
                        ? `url(${brand.imageUrl})`
                        : `url(${noPhotoImage})`,
                    }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {brand.proof && (
                          <Badge className="bg-[#f2c40c] text-[#161611] font-bold">
                            {brand.proof}° Proof
                          </Badge>
                        )}
                        {brand.usedInRecipesCount > 0 && (
                          <div className="flex items-center gap-1 text-[#bab59b] text-sm">
                            <BarChart3 className="h-4 w-4" />
                            <span>{brand.usedInRecipesCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-white truncate [font-family:'Plus_Jakarta_Sans',Helvetica]" title={brand.name}>
                      {brand.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex-1">
                      {brand.usedInRecipesCount > 0 && (
                        <p className="text-[#bab59b] text-sm mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          Used in {brand.usedInRecipesCount} recipe{brand.usedInRecipesCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        onClick={() => handleToggleMyBar(brand)}
                        disabled={toggleMyBarMutation.isPending}
                        size="sm"
                        className={`flex-1 ${
                          (brand as any).inMyBar
                            ? "bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 border-0"
                            : "bg-transparent border border-[#544f3b] text-[#bab59c] hover:border-[#f2c40c] hover:text-[#f2c40c]"
                        }`}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${(brand as any).inMyBar ? 'fill-current' : ''}`} />
                        {(brand as any).inMyBar ? "In My Bar" : "Add to Bar"}
                      </Button>
                      <Link href={`/edit-preferred-brand/${brand.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-3 text-[#bab59b] hover:text-[#f2c40c] hover:bg-[#383629]"
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
            <EmptyState
              term={term}
              onClear={() => setTerm("")}
              message={term ? "Try adjusting your search terms." : "Add your first preferred brand to get started."}
            />
          )}
        </div>
      </div>
      <Navigation />
      
      {/* Photo OCR Dialog */}
      <BrandFromImageDialog
        open={ocrOpen}
        onOpenChange={setOcrOpen}
        onPrefill={(v) => {
          // Set draft brand for future form prefill integration
          setDraftBrand({ name: v.name, proof: v.proof ?? null });
          // Refresh brands list to show newly created brand if auto-created
          queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
        }}
      />
    </div>
  );
}