interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label = "Memuat..." }: SpinnerProps) {
  return (
    <div className="spinner-wrap" role="status" aria-label={label}>
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
