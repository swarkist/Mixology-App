import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Upload, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { Ingredient } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/schema";

interface IngredientForm {
  name: string;
  description: string;
  category: string;
  subCategory: string;
  preferredBrand: string;
  abv: number;
}

export const EditIngredient = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch ingredient data
  const { data: ingredient, isLoading } = useQuery<Ingredient>({
    queryKey: [`/api/ingredients/${id}`],
    enabled: !!id,
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<IngredientForm>();

  // Populate form when ingredient data loads
  useEffect(() => {
    if (ingredient) {
      reset({
        name: ingredient.name,
        description: ingredient.description || "",
        category: ingredient.category,
        subCategory: ingredient.subCategory || "",
        preferredBrand: ingredient.preferredBrand || "",
        abv: ingredient.abv || 0,
      });
      setImagePreview(ingredient.imageUrl);
    }
  }, [ingredient, reset]);

  // Update ingredient mutation
  const updateMutation = useMutation({
    mutationFn: async (data: IngredientForm & { image?: string }) => {
      return apiRequest("PATCH", `/api/ingredients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/ingredients/${id}`] });
      setLocation("/ingredients");
    },
  });

  // Delete ingredient mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/ingredients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setLocation("/ingredients");
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('EditIngredient: File selected:', file.name, file.size);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('EditIngredient: Image loaded, preview set');
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const onSubmit = (data: IngredientForm) => {
    const ingredientData = {
      ...data,
      abv: data.abv || 0,
      image: imagePreview || undefined
    };
    
    console.log('EditIngredient onSubmit:', ingredientData);
    updateMutation.mutate(ingredientData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this ingredient? This action cannot be undone and will remove the ingredient from all cocktail recipes.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161611] text-white flex items-center justify-center">
        <div className="text-[#bab59b]">Loading ingredient...</div>
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="min-h-screen bg-[#161611] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#bab59b] mb-4">Ingredient not found</div>
          <Link href="/ingredients">
            <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]">
              Back to Ingredients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/ingredients">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Edit Ingredient
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="outline"
              className="bg-transparent border-red-600 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Link href="/ingredients">
              <Button 
                variant="outline"
                className="bg-transparent border-[#544f3b] text-[#bab59b] hover:border-[#f2c40c] hover:text-[#f2c40c] hover:bg-[#383629]"
              >
                Cancel
              </Button>
            </Link>
            <Button 
              form="ingredient-form"
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <form id="ingredient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Ingredient Name *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Name is required" })}
                    placeholder="e.g., Premium Vodka"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                  {errors.name && <span className="text-red-400 text-sm">{errors.name.message}</span>}
                </div>
                <div>
                  <Label htmlFor="category" className="text-white">Category *</Label>
                  <Select onValueChange={(value) => setValue("category", value)} defaultValue={ingredient.category}>
                    <SelectTrigger className="bg-[#26261c] border-[#544f3a] text-white focus:ring-[#f2c40c] focus:border-[#f2c40c]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2920] border-[#544f3a]">
                      {INGREDIENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="text-white focus:bg-[#383629] focus:text-white">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subCategory" className="text-white">Sub-Category</Label>
                  <Input
                    id="subCategory"
                    {...register("subCategory")}
                    placeholder="e.g., vodka, bourbon"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
                <div>
                  <Label htmlFor="preferredBrand" className="text-white">Preferred Brand</Label>
                  <Input
                    id="preferredBrand"
                    {...register("preferredBrand")}
                    placeholder="e.g., Grey Goose, Jack Daniel's"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="abv" className="text-white">ABV %</Label>
                  <Input
                    id="abv"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register("abv", { valueAsNumber: true })}
                    placeholder="e.g., 40"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe this ingredient..."
                  rows={3}
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Ingredient Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Ingredient preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#544f3a] rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-[#544f3a] mx-auto mb-4" />
                  <p className="text-[#bab59b] mb-4">Upload an ingredient image</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" className="bg-[#26261c] border-[#544f3a] text-white hover:bg-[#383629]">
                      Choose Image
                    </Button>
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};