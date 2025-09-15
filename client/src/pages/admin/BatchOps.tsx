import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PreviewRow {
  id: string;
  name?: string;
  current: { description?: string; tags?: string[] };
  proposed: { description?: string; tags?: string[] };
}

interface PreviewResponse {
  jobId: string;
  willUpdate: number;
  skipped: number;
  missing: string[];
  rows: PreviewRow[];
  warnings?: { duplicates?: number };
}

const adminKey = import.meta.env.VITE_ADMIN_API_KEY as string | undefined;

export default function BatchOps() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"query" | "paste">("query");
  const [collection, setCollection] = useState("ingredients");

  // Query form state
  const [field, setField] = useState("description");
  const [filterMode, setFilterMode] = useState("contains");
  const [value, setValue] = useState("");
  const [limit, setLimit] = useState("100");
  const [operation, setOperation] = useState("description_set");
  const [opText, setOpText] = useState("Test description");

  // Paste
  const [pasteText, setPasteText] = useState("");

  // Preview
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const buildOperationPayload = (operationType: string, opText: string) => {
    if (operationType === "tags_replace") {
      // Parse comma-separated tags into array
      const tags = opText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      return { newTags: tags };
    } else if (operationType === "tags_add") {
      const tags = opText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      return { add: tags };
    } else if (operationType === "tags_remove") {
      const tags = opText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      return { remove: tags };
    } else {
      // Description operations
      return { newText: opText };
    }
  };

  const handlePreview = async () => {
    try {
      let payload: any;
      if (mode === "query") {
        payload = {
          mode: "query",
          collection,
          filters: { field, mode: filterMode, value, limit: Number(limit) || undefined },
          operation: { type: operation, payload: buildOperationPayload(operation, opText) },
          options: { skipIfSame: true }
        };
      } else {
        const rows = parsePaste(pasteText);
        payload = {
          mode: "paste",
          collection,
          rows,
          options: { skipIfSame: true }
        };
      }
      const res = await fetch("/api/admin/batch/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {})
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Preview failed");
      const data: PreviewResponse = await res.json();
      setPreview(data);
      const sel: Record<string, boolean> = {};
      data.rows.forEach((r) => (sel[r.id] = true));
      setSelected(sel);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!preview) return;
    const sel: Record<string, boolean> = {};
    preview.rows.forEach((r) => (sel[r.id] = checked));
    setSelected(sel);
  };

  const handleCommit = async () => {
    if (!preview) return;
    const selectIds = Object.keys(selected).filter((id) => selected[id]);
    try {
      const payload = { ...(mode === "query" ? { mode: "query", collection, filters: { field, mode: filterMode, value, limit: Number(limit) || undefined }, operation: { type: operation, payload: buildOperationPayload(operation, opText) } } : { mode: "paste", collection, rows: preview.rows }), selectIds };
      const res = await fetch("/api/admin/batch/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {})
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Commit failed");
      const data = await res.json();
      toast({ title: "Batch started", description: `Job ${data.jobId}` });
    } catch (err: any) {
      toast({ title: "Commit failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Batch Operations</h1>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="query">Build Query</TabsTrigger>
            <TabsTrigger value="paste">Paste/CSV</TabsTrigger>
          </TabsList>
          <TabsContent value="query">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm">Collection</label>
                <Select value={collection} onValueChange={setCollection}>
                  <SelectTrigger className="bg-neutral-900 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingredients">Ingredients</SelectItem>
                    <SelectItem value="cocktails">Cocktails</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Field</label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger className="bg-neutral-900 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Mode</label>
                <Select value={filterMode} onValueChange={setFilterMode}>
                  <SelectTrigger className="bg-neutral-900 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Value</label>
                <Input value={value} onChange={(e) => setValue(e.target.value)} className="bg-neutral-900" />
              </div>
              <div>
                <label className="text-sm">Limit</label>
                <Input value={limit} onChange={(e) => setLimit(e.target.value)} className="bg-neutral-900" />
              </div>
              <div>
                <label className="text-sm">Operation</label>
                <Select value={operation} onValueChange={setOperation}>
                  <SelectTrigger className="bg-neutral-900 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description_set">Description Set</SelectItem>
                    <SelectItem value="tags_replace">Tags Replace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Text / Tags</label>
                <Textarea value={opText} onChange={(e) => setOpText(e.target.value)} className="bg-neutral-900" />
              </div>
            </div>
            <Button onClick={handlePreview}>Preview</Button>
          </TabsContent>
          <TabsContent value="paste">
            <div className="mb-4">
              <label className="text-sm">Collection</label>
              <Select value={collection} onValueChange={setCollection}>
                <SelectTrigger className="bg-neutral-900 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingredients">Ingredients</SelectItem>
                  <SelectItem value="cocktails">Cocktails</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="bg-neutral-900 font-mono h-40 mb-2"
              placeholder="Paste CSV/TSV with headers id,name,description,tags"
            />
            <Button onClick={handlePreview}>Parse & Preview</Button>
          </TabsContent>
        </Tabs>

        {preview && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm">Will update: {preview.willUpdate} &nbsp; Skipped: {preview.skipped} &nbsp; Missing: {preview.missing.length}</p>
              </div>
              <Checkbox
                aria-label="Select all"
                checked={preview.rows.every((r) => selected[r.id])}
                onCheckedChange={(c) => handleSelectAll(Boolean(c))}
              />
            </div>
            <Table className="mb-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Proposed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected[r.id]}
                        onCheckedChange={(c) => setSelected({ ...selected, [r.id]: Boolean(c) })}
                      />
                    </TableCell>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      <div className="max-w-xs text-xs text-neutral-400">
                        {r.current.description}
                        {r.current.tags && r.current.tags.length > 0 && (
                          <div>Tags: {r.current.tags.join(", ")}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs text-xs text-neutral-400">
                        {r.proposed.description}
                        {r.proposed.tags && r.proposed.tags.length > 0 && (
                          <div>Tags: {r.proposed.tags.join(", ")}</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button onClick={handleCommit}>Run Batch</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function parsePaste(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines.shift()!.split(/[\t,]/).map((h) => h.trim().toLowerCase());
  return lines.map((line) => {
    const cells = line.split(/[\t,]/);
    const obj: any = { id: "" };
    cells.forEach((cell, i) => {
      const h = headers[i];
      if (h === "id" || h === "document id") obj.id = cell.trim();
      if (h === "name") obj.name = cell.trim();
      if (h === "description") obj.proposed = { ...(obj.proposed || {}), description: cell.trim() };
      if (h === "tags") obj.proposed = { ...(obj.proposed || {}), tags: cell.split(/\||,/).map((t) => t.trim()) };
    });
    return obj;
  });
}

