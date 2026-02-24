"use client";

import {
  CertificatePayload,
  generateCertificatePDF,
} from "../../lib/generateCertificatePDF";

export type CertificatePDFProps = CertificatePayload;

/**
 * Server-side PDF generation: forward request to `/api/certificate/pdf` and trigger download.
 * This keeps the UI light and ensures the PDF contains selectable text and embedded logo fetched server-side.
 */
export async function downloadCertificatePDF(props: CertificatePDFProps) {
  // The client helper will call the server route and trigger the download
  return generateCertificatePDF(props, { action: "download" });
}

export async function previewCertificatePDF(props: CertificatePDFProps) {
  return generateCertificatePDF(props, { action: "preview" });
}
