export type CertificatePayload = {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName?: string;
  organizationName?: string;
  issuedAt: string;
  totalHours?: number;
  logoUrl?: string;
};

export async function generateCertificatePDF(
  payload: CertificatePayload,
  opts?: { action?: "download" | "preview" },
) {
  const action = opts?.action ?? "download";

  const res = await fetch("/api/certificate/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to generate PDF: ${res.status} ${txt}`);
  }

  const blob = await res.blob();

  const url = URL.createObjectURL(blob);
  if (action === "preview") {
    // Open in a new tab
    const w = window.open(url, "_blank");
    // We leave the blob URL (browsers revoke when tab closed). Optionally revoke after a delay.
    return w;
  }

  // default: download
  const a = document.createElement("a");
  a.href = url;
  a.download = payload.certificateNumber
    ? `Certificate-${payload.certificateNumber}.pdf`
    : `certificate.pdf`;
  a.click();
  // revoke after short delay to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default generateCertificatePDF;
