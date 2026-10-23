// src/components/ui/LoadingSpinner.jsx
export default function LoadingSpinner({ text = 'Loading…' }) {
  return (
    <div className="loading-center">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
