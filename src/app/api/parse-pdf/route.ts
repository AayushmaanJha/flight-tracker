import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { extractFlightCodes } from "@/lib/parse-flight-codes";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 5 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text = result.text;

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF. It may be a scanned image." },
        { status: 422 }
      );
    }

    const codes = extractFlightCodes(text);

    return NextResponse.json({ codes });
  } catch (e) {
    console.error("PDF parse error:", e);
    return NextResponse.json(
      { error: "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
