import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import noPhotoImage from "@assets/no-photo_1753579606993.png";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import type { Tag } from "@shared/schema";

interface IngredientForm {
  name: string;
  category: string;
  subCategory: string;
  description: string;
  preferredBrand: string;
  abv: number;
}

export const AddIngredient = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IngredientForm>();

  const spiritSubcategories = [
    "Tequila", "Whiskey", "Rum", "Vodka", "Gin", "Scotch", "Moonshine", "Brandy"
  ];

  // Fetch ingredient-specific suggested tags
  const { data: mostUsedTags } = useQuery<Tag[]>({
    queryKey: ['/api/tags/ingredients/most-used'],
  });

  const { data: mostRecentTags } = useQuery<Tag[]>({
    queryKey: ['/api/tags/ingredients/most-recent'],
  });

  // Combine and deduplicate suggested tags
  useEffect(() => {
    const allSuggested = [
      ...(mostUsedTags || []),
      ...(mostRecentTags || [])
    ];
    
    // Remove duplicates and tags already selected
    const uniqueSuggested = allSuggested
      .filter((tag, index, self) => 
        self.findIndex(t => t.name === tag.name) === index
      )
      .filter(tag => !tags.includes(tag.name))
      .slice(0, 10); // Limit to 10 suggestions
    
    setSuggestedTags(uniqueSuggested);
  }, [mostUsedTags, mostRecentTags, tags]);

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

  const onSubmit = async (data: IngredientForm) => {
    try {
      const ingredientData = {
        ...data,
        abv: data.abv || 0,
        image: imagePreview,
        tags: tags
      };
      
      console.log("Creating ingredient:", ingredientData);
      
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientData),
      });

      if (response.ok) {
        console.log("Ingredient created successfully");
        // Invalidate ingredients cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
        setLocation('/ingredients');
      } else {
        const error = await response.json();
        console.error('Failed to create ingredient:', error);
      }
    } catch (error) {
      console.error('Error creating ingredient:', error);
    }
  };

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
              Add New Ingredient
            </h1>
          </div>
          <Button 
            form="ingredient-form"
            type="submit"
            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
          >
            Save Ingredient
          </Button>
        </div>
      </div>

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
                  <Select onValueChange={(value) => {
                    setValue("category", value);
                    setSelectedCategory(value);
                    if (value !== "spirits") {
                      setValue("subCategory", "");
                    }
                  }}>
                    <SelectTrigger className="w-full h-10 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#383629] border-[#544f3b]">
                      <SelectItem value="spirits" className="text-white">Spirits</SelectItem>
                      <SelectItem value="mixers" className="text-white">Mixers</SelectItem>
                      <SelectItem value="juices" className="text-white">Juices</SelectItem>
                      <SelectItem value="syrups" className="text-white">Syrups</SelectItem>
                      <SelectItem value="bitters" className="text-white">Bitters</SelectItem>
                      <SelectItem value="garnishes" className="text-white">Garnishes</SelectItem>
                      <SelectItem value="other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCategory === "spirits" && (
                <div>
                  <Label htmlFor="subCategory" className="text-white">Sub-Category *</Label>
                  <Select onValueChange={(value) => setValue("subCategory", value)}>
                    <SelectTrigger className="w-full h-10 gap-2 pl-4 pr-2 rounded-lg bg-[#383629] border-0 text-sm font-medium text-white">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#383629] border-[#544f3b]">
                      {spiritSubcategories.map((subcategory) => (
                        <SelectItem 
                          key={subcategory.toLowerCase()} 
                          value={subcategory.toLowerCase()}
                          className="text-white capitalize"
                        >
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe the ingredient, its characteristics, and flavor profile..."
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredBrand" className="text-white">Preferred Brand</Label>
                  <Input
                    id="preferredBrand"
                    {...register("preferredBrand")}
                    placeholder="e.g., Grey Goose, Tito's"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
                <div>
                  <Label htmlFor="abv" className="text-white">ABV (%)</Label>
                  <Input
                    id="abv"
                    {...register("abv", { valueAsNumber: true })}
                    placeholder="e.g., 40"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
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
                <div className="relative">
                  <img
                    src={imagePreview || noPhotoImage}
                    alt={imagePreview ? "Ingredient preview" : "No photo placeholder"}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  {imagePreview && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={() => setImagePreview(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
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

          {/* Submit Button */}
          <div className="flex gap-3 pb-6">
            <Button
              type="submit"
              form="ingredient-form"
              className="flex-1 bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] font-bold"
            >
              Add Ingredient
            </Button>
            <Link href="/ingredients">
              <Button
                variant="outline"
                className="border-[#544f3a] text-white hover:bg-[#2a2920]"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};