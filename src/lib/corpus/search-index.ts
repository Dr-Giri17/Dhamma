import indexJson from "../../../data/corpus/search-index.json";

export interface SearchIndexDocument {
  segmentUid: string;
  textId: string;
  workId: string;
  canonicalStatus: "canonical" | "post-canonical" | "commentarial";
  tokens: string[];
  normalized: Partial<Record<"pli" | "en" | "ru" | "id", string>>;
}

interface SearchIndex {
  schemaVersion: number;
  generatedAt: string;
  sourceRevision: string;
  documentCount: number;
  documents: SearchIndexDocument[];
}

const index = indexJson as SearchIndex;
const bySegmentUid = new Map(
  index.documents.map((document) => [document.segmentUid, document])
);

export function indexedDocument(segmentUid: string): SearchIndexDocument | undefined {
  return bySegmentUid.get(segmentUid);
}

export function searchIndexInfo() {
  return {
    schemaVersion: index.schemaVersion,
    sourceRevision: index.sourceRevision,
    documentCount: index.documentCount,
  };
}

