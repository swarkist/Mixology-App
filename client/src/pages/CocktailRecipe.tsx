import { ArrowLeft, Clock, Users, Star, Heart, Share, Trash2, Edit } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatIngredientMeasurement } from "@/lib/fractionUtils";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const CocktailRecipe = (): JSX.Element => {
  const [match, params] = useRoute("/recipe/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const cocktailId = params?.id ? parseInt(params.id) : null;
  const isAdmin = user?.role === 'admin';

  // Fetch cocktail details
  const { data: cocktailDetails, isLoading, error } = useQuery({
    queryKey: ['/api/cocktails', cocktailId],
    queryFn: async () => {
      return await apiRequest(`/api/cocktails/${cocktailId}`);
    },
    enabled: !!cocktailId,
    retry: false, // Don't retry for 404s on deleted cocktails
  });

  // Delete cocktail mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/cocktails/${cocktailId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Recipe deleted",
        description: "The cocktail recipe has been removed successfully.",
      });
      // Invalidate all cocktail-related queries and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/cocktails'] });
      queryClient.removeQueries({ queryKey: ['/api/cocktails', cocktailId] });
      // Force refetch cocktail list to ensure deleted items are removed
      queryClient.refetchQueries({ queryKey: ['/api/cocktails'] });
      setLocation('/cocktails');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Increment popularity mutation
  const incrementPopularityMutation = useMutation({
    mutationFn: () => apiRequest(`/api/cocktails/${cocktailId}/increment-popularity`, { method: 'PATCH' }),
    onSuccess: () => {
      toast({
        title: "Started making cocktail!",
        description: "This recipe's popularity has been increased.",
      });
      // Invalidate queries to update popularity count
      queryClient.invalidateQueries({ queryKey: ['/api/cocktails', cocktailId] });
      queryClient.invalidateQueries({ queryKey: ['/api/cocktails'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update popularity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleStartMaking = () => {
    incrementPopularityMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161611] text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#383529] rounded w-1/4"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-[400px] bg-[#383529] rounded"></div>
              <div className="space-y-4">
                <div className="h-6 bg-[#383529] rounded w-1/2"></div>
                <div className="h-8 bg-[#383529] rounded w-3/4"></div>
                <div className="h-4 bg-[#383529] rounded w-full"></div>
                <div className="h-4 bg-[#383529] rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cocktailDetails) {
    return (
      <div className="min-h-screen bg-[#161611] text-white p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#383629] border-[#544f3b]">
            <CardContent className="p-8 text-center">
              <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Recipe not found or failed to load.
              </p>
              <Link href="/cocktails">
                <Button className="mt-4 bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                  Back to Recipes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { cocktail, ingredients, instructions } = cocktailDetails;

  return (
    <div className="min-h-screen bg-[#161611] text-white pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link href="/cocktails">
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div
            className="w-full h-[400px] rounded-lg bg-cover bg-center"
            style={{ 
              backgroundImage: cocktail.imageUrl 
                ? `url(${cocktail.imageUrl})` 
                : `url(${noPhotoImage})`
            }}
          />
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                {cocktail.name}
              </h1>
              <p className="text-[#bab59b] mt-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                {cocktail.description || "A delicious cocktail recipe."}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#bab59b]">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#f2c40c] text-[#f2c40c]" />
                <span>{cocktail.popularityCount || 0} crafted</span>
              </div>
            </div>

            <div className="p-4 bg-[#2a2920] rounded-lg">
              <h3 className="font-semibold text-white mb-2">Status</h3>
              <Badge variant="outline" className="border-[#4a4735] text-white">
                {cocktail.isFeatured ? 'Featured Recipe' : 'Standard Recipe'}
              </Badge>
            </div>
          </div>
        </div>            
        {/* Ingredients Section */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Ingredients
            </h2>
            <div className="grid gap-3">
              {ingredients && ingredients.length > 0 ? (
                ingredients.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-[#383528] rounded-lg">
                    <span className="text-white font-medium">{item.ingredient?.name || 'Unknown ingredient'}</span>
                    <span className="text-[#f2c40c] font-semibold">{formatIngredientMeasurement(item.amount, item.unit)}</span>
                  </div>
                ))
              ) : (
                <div className="text-[#bab59b] text-center p-4">
                  No ingredients listed for this recipe.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Instructions
            </h2>
            <div className="space-y-4">
              {instructions && instructions.length > 0 ? (
                instructions.map((step: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#f2c40c] text-[#161611] rounded-full flex items-center justify-center font-bold text-sm">
                      {step.stepNumber || index + 1}
                    </div>
                    <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica] pt-1">
                      {step.instruction}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-[#bab59b] text-center p-4">
                  No instructions provided for this recipe.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags Section */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Usage & Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {cocktailDetails.tags && cocktailDetails.tags.length > 0 ? (
                cocktailDetails.tags.map((tag: any, index: number) => (
                  <Badge key={index} variant="outline" className="border-[#f2c40c] text-[#f2c40c]">
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <div className="text-[#bab59b] text-center p-4 w-full">
                  No tags assigned to this recipe.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {/* Primary Action Button */}
          <Button 
            onClick={handleStartMaking}
            disabled={incrementPopularityMutation.isPending}
            className="w-full bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] font-bold h-12"
          >
            {incrementPopularityMutation.isPending ? 'Starting...' : 'Start Making This Cocktail'}
          </Button>
          
          {/* Admin-only Edit/Delete Buttons */}
          {isAdmin && (
            <div className="flex gap-3">
              <Link href={`/edit-cocktail/${cocktail.id}`} className="flex-1">
                <Button className="w-full bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-semibold h-10 text-sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Recipe
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10 hover:text-red-300 h-10 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Recipe'}
              </Button>
            </div>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};