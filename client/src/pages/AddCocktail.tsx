import { ArrowLeft, Plus, Minus, Upload, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "oz" }
  ]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CocktailForm>();

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "", unit: "oz" }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
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

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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

  const onSubmit = (data: CocktailForm) => {
    const cocktailData = {
      ...data,
      ingredients: ingredients.filter(ing => ing.name && ing.amount),
      instructions: instructions.filter(inst => inst.trim()),
      tags,
      image: imagePreview
    };
    
    console.log("New cocktail:", cocktailData);
    // Here you would typically send the data to your backend
    
    // Navigate back to cocktails list
    setLocation("/cocktails");
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
              Add New Cocktail
            </h1>
          </div>
          <Button 
            form="cocktail-form"
            type="submit"
            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
          >
            Save Cocktail
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
                  <div className="flex-1">
                    <Label className="text-white">Ingredient</Label>
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder="e.g., White Rum"
                      className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                    />
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
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="dash">dash</SelectItem>
                        <SelectItem value="splash">splash</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
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

          {/* Additional Details */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="glassType" className="text-white">Glass Type</Label>
                  <Select onValueChange={(value) => setValue("glassType", value)}>
                    <SelectTrigger className="bg-[#26261c] border-[#544f3a] text-white focus:ring-[#f2c40c] focus:border-[#f2c40c]">
                      <SelectValue placeholder="Select glass type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#26261c] border-[#544f3a]">
                      <SelectItem value="highball">Highball Glass</SelectItem>
                      <SelectItem value="rocks">Rocks Glass</SelectItem>
                      <SelectItem value="martini">Martini Glass</SelectItem>
                      <SelectItem value="coupe">Coupe Glass</SelectItem>
                      <SelectItem value="hurricane">Hurricane Glass</SelectItem>
                      <SelectItem value="collins">Collins Glass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="garnish" className="text-white">Garnish</Label>
                  <Input
                    id="garnish"
                    {...register("garnish")}
                    placeholder="e.g., Lime wedge, mint sprig"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2 mt-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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