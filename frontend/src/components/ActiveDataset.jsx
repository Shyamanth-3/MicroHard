import { useDataset } from "../context/DataContext";

export default function ActiveDataset() {
  const { dataset } = useDataset();

  if (!dataset) return null;

  return (
    <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
      <div className="font-semibold">Active Dataset</div>
      <div className="opacity-80">
        {dataset.fileName} • {dataset.rows} rows • {dataset.type}
      </div>
    </div>
  );
}
