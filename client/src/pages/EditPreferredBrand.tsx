// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { apiRequest } from "@/lib/queryClient";
import { preferredBrandFormSchema, type PreferredBrandForm } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import IngredientAssociation from "@/components/IngredientAssociation";
import { ReviewBanner } from "@/components/ReviewBanner";
import { useAuth } from "@/hooks/useAuth";

export default function EditPreferredBrand() {
  const [, params] = useRoute("/edit-preferred-brand/:id");
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const brandId = parseInt(params?.id || "0");

  const { data: brandDetails, isLoading } = useQuery({
    queryKey: ["/api/preferred-brands", brandId],
    queryFn: () => fetch(`/api/preferred-brands/${brandId}`).then(res => res.json()),
    enabled: !!brandId,
  });

  const form = useForm<PreferredBrandForm>({
    resolver: zodResolver(preferredBrandFormSchema),
    defaultValues: {
      name: "",
      proof: undefined,
      imageUrl: "",
      inMyBar: false,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (brandDetails?.brand) {
      const brand = brandDetails.brand;
      form.reset({
        name: brand.name,
        proof: brand.proof || undefined,
        imageUrl: brand.imageUrl || "",
        inMyBar: brand.inMyBar,
      });
      setImagePreview(brand.imageUrl || null);
    }
  }, [brandDetails, form]);

  const updateMutation = useMutation({
    mutationFn: (data: PreferredBrandForm) => 
      apiRequest(`/api/preferred-brands/${brandId}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
      setLocation("/preferred-brands");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/preferred-brands/${brandId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
      setLocation("/preferred-brands");
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { compressImage } = await import('@/lib/imageCompression');
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        form.setValue("imageUrl", compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original image if compression fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreview(result);
          form.setValue("imageUrl", result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const onSubmit = async (data: PreferredBrandForm) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error updating preferred brand:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this preferred brand? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error("Error deleting preferred brand:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161611] text-white flex items-center justify-center">
        <div className="text-[#bab59b]">Loading preferred brand...</div>
      </div>
    );
  }

  if (!brandDetails) {
    return (
      <div className="min-h-screen bg-[#161611] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#bab59b] mb-4">Preferred brand not found</div>
          <Link href="/preferred-brands">
            <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]">
              Back to Preferred Brands
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161611] text-white pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between px-4 md:px-40 py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Link href="/preferred-brands">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920] h-10 px-3">
                <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 className="text-lg md:text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica] truncate">
              Edit Preferred Brand
            </h1>
          </div>
          <Button 
            form="preferred-brand-form"
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] h-10 px-4 text-sm md:text-base flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </span>
            <span className="sm:hidden">
              {updateMutation.isPending ? "Saving..." : "Save"}
            </span>
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 md:px-40 py-4 space-y-6">
        <ReviewBanner />
        <Form {...form}>
          <form id="preferred-brand-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-[#2a2920] border-[#4a4735]">
              <CardHeader>
                <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Brand Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Brand Name *</Label>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              id="name"
                              placeholder="e.g., Grey Goose, Jack Daniel's, Cointreau"
                              className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proof" className="text-white">Proof</Label>
                    <FormField
                      control={form.control}
                      name="proof"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              id="proof"
                              type="number"
                              placeholder="80"
                              step="1"
                              className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card className="bg-[#2a2920] border-[#4a4735]">
              <CardHeader>
                <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Brand Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Brand preview"
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
                    <p className="text-[#bab59b] mb-4">Upload a brand image</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <Label 
                      htmlFor="image-upload-edit" 
                      className="cursor-pointer inline-block"
                    >
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-[#383529] border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] font-medium"
                        onClick={() => {
                          document.getElementById('image-upload-edit')?.click();
                        }}
                      >
                        Choose Image
                      </Button>
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>
          {/* Mobile Action Buttons */}
          <div className="space-y-3 pb-6">
            {/* Primary Action Button */}
            <Button 
              form="preferred-brand-form"
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] font-bold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            
            {/* Secondary Action Buttons */}
            <div className="flex gap-3">
              <Link href="/preferred-brands" className="flex-1">
                <Button 
                  variant="outline"
                  className="w-full border-[#544f3b] text-[#bab59b] hover:bg-[#2a2920] h-10 text-sm"
                >
                  Cancel
                </Button>
              </Link>
              <Button 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                variant="outline"
                className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10 hover:text-red-300 h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </form>
        </Form>

        {/* Ingredient Associations */}
        {brandDetails?.brand && (
          <IngredientAssociation
            preferredBrandId={brandDetails.brand.id}
            associatedIngredients={brandDetails.ingredients || []}
            onAssociationChange={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands", brandId] });
            }}
          />
        )}
      </div>
      <Navigation />
    </div>
  );
}