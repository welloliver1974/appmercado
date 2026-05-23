"use client";

import { Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

function SearchInputInner({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const value = inputRef.current?.value || "";
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
      <input
        ref={inputRef}
        defaultValue={searchParams.get("q") || ""}
        type="text"
        placeholder={placeholder}
        className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64 placeholder-zinc-600"
      />
      <button type="submit" className="hidden" />
    </form>
  );
}

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <Suspense fallback={<div className="h-10 w-64 bg-zinc-900 rounded-lg animate-pulse" />}>
      <SearchInputInner placeholder={placeholder} />
    </Suspense>
  );
}
