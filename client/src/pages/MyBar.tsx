import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Heart, Edit, Edit2, BarChart3, Check, Plus } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { PreferredBrand } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export default function MyBar() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  const isLoggedIn = !!user;

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

  const { data: myBarItems = [], isLoading, error } = useQuery({
    queryKey: ["/api/preferred-brands", searchTerm, { inMyBar: true }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
          params.append("search", searchTerm);
        }
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
  });

  const toggleMyBarMutation = useMutation({
    mutationFn: async (brandId: number) => {
      return apiRequest(`/api/preferred-brands/${brandId}/toggle-mybar`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
    },
  });

  const handleToggleMyBar = async (brand: PreferredBrand) => {
    try {
      await toggleMyBarMutation.mutateAsync(brand.id);
    } catch (error) {
      console.error("Error toggling My Bar:", error);
    }
  };

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
        <div className="px-4 py-3">
          <div className="h-12">
            <div className="flex h-full rounded-lg bg-[#383629] overflow-hidden">
              <div className="pl-4 flex items-center">
                <Search className="h-5 w-5 text-[#bab59c]" />
              </div>
              <Input
                type="text"
                placeholder="Search my bar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent h-full text-white placeholder:text-[#bab59c] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica] pl-2 pr-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-3 py-3 space-y-3">
          <div className="flex gap-2 flex-wrap justify-between">
            <div className="flex gap-2">
              <Badge className="bg-[#f2c40c] text-[#161611] font-bold hover:bg-[#e6b00a] hover:text-[#161611]">
                My Collection
              </Badge>
            </div>
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
              <span>Total Items: {myBarItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#f2c40c]" />
              <span>Available for mixing</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {myBarItems && myBarItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBarItems.map((item: PreferredBrand) => (
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
                      <Badge className="bg-[#f2c40c] text-[#161611] font-bold hover:bg-[#e6b00a] hover:text-[#161611]">
                        Spirit
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
          ) : (
            <Card className="bg-[#383629] border-[#544f3b]">
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-[#544f3b] mx-auto mb-4" />
                <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica] mb-4">
                  Your bar is empty. Start building your collection by adding your favorite spirits and ingredients.
                </p>
                <Link href="/preferred-brands">
                  <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                    <Plus className="h-3 w-3 mr-2" />
                    Add Your First Item
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
}