import { ArrowLeft, Plus, Minus, Upload, X, Search } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import type { Ingredient as DBIngredient, Tag } from "@shared/schema";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface CocktailForm {
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
}

export const AddCocktail = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/edit-cocktail/:id");
  const queryClient = useQueryClient();
  
  // Determine if we're in edit mode
  const isEditMode = !!match && !!params?.id;
  const cocktailId = params?.id ? parseInt(params.id) : null;
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "oz" }
  ]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientSearchQueries, setIngredientSearchQueries] = useState<string[]>([""]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(-1);
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CocktailForm>();

  // Fetch cocktail data for editing
  const { data: cocktailData, isLoading: isLoadingCocktail } = useQuery({
    queryKey: ['/api/cocktails', cocktailId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cocktails/${cocktailId}`);
      return response.json();
    },
    enabled: isEditMode && !!cocktailId,
  });

  // Search ingredients query with proper query string
  const { data: searchResults = [], isLoading: isSearching } = useQuery<DBIngredient[]>({
    queryKey: [`/api/ingredients?search=${encodeURIComponent(ingredientSearchQueries[activeSearchIndex] || '')}`],
    enabled: activeSearchIndex >= 0 && ingredientSearchQueries[activeSearchIndex]?.length > 0,
  });

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveSearchIndex(-1);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch suggested tags on component mount
  useEffect(() => {
    const fetchSuggestedTags = async () => {
      try {
        const [mostUsedResponse, mostRecentResponse] = await Promise.all([
          fetch('/api/tags/most-used?limit=5'),
          fetch('/api/tags/most-recent?limit=5')
        ]);
        
        const mostUsed = await mostUsedResponse.json();
        const mostRecent = await mostRecentResponse.json();
        
        // Combine and deduplicate tags, prioritizing most used
        const combined = [...mostUsed];
        mostRecent.forEach((tag: Tag) => {
          if (!combined.find(t => t.id === tag.id)) {
            combined.push(tag);
          }
        });
        
        // Limit to 10 total tags
        setSuggestedTags(combined.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch suggested tags:', error);
        setSuggestedTags([]);
      }
    };

    fetchSuggestedTags();
  }, []);

  // Populate form fields when editing
  useEffect(() => {
    if (isEditMode && cocktailData) {
      const { cocktail, ingredients: cocktailIngredients, instructions: cocktailInstructions } = cocktailData;
      
      // Set form values
      setValue("name", cocktail.name);
      setValue("description", cocktail.description || "");
      
      // Set image preview
      if (cocktail.imageUrl) {
        setImagePreview(cocktail.imageUrl);
      }
      
      // Set ingredients
      if (cocktailIngredients && cocktailIngredients.length > 0) {
        const formattedIngredients = cocktailIngredients.map((ing: any) => ({
          name: ing.ingredient.name,
          amount: ing.amount,
          unit: ing.unit
        }));
        setIngredients(formattedIngredients);
        setIngredientSearchQueries(new Array(formattedIngredients.length).fill(""));
      }
      
      // Set instructions
      if (cocktailInstructions && cocktailInstructions.length > 0) {
        const instructionTexts = cocktailInstructions.map((inst: any) => inst.instruction);
        setInstructions(instructionTexts);
      }
      
      // Set tags (if available in the data)
      // Note: Tags may need to be implemented in the API response
    }
  }, [isEditMode, cocktailData, setValue]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "", unit: "oz" }]);
    setIngredientSearchQueries([...ingredientSearchQueries, ""]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
      setIngredientSearchQueries(ingredientSearchQueries.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const updateIngredientSearch = (index: number, query: string) => {
    const updated = [...ingredientSearchQueries];
    updated[index] = query;
    setIngredientSearchQueries(updated);
    setActiveSearchIndex(index);
  };

  const selectIngredient = (index: number, ingredientName: string) => {
    updateIngredient(index, "name", ingredientName);
    updateIngredientSearch(index, "");
    setActiveSearchIndex(-1);
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const addSuggestedTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      setTags([...tags, tagName]);
      // Remove from suggestions to avoid duplicates
      setSuggestedTags(suggestedTags.filter(tag => tag.name !== tagName));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    
    // Add back to suggestions if it was originally there
    const originalTag = suggestedTags.find(tag => tag.name === tagToRemove);
    if (originalTag && !suggestedTags.some(tag => tag.name === tagToRemove)) {
      setSuggestedTags([...suggestedTags, originalTag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create/Update cocktail mutation
  const saveCocktailMutation = useMutation({
    mutationFn: async (cocktailData: any) => {
      if (isEditMode && cocktailId) {
        return apiRequest("PATCH", `/api/cocktails/${cocktailId}`, cocktailData);
      } else {
        return apiRequest("POST", "/api/cocktails", cocktailData);
      }
    },
    onSuccess: () => {
      // Invalidate all cocktail queries regardless of parameters
      queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
      queryClient.refetchQueries({ queryKey: ["/api/cocktails"] });
      
      if (isEditMode && cocktailId) {
        setLocation(`/recipe/${cocktailId}`);
      } else {
        setLocation("/cocktails");
      }
    },
    onError: (error) => {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} cocktail:`, error);
    }
  });

  const onSubmit = (data: CocktailForm) => {
    const cocktailData = {
      name: data.name,
      description: data.description || "",
      ingredients: ingredients.filter(ing => ing.name && ing.amount).map(ing => ({
        name: ing.name,
        amount: parseFloat(ing.amount) || 0,
        unit: ing.unit
      })),
      instructions: instructions.filter(inst => inst.trim()),
      tags,
      image: imagePreview,
      featured: false,
      popularityCount: 0
    };
    
    console.log(`${isEditMode ? 'Updating' : 'Creating'} cocktail:`, cocktailData);
    saveCocktailMutation.mutate(cocktailData);
  };

  return (
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/cocktails">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica]">
              {isEditMode ? 'Edit Cocktail' : 'Add New Cocktail'}
            </h1>
          </div>
          <Button 
            form="cocktail-form"
            type="submit"
            disabled={saveCocktailMutation.isPending}
            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] disabled:opacity-50"
          >
            {saveCocktailMutation.isPending ? "Saving..." : (isEditMode ? "Update Cocktail" : "Save Cocktail")}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <form id="cocktail-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Cocktail Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  placeholder="e.g., Classic Mojito"
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                />
                {errors.name && <span className="text-red-400 text-sm">{errors.name.message}</span>}
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="A brief description or story behind the cocktail..."
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Cocktail Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="image" className="text-white">Upload Image</Label>
                  <div className="mt-2">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#544f3a] text-white hover:bg-[#2a2920]"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                </div>
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={() => setImagePreview(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Ingredients
                </CardTitle>
                <Button
                  type="button"
                  onClick={addIngredient}
                  size="sm"
                  className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Label className="text-white">Ingredient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bab59b]" />
                      <Input
                        value={ingredient.name || ingredientSearchQueries[index] || ""}
                        onChange={(e) => {
                          if (ingredient.name) {
                            updateIngredient(index, "name", e.target.value);
                          } else {
                            updateIngredientSearch(index, e.target.value);
                          }
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setActiveSearchIndex(index);
                        }}
                        onBlur={() => {
                          // Delay closing to allow selection
                          setTimeout(() => setActiveSearchIndex(-1), 150);
                        }}
                        placeholder="Search ingredients..."
                        className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c] pl-10"
                      />
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {activeSearchIndex === index && ingredientSearchQueries[index] && searchResults.length > 0 && (
                      <div 
                        className="absolute z-10 w-full mt-1 bg-[#26261c] border border-[#544f3a] rounded-md shadow-lg max-h-48 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => selectIngredient(index, result.name)}
                            className="w-full text-left px-4 py-2 hover:bg-[#383529] text-white text-sm border-b border-[#544f3a] last:border-b-0"
                          >
                            <div className="font-medium">{result.name}</div>
                            <div className="text-xs text-[#bab59b]">
                              {result.category}
                              {result.subCategory && ` • ${result.subCategory}`}
                              {result.preferredBrand && ` • ${result.preferredBrand}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-24">
                    <Label className="text-white">Amount</Label>
                    <Input
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                      placeholder="2"
                      className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-white">Unit</Label>
                    <Select value={ingredient.unit} onValueChange={(value) => updateIngredient(index, "unit", value)}>
                      <SelectTrigger className="bg-[#26261c] border-[#544f3a] text-white focus:ring-[#f2c40c] focus:border-[#f2c40c]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#26261c] border-[#544f3a]">
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="dashes">dashes</SelectItem>
                        <SelectItem value="drops">drops</SelectItem>
                        <SelectItem value="parts">parts</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="cups">cups</SelectItem>
                        <SelectItem value="shots">shots</SelectItem>
                        <SelectItem value="splash">splash</SelectItem>
                        <SelectItem value="pinch">pinch</SelectItem>
                        <SelectItem value="whole">whole</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="border-[#544f3a] text-white hover:bg-[#2a2920]"
                    disabled={ingredients.length === 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Instructions
                </CardTitle>
                <Button
                  type="button"
                  onClick={addInstruction}
                  size="sm"
                  className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#f2c40c] text-[#161611] rounded-full flex items-center justify-center font-semibold text-sm mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Step ${index + 1} instructions...`}
                      className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeInstruction(index)}
                    className="border-[#544f3a] text-white hover:bg-[#2a2920] mt-1"
                    disabled={instructions.length === 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Uses & Tags */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Uses & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tags */}
              <div>
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2 mt-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
                  >
                    Add
                  </Button>
                </div>

                {/* Tag Suggestions */}
                {suggestedTags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-[#bab59b] mb-2">Quick suggestions:</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((suggestedTag) => (
                        <Badge
                          key={suggestedTag.id}
                          className="bg-[#383529] text-white hover:bg-[#f2c40c] hover:text-[#161611] cursor-pointer border border-[#544f3a]"
                          onClick={() => addSuggestedTag(suggestedTag.name)}
                        >
                          {suggestedTag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};