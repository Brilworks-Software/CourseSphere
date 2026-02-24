import React from "react";
import { pdf } from "@react-pdf/renderer";
import CertificateAppreciationPDF, {
  CertificateAppreciationProps,
} from "../../../../components/certificate/CertificatePDFDocument";

// Helper: fetch an image URL and return a data URI string (or null on failure)
async function fetchImageAsDataUri(url?: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const b64 = (globalThis as any).Buffer.from(arrayBuffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${b64}`;
  } catch (err) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Map incoming request fields to the appreciation certificate props
    const props: CertificateAppreciationProps = {
      recipientName: body.studentName || body.recipientName || "",
      organizationName: body.organizationName || "COMPANY NAME",
      subtitle: body.subtitle || "OF APPRECIATION",
      bodyText:
        body.bodyText ||
        "This certificate is presented in recognition of outstanding contribution.",
      dateLabel: body.dateLabel || "DATE",
      signatureLabel: body.signatureLabel || "SIGNATURE",
      // concrete values displayed on the certificate
      dateValue: body.issuedAt || body.dateValue || undefined,
      signatureName: body.signatureName || body.instructorName || undefined,
      certificateNumber: body.certificateNumber || undefined,
      logoBase64: null,
    };

    const logoUrl: string | undefined = body.logoUrl;
    const logoBase64 = await fetchImageAsDataUri(logoUrl);
    if (logoBase64) props.logoBase64 = logoBase64;

    const doc = <CertificateAppreciationPDF {...props} />;
    const buffer = await pdf(doc).toBuffer();

    // `buffer` can be a Node Buffer or a stream depending on environment/renderer
    // cast to any for the Response body to avoid TypeScript mismatch here
    return new Response(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Certificate-${
          body.certificateNumber || props.recipientName || "certificate"
        }.pdf"`,
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export const runtime = "nodejs";
