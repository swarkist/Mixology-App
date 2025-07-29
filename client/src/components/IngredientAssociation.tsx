import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Ingredient } from "@shared/schema";

interface IngredientAssociationProps {
  preferredBrandId: number;
  associatedIngredients: Ingredient[];
  onAssociationChange: () => void;
}

export default function IngredientAssociation({ 
  preferredBrandId, 
  associatedIngredients, 
  onAssociationChange 
}: IngredientAssociationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch all ingredients for selection
  const { data: allIngredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: () => fetch("/api/ingredients").then(res => res.json()),
  });

  // Filter ingredients based on search
  const filteredIngredients = allIngredients.filter((ingredient: Ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !associatedIngredients.some(assoc => assoc.id === ingredient.id)
  );

  // Create association mutation
  const associateMutation = useMutation({
    mutationFn: (ingredientId: number) =>
      apiRequest("POST", `/api/preferred-brands/${preferredBrandId}/ingredients/${ingredientId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands", preferredBrandId] });
      onAssociationChange();
    },
  });

  // Remove association mutation
  const removeMutation = useMutation({
    mutationFn: (ingredientId: number) =>
      apiRequest("DELETE", `/api/preferred-brands/${preferredBrandId}/ingredients/${ingredientId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands", preferredBrandId] });
      onAssociationChange();
    },
  });

  return (
    <Card className="bg-[#2a2920] border-[#4a4735]">
      <CardHeader>
        <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
          Associated Ingredients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently Associated Ingredients */}
        {associatedIngredients.length > 0 && (
          <div className="space-y-3">
            <Label className="text-white">Current Associations</Label>
            <div className="flex flex-wrap gap-2">
              {associatedIngredients.map((ingredient) => (
                <Badge
                  key={ingredient.id}
                  variant="secondary"
                  className="bg-[#383629] text-white border-[#544f3a] pr-1"
                >
                  {ingredient.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-red-600"
                    onClick={() => removeMutation.mutate(ingredient.id)}
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
          <Label className="text-white">Add Ingredient Association</Label>
          <Input
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
          />
          
          {searchQuery && filteredIngredients.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 border border-[#544f3a] rounded-md p-2 bg-[#26261c]">
              {filteredIngredients.slice(0, 8).map((ingredient: Ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#383629] cursor-pointer"
                  onClick={() => {
                    associateMutation.mutate(ingredient.id);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-white text-sm">{ingredient.name}</span>
                    <span className="text-[#bab59b] text-xs">
                      {ingredient.category}
                      {ingredient.subCategory && ` • ${ingredient.subCategory}`}
                    </span>
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

        {associatedIngredients.length === 0 && (
          <p className="text-[#bab59b] text-sm italic">
            No ingredients associated with this brand yet. Search above to add associations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}