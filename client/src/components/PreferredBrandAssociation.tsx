import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PreferredBrand } from "@shared/schema";

interface PreferredBrandAssociationProps {
  ingredientId: number;
  associatedBrands: PreferredBrand[];
  onAssociationChange: () => void;
}

export default function PreferredBrandAssociation({ 
  ingredientId, 
  associatedBrands, 
  onAssociationChange 
}: PreferredBrandAssociationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch all preferred brands for selection
  const { data: allBrands = [] } = useQuery({
    queryKey: ["/api/preferred-brands"],
    queryFn: () => fetch("/api/preferred-brands").then(res => res.json()),
  });

  // Filter brands based on search
  const filteredBrands = allBrands.filter((brand: PreferredBrand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !associatedBrands.some(assoc => assoc.id === brand.id)
  );

  // Create association mutation
  const associateMutation = useMutation({
    mutationFn: (brandId: number) =>
      apiRequest(`/api/preferred-brands/${brandId}/ingredients/${ingredientId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients", ingredientId] });
      onAssociationChange();
    },
  });

  // Remove association mutation
  const removeMutation = useMutation({
    mutationFn: (brandId: number) =>
      apiRequest(`/api/preferred-brands/${brandId}/ingredients/${ingredientId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients", ingredientId] });
      onAssociationChange();
    },
  });

  return (
    <Card className="bg-[#2a2920] border-[#4a4735]">
      <CardHeader>
        <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
          Associated Preferred Brands
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently Associated Brands */}
        {associatedBrands.length > 0 && (
          <div className="space-y-3">
            <Label className="text-white">Current Associations</Label>
            <div className="flex flex-wrap gap-2">
              {associatedBrands.map((brand) => (
                <Badge
                  key={brand.id}
                  variant="secondary"
                  className="bg-[#383629] text-white border-[#544f3a] pr-1"
                >
                  {brand.name}
                  {brand.proof && (
                    <span className="ml-1 text-[#bab59b]">({brand.proof} proof)</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-red-600"
                    onClick={() => removeMutation.mutate(brand.id)}
                    disabled={removeMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add New Association */}
        <div className="space-y-3">
          <Label className="text-white">Add Preferred Brand Association</Label>
          <Input
            placeholder="Search preferred brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
          />
          
          {searchQuery && filteredBrands.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 border border-[#544f3a] rounded-md p-2 bg-[#26261c]">
              {filteredBrands.slice(0, 8).map((brand: PreferredBrand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#383629] cursor-pointer"
                  onClick={() => {
                    associateMutation.mutate(brand.id);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-white text-sm">{brand.name}</span>
                    {brand.proof && (
                      <span className="text-[#bab59b] text-xs">{brand.proof} proof</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-[#f2c40c] hover:text-[#f2c40c] hover:bg-[#544f3a]"
                    disabled={associateMutation.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {associatedBrands.length === 0 && (
          <p className="text-[#bab59b] text-sm italic">
            No preferred brands associated with this ingredient yet. Search above to add associations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}