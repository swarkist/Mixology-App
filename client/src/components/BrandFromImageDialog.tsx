import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPrefill: (v: { name?: string; proof?: number | null; bottle_text?: string }) => void;
};

export default function BrandFromImageDialog({ open, onOpenChange, onPrefill }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [autoCreate, setAutoCreate] = useState(false);
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
    setResult(null);
    setError(null);
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = preview || (await toDataUrl(file));
      const res = await fetch("/api/ai/brands/from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, autoCreate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "OCR request failed");
      setResult(json);
      
      // Prefill the form with extracted data
      if (json?.name) {
        onPrefill({ name: json.name, proof: json.proof ?? null, bottle_text: json.bottle_text });
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to process image");
    } finally {
      setLoading(false);
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoCreate"
              checked={autoCreate}
              onChange={(e) => setAutoCreate(e.target.checked)}
              className="rounded border-[#544f3a] bg-[#383529]"
            />
            <Label htmlFor="autoCreate" className="text-sm text-[#bab59b]">
              Auto-create preferred brand if confidence ≥ 70%
            </Label>
          </div>

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

            <div className="space-y-2">
              <div>
                <span className="text-[#bab59b] text-sm">Brand Name:</span>
                <div className="font-medium text-white">{result.name || "—"}</div>
              </div>
              
              <div>
                <span className="text-[#bab59b] text-sm">Proof:</span>
                <div className="font-medium text-white">{result.proof ? `${result.proof}°` : "—"}</div>
              </div>

              {result.notes && (
                <div>
                  <span className="text-[#bab59b] text-sm">Notes:</span>
                  <div className="text-white text-sm">{result.notes}</div>
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

            {result.created && (
              <Alert className="bg-green-600/20 border-green-600">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  ✅ Created Preferred Brand: <strong>{result.created?.name}</strong>
                </AlertDescription>
              </Alert>
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
          <Button 
            onClick={submit} 
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}