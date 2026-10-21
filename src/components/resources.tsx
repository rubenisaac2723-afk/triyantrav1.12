"use client";
import Link from "next/link";
import { useState } from "react";
import { articles } from "@/lib/articles";
import { AnimatedArrow } from "./animated-arrow";
export function ResourceLibrary() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = articles.filter(
    (a) =>
      (category === "All" || a.category === category) &&
      `${a.title} ${a.answer}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="resource-toolbar">
        <div className="filter-group">
          <span className="toolbar-label" id="resource-filter-label">
            Filter resources
          </span>
          <div
            className="filter-buttons"
            role="group"
            aria-labelledby="resource-filter-label"
          >
            {["All", ...new Set(articles.map((a) => a.category))].map((c) => (
              <button
                key={c}
                data-rgb
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="search-group">
          <label className="toolbar-label" htmlFor="resource-search">
            Search resources
          </label>
          <input
            id="resource-search"
            className="search-field"
            type="search"
            placeholder="Search guides…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <p className="muted" role="status">
        {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
      </p>
      {filtered.length ? (
        <div className="resource-grid">
          {filtered.map((a) => (
            <Link
              className="resource-card"
              key={a.slug}
              href={"/resources/" + a.slug}
            >
              <p className="eyebrow">{a.category}</p>
              <h2>{a.title}</h2>
              <p>{a.answer}</p>
              <span className="text-link">
                Read guide <AnimatedArrow direction="up-right" size="sm" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No matching guides</h2>
          <p>Try a broader search or another category.</p>
          <button
            className="button secondary"
            data-rgb
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
