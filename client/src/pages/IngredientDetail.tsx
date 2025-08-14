import { ArrowLeft, Star, Edit, Trash2, Eye } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { RoleGate } from "@/components/RoleGate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

interface PreferredBrand {
  id: number;
  name: string;
  imageUrl?: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Cocktail {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

interface IngredientDetail {
  ingredient: {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
    category: string;
    subCategory?: string;
    usedInRecipesCount?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  tags: Tag[];
  preferredBrands: PreferredBrand[];
}

export const IngredientDetail = (): JSX.Element => {
  const { ingredientId } = useParams<{ ingredientId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: ingredientDetails, isLoading, error } = useQuery({
    queryKey: ['/api/ingredients', ingredientId],
    queryFn: async () => {
      return await apiRequest(`/api/ingredients/${ingredientId}`);
    },
    enabled: !!ingredientId,
    retry: false,
  });

  // Fetch cocktails that use this ingredient
  const { data: cocktailsWithIngredient } = useQuery({
    queryKey: ['/api/cocktails/with-ingredient', ingredientId],
    queryFn: async () => {
      const allCocktails = await apiRequest('/api/cocktails');
      const cocktailsWithDetails = await Promise.all(
        allCocktails.map(async (cocktail: any) => {
          const details = await apiRequest(`/api/cocktails/${cocktail.id}`);
          return { ...cocktail, details };
        })
      );
      
      // Filter cocktails that use this ingredient
      return cocktailsWithDetails.filter((cocktail: any) => 
        cocktail.details?.ingredients?.some((ing: any) => 
          ing.ingredientId === parseInt(ingredientId!)
        )
      );
    },
    enabled: !!ingredientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/ingredients/${ingredientId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'true' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ingredient deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      setLocation('/ingredients');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete ingredient",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this ingredient? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161611] flex items-center justify-center">
        <div className="text-white">Loading ingredient details...</div>
      </div>
    );
  }

  if (error || !ingredientDetails) {
    return (
      <div className="min-h-screen bg-[#161611] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Ingredient Not Found</h1>
          <p className="text-[#bab59b]">
            {error?.message || "The ingredient you're looking for doesn't exist or has been removed."}
          </p>
          <Link href="/ingredients">
            <Button className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ingredients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { ingredient, tags, preferredBrands } = ingredientDetails;

  return (
    <div className="min-h-screen bg-[#161611] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/95 backdrop-blur-sm border-b border-[#2a2a1f] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/ingredients">
            <Button variant="ghost" size="sm" className="text-[#bab59b] hover:text-white hover:bg-[#2a2920]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ingredients
            </Button>
          </Link>
          <RoleGate role="admin" onAuthCheck={setIsAdmin}>
            <div className="flex gap-2">
              <Link href={`/edit-ingredient/${ingredient.id}`}>
                <Button size="sm" className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </RoleGate>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Main Details */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div
            className="w-full h-[400px] rounded-lg bg-cover bg-center"
            style={{ 
              backgroundImage: ingredient.imageUrl 
                ? `url(${ingredient.imageUrl})` 
                : `url(${noPhotoImage})`
            }}
          />
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                {ingredient.name}
              </h1>
              <p className="text-[#bab59b] mt-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                {ingredient.description || "A quality ingredient for cocktail making."}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#bab59b]">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#f2c40c] text-[#f2c40c]" />
                <span>Used in {ingredient.usedInRecipesCount || 0} recipe{ingredient.usedInRecipesCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="p-4 bg-[#2a2920] rounded-lg space-y-3">
              <h3 className="font-semibold text-white mb-2">Category</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-[#4a4735] text-white capitalize">
                  {ingredient.category}
                </Badge>
                {ingredient.subCategory && (
                  <Badge variant="outline" className="border-[#4a4735] text-[#bab59b] capitalize">
                    {ingredient.subCategory}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferred Brands Section */}
        {preferredBrands && preferredBrands.length > 0 && (
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Preferred Brands
              </h2>
              <div className="grid gap-3">
                {preferredBrands.map((brand) => (
                  <div key={brand.id} className="flex justify-between items-center p-3 bg-[#383528] rounded-lg">
                    <div className="flex items-center gap-3">
                      {brand.imageUrl && (
                        <img 
                          src={brand.imageUrl} 
                          alt={brand.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="text-white font-medium">{brand.name}</span>
                    </div>

                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Tags Section */}
        {tags && tags.length > 0 && (
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="border-[#4a4735] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c] transition-colors"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cocktails Using This Ingredient Section */}
        {cocktailsWithIngredient && cocktailsWithIngredient.length > 0 && (
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Used in Cocktails ({cocktailsWithIngredient.length})
              </h2>
              <div className="grid gap-3">
                {cocktailsWithIngredient.map((cocktail: any) => (
                  <Link key={cocktail.id} href={`/cocktail/${cocktail.id}`}>
                    <div className="flex justify-between items-center p-3 bg-[#383528] rounded-lg hover:bg-[#4a4735] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        {cocktail.imageUrl ? (
                          <img 
                            src={cocktail.imageUrl} 
                            alt={cocktail.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#4a4735] flex items-center justify-center">
                            <Eye className="w-4 h-4 text-[#bab59b]" />
                          </div>
                        )}
                        <div>
                          <span className="text-white font-medium">{cocktail.name}</span>
                          {cocktail.description && (
                            <p className="text-[#bab59b] text-sm mt-1">{cocktail.description}</p>
                          )}
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-[#bab59b]" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin-only Delete Button */}
        {isAdmin && (
          <div className="space-y-3 pb-6">
            <Button 
              variant="outline" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-full border-red-600 text-red-400 hover:bg-red-600/10 hover:text-red-300 h-10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Ingredient'}
            </Button>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
};