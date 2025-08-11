import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, CheckCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { compressImage } from "@/lib/imageCompression";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPrefill: (v: { name?: string; proof?: number | null; bottle_text?: string }) => void;
};

export default function BrandFromImageDialog({ open, onOpenChange, onPrefill }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [compressedImage, setCompressedImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editedName, setEditedName] = useState("");
  const [editedProof, setEditedProof] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toDataUrl(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  function resetForm() {
    setFile(null);
    setPreview("");
    setCompressedImage("");
    setResult(null);
    setEditedName("");
    setEditedProof("");
    setError(null);
    setCreating(false);
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  }

  async function extractBrand() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      console.log("🔥 Client: Starting OCR extraction for file:", file.name, file.size);
      
      // Compress image for OCR - more aggressive compression for API efficiency
      // OCR works well even with lower quality images
      const compressedBase64 = await compressImage(file, 512, 0.6); // 512px max, 60% quality
      console.log("🔥 Client: Compressed image length:", compressedBase64.length);
      
      // Store compressed image for later use in brand creation
      setCompressedImage(compressedBase64);
      
      const res = await fetch("/api/ai/brands/from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: compressedBase64, autoCreate: false }),
      });
      
      console.log("🔥 Client: Response status:", res.status);
      const json = await res.json();
      console.log("🔥 Client: Response JSON:", json);
      
      if (!res.ok) {
        const errorMsg = json?.error || json?.message || "OCR request failed";
        const details = json?.details ? `\n\nDetails: ${json.details}` : "";
        throw new Error(errorMsg + details);
      }
      
      setResult(json);
      
      // Set editable fields with extracted data
      setEditedName(json?.name || "");
      setEditedProof(json?.proof ? String(json.proof) : "");
    } catch (e: any) {
      console.error("🔥 Client: OCR failed:", e);
      setError(e?.message ?? "Failed to process image");
    } finally {
      setLoading(false);
    }
  }

  async function createBrand() {
    if (!editedName.trim()) {
      setError("Brand name is required");
      return;
    }
    
    setCreating(true);
    setError(null);
    try {
      const payload = {
        name: editedName.trim(),
        proof: editedProof ? Number(editedProof) : null,
        imageUrl: compressedImage || preview, // Use compressed image if available, fallback to preview
        notes: result?.notes || undefined,
      };
      
      console.log("🔥 Client: Creating brand with payload:", payload);
      
      const res = await fetch("/api/preferred-brands", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
      
      console.log("🔥 Client: Create brand response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to create brand");
      }
      
      const created = await res.json();
      
      // Notify parent component about the creation
      onPrefill({ name: editedName, proof: payload.proof, bottle_text: result?.bottle_text });
      
      // Close dialog after successful creation
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create brand");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[640px] bg-[#2a2920] border-[#4a4735] text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica] flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Add Preferred Brand from Photo
          </DialogTitle>
          <DialogDescription className="text-[#bab59b]">
            Upload a bottle photo to extract brand information using AI vision models
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white mb-2 block">Upload bottle photo</Label>
            <Input
              type="file"
              accept="image/*"
              className="bg-[#383529] border-[#544f3a] text-white file:bg-[#f2c40c] file:text-[#161611] file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
              onChange={async (e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setResult(null);
                setEditedName("");
                setEditedProof("");
                setError(null);
                if (f) {
                  try {
                    const dataUrl = await toDataUrl(f);
                    setPreview(dataUrl);
                  } catch (error) {
                    setError("Failed to load image preview");
                  }
                } else {
                  setPreview("");
                }
              }}
            />
          </div>

          {preview && (
            <div className="flex justify-center">
              <img 
                src={preview} 
                alt="Bottle preview" 
                className="max-w-full max-h-64 rounded-lg border border-[#544f3a] object-contain"
              />
            </div>
          )}



          {error && (
            <Alert className="bg-red-600/20 border-red-600">
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {result && (
          <div className="mt-4 rounded-lg border border-[#544f3a] bg-[#383529] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#bab59b]">Model:</span>
                <div className="font-medium text-white truncate">{result.model}</div>
              </div>
              <div>
                <span className="text-[#bab59b]">Confidence:</span>
                <div className={`font-medium ${getConfidenceColor(result.confidence || 0)}`}>
                  {typeof result.confidence === "number" ? `${(result.confidence * 100).toFixed(1)}%` : "—"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-[#bab59b] text-sm">Brand Name</Label>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter brand name"
                  className="mt-1 bg-[#2a2920] border-[#544f3a] text-white"
                />
              </div>
              
              <div>
                <Label className="text-[#bab59b] text-sm">Proof (optional)</Label>
                <Input
                  type="number"
                  value={editedProof}
                  onChange={(e) => setEditedProof(e.target.value)}
                  placeholder="e.g. 80"
                  className="mt-1 bg-[#2a2920] border-[#544f3a] text-white"
                />
              </div>

              {result.notes && (
                <div>
                  <span className="text-[#bab59b] text-sm">AI Notes:</span>
                  <div className="text-white text-sm bg-[#2a2920] p-2 rounded border border-[#544f3a]">{result.notes}</div>
                </div>
              )}
            </div>

            {result.bottle_text && (
              <div>
                <Label className="text-[#bab59b] text-sm">Detected Text:</Label>
                <Textarea 
                  value={result.bottle_text} 
                  readOnly 
                  className="mt-1 min-h-[100px] bg-[#2a2920] border-[#544f3a] text-white text-sm"
                />
              </div>
            )}


          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="bg-[#544f3a] hover:bg-[#6a5d4a] text-white"
          >
            Close
          </Button>
          
          {!result ? (
            <Button 
              onClick={extractBrand} 
              disabled={!file || loading}
              className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Extract Brand
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={createBrand} 
              disabled={!editedName.trim() || creating}
              className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Brand Item
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}