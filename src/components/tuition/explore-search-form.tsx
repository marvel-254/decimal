"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function ExploreSearchForm({
  defaultQ,
  defaultSort,
}: {
  defaultQ: string;
  defaultSort: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [sort, setSort] = useState(defaultSort);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    if (sort === "rating") params.set("sort", sort);
    const qs = params.toString();
    router.push(`/tuition/explore${qs ? `?${qs}` : ""}`);
  }

  return (
    <form
      method="GET"
      action="/tuition/explore"
      onSubmit={handleSubmit}
      className="flex gap-2"
      role="search"
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search programmes, subjects…"
        aria-label="Search programmes"
        className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-tuition-accent"
      />
      <select
        name="sort"
        aria-label="Sort programmes"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="h-10 rounded-lg border border-border bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-tuition-accent"
      >
        <option value="newest">Newest</option>
        <option value="rating">Top rated</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-tuition-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-tuition-accent/90"
      >
        <Search className="h-4 w-4" /> Search
      </button>
    </form>
  );
}