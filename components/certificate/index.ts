export { CertificatePreview } from "./certificate-preview";
export type { CertificatePreviewProps } from "./certificate-preview";
export { CertificatePreview as default } from "./certificate-preview";
// Export the server-side PDF helpers
export {
  downloadCertificatePDF,
  previewCertificatePDF,
} from "./certificate-pdf";
export type { CertificatePDFProps } from "./certificate-pdf";
// Re-export the PDF document component (applicable for direct usage)
export { default as CertificatePDFDocument } from "./CertificatePDFDocument";
