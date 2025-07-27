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
  category: string;
  subCategory: string;
  description: string;
  preferredBrand: string;
  abv: number;
}

export const AddIngredient = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IngredientForm>();

  const spiritSubcategories = [
    "Tequila", "Whiskey", "Rum", "Vodka", "Gin", "Scotch", "Moonshine", "Brandy"
  ];

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
      abv: data.abv || 0,
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
                    onClick={() => setImagePreview(null)}
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