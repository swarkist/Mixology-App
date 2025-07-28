import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star, Heart, Edit } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { PreferredBrand } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";

export default function PreferredBrands() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["/api/preferred-brands", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm);
      }
      const response = await apiRequest("GET", `/api/preferred-brands?${params}`);
      return response.json();
    },
  });

  const toggleMyBarMutation = useMutation({
    mutationFn: (brandId: number) => 
      apiRequest("PATCH", `/api/preferred-brands/${brandId}/toggle-mybar`),
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
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading preferred brands...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Preferred Brands
            </h1>
            <p className="text-muted-foreground">
              Manage your preferred spirit and mixer brands
            </p>
          </div>
          <Link href="/add-preferred-brand">
            <Button className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Preferred Brand
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search preferred brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Brands Grid */}
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchTerm ? "No brands found matching your search." : "No preferred brands added yet."}
            </div>
            <Link href="/add-preferred-brand">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Preferred Brand
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand: PreferredBrand) => (
              <Card key={brand.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {brand.name}
                      </CardTitle>
                      {brand.proof && (
                        <Badge variant="secondary" className="mt-2">
                          {brand.proof} Proof
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  {/* Brand Image */}
                  {brand.imageUrl && (
                    <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                      <img
                        src={brand.imageUrl}
                        alt={brand.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant={brand.inMyBar ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleMyBar(brand)}
                      disabled={toggleMyBarMutation.isPending}
                      className="flex-1 mr-2"
                    >
                      <Heart 
                        className={`w-4 h-4 mr-2 ${brand.inMyBar ? 'fill-current' : ''}`} 
                      />
                      {brand.inMyBar ? "In My Bar" : "Add to Bar"}
                    </Button>

                    <Link href={`/edit-preferred-brand/${brand.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Usage Stats */}
                  {brand.usedInRecipesCount > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                      Used in {brand.usedInRecipesCount} recipe{brand.usedInRecipesCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}