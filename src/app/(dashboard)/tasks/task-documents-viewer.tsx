'use client';

import {
  DocumentGroup,
  resolveFileUrl,
  type DocumentFile,
} from '@/components/common/DocumentViewer';

export type TaskFile = DocumentFile & { kind: 'prescription' | 'invoice' };

export interface AdminTaskDocs {
  id: string;
  prescriptions?: string[];
  invoiceUrl?: string | null;
}

export { resolveFileUrl };

export function viewFile(file: TaskFile) {
  const url = resolveFileUrl(file.url);
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
}

/**
 * Rx + Invoice table cells for the super-admin tasks data table.
 *
 * Instead of plain text links the cell now renders actual image thumbnails;
 * hover (or click) on a thumbnail opens the enlarged modal gallery — multiple
 * prescription images show as a strip with prev/next navigation inside the
 * modal (see components/common/DocumentViewer).
 */
export function TaskDocumentCells({ task }: { task: AdminTaskDocs }) {
  const prescriptions = (task.prescriptions || []).map((url, i) => ({
    url,
    label: `Rx ${i + 1}`,
  }));
  const invoiceFiles: DocumentFile[] = task.invoiceUrl
    ? [{ url: task.invoiceUrl, label: 'Invoice' }]
    : [];

  return (
    <>
      <td className="px-3 py-2 whitespace-nowrap align-top text-xs">
        <DocumentGroup
          files={prescriptions}
          title="Doctor Prescription"
          emptyText="—"
          maxVisible={3}
        />
      </td>
      <td className="px-3 py-2 whitespace-nowrap align-top text-xs">
        <DocumentGroup
          files={invoiceFiles}
          title="Test Invoice"
          emptyText="—"
          maxVisible={3}
        />
      </td>
    </>
  );
}


