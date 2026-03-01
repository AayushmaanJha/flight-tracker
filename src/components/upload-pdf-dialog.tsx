"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";

type Step = "idle" | "parsing" | "review";

interface UploadPdfDialogProps {
  onAddFlights: (codes: string[]) => void;
}

export function UploadPdfDialog({ onAddFlights }: UploadPdfDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [codes, setCodes] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("idle");
    setCodes([]);
    setSelected(new Set());
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStep("parsing");

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${baseUrl}/api/parse-pdf`, { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to parse PDF");
        setStep("idle");
        return;
      }

      if (json.codes.length === 0) {
        setError("No flight codes found in this PDF.");
        setStep("idle");
        return;
      }

      setCodes(json.codes);
      setSelected(new Set(json.codes));
      setStep("review");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("idle");
    }
  }

  function toggleCode(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleConfirm() {
    onAddFlights(Array.from(selected));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-1" />
          Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "review" ? "Review Flight Codes" : "Upload Boarding Pass / Itinerary"}
          </DialogTitle>
        </DialogHeader>

        {step === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a PDF boarding pass, itinerary, or booking confirmation to extract flight codes automatically.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Extracting flight codes...</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {codes.length} flight code{codes.length !== 1 && "s"}. Deselect any that don&apos;t look right.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {codes.map((code) => (
                <div key={code} className="flex items-center gap-2">
                  <Checkbox
                    id={`code-${code}`}
                    checked={selected.has(code)}
                    onCheckedChange={() => toggleCode(code)}
                  />
                  <Label htmlFor={`code-${code}`} className="font-mono text-sm cursor-pointer">
                    {code}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleConfirm} disabled={selected.size === 0}>
                Add {selected.size} Flight{selected.size !== 1 && "s"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
