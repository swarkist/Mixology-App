import { ArrowLeft, Upload, X } from "lucide-react";
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

interface IngredientForm {
  name: string;
  description: string;
  category: string;
  type: string;
  origin: string;
  alcoholContent: string;
  flavor: string;
  tags: string[];
  commonUse: string;
  storageInstructions: string;
  substitutes: string;
}

export const AddIngredient = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IngredientForm>();

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

  const onSubmit = (data: IngredientForm) => {
    const ingredientData = {
      ...data,
      tags,
      image: imagePreview
    };
    
    console.log("New ingredient:", ingredientData);
    // Here you would typically send the data to your backend
    
    // Navigate back to ingredients list
    setLocation("/ingredients");
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
                  <Select onValueChange={(value) => setValue("category", value)}>
                    <SelectTrigger className="bg-[#26261c] border-[#544f3a] text-white focus:ring-[#f2c40c] focus:border-[#f2c40c]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#26261c] border-[#544f3a]">
                      <SelectItem value="spirits">Spirits</SelectItem>
                      <SelectItem value="mixers">Mixers</SelectItem>
                      <SelectItem value="juices">Juices</SelectItem>
                      <SelectItem value="garnishes">Garnishes</SelectItem>
                      <SelectItem value="syrups">Syrups</SelectItem>
                      <SelectItem value="bitters">Bitters</SelectItem>
                      <SelectItem value="liqueurs">Liqueurs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type" className="text-white">Type</Label>
                  <Select onValueChange={(value) => setValue("type", value)}>
                    <SelectTrigger className="bg-[#26261c] border-[#544f3a] text-white focus:ring-[#f2c40c] focus:border-[#f2c40c]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#26261c] border-[#544f3a]">
                      <SelectItem value="alcoholic">Alcoholic</SelectItem>
                      <SelectItem value="non-alcoholic">Non-Alcoholic</SelectItem>
                      <SelectItem value="fresh">Fresh</SelectItem>
                      <SelectItem value="preserved">Preserved</SelectItem>
                      <SelectItem value="dried">Dried</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="origin" className="text-white">Origin/Brand</Label>
                  <Input
                    id="origin"
                    {...register("origin")}
                    placeholder="e.g., France, Tito's"
                    className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  />
                </div>
                <div>
                  <Label htmlFor="alcoholContent" className="text-white">Alcohol Content (%)</Label>
                  <Input
                    id="alcoholContent"
                    {...register("alcoholContent")}
                    placeholder="e.g., 40"
                    type="number"
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

          {/* Flavor Profile */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Flavor Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="flavor" className="text-white">Flavor Characteristics</Label>
                <Select onValueChange={(value) => setValue("flavor", value)}>
                  <SelectTrigger className="bg-[#26261c] border-[#544f3a] text-white focus:ring-[#f2c40c] focus:border-[#f2c40c]">
                    <SelectValue placeholder="Select primary flavor" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#26261c] border-[#544f3a]">
                    <SelectItem value="sweet">Sweet</SelectItem>
                    <SelectItem value="sour">Sour</SelectItem>
                    <SelectItem value="bitter">Bitter</SelectItem>
                    <SelectItem value="salty">Salty</SelectItem>
                    <SelectItem value="spicy">Spicy</SelectItem>
                    <SelectItem value="herbal">Herbal</SelectItem>
                    <SelectItem value="fruity">Fruity</SelectItem>
                    <SelectItem value="floral">Floral</SelectItem>
                    <SelectItem value="citrus">Citrus</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commonUse" className="text-white">Common Use in Cocktails</Label>
                <Textarea
                  id="commonUse"
                  {...register("commonUse")}
                  placeholder="Describe how this ingredient is typically used in cocktails..."
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="substitutes" className="text-white">Possible Substitutes</Label>
                <Input
                  id="substitutes"
                  {...register("substitutes")}
                  placeholder="e.g., Can be substituted with lime juice, lemon juice"
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage & Usage */}
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Storage & Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storageInstructions" className="text-white">Storage Instructions</Label>
                <Textarea
                  id="storageInstructions"
                  {...register("storageInstructions")}
                  placeholder="How should this ingredient be stored? Temperature, light conditions, shelf life, etc."
                  className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                  rows={3}
                />
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