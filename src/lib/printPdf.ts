/**
 * Generates a PDF blob from a react-pdf Document element,
 * opens it in a new browser tab, and triggers the system print dialog.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function printPdf(document: React.ReactElement<any>): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(document as any).toBlob();
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    // Fallback if popup blocked — download instead
    const a = window.document.createElement("a");
    a.href = url;
    a.download = "document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }
}
