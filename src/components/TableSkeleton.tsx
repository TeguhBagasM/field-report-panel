interface TableSkeletonProps {
  rows?: number;
}

/** Baris-baris skeleton berkilau untuk keadaan memuat tabel. */
export default function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="skel-wrap" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          <span className="skel skel-title" />
          <span className="skel skel-text" />
          <span className="skel skel-pill" />
        </div>
      ))}
    </div>
  );
}
