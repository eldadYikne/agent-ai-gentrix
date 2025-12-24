"use client";
export function Loader() {
  return (
    <div className="loader-container">
      <div className="loader" />

      <div className="text-center text-sm text-[#374151]">
        <div>Retrieving information from the PDF documents…</div>
        <div className="text-xs text-[#6b7280]">
          Your answer is being prepared based on the files.
        </div>
      </div>
    </div>
  );
}
