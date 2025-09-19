import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function FullPageLoader({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <ArrowPathIcon className="h-14 w-14 animate-spin text-blue-600" />
      <p className="mt-4 text-lg font-semibold text-blue-800">{message}</p>
    </div>
  );
}
