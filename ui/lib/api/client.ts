const API_BASE = "/api";

export const reportAPI = {
  // List all available reports
  list: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE}/reports`);
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  },

  // Get report content (MD or HTML)
  getContent: async (filename: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/reports/${filename}`);
    if (!response.ok) throw new Error("Failed to fetch report content");
    return response.text();
  },

  // Download PDF
  downloadPDF: async (filename: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/reports/${filename}`);
    if (!response.ok) throw new Error("Failed to download PDF");
    return response.blob();
  },
};
