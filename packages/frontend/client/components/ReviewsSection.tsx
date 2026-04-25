import { useMemo, useState } from "react";
import { Loader2, Star, User } from "lucide-react";
import { useServiceReviews } from "@/hooks";
import type { Review } from "@shared/api";

interface ReviewsSectionProps {
  propertyId: string;
  rating?: string | number;
  totalReviews?: number;
  maxVisible?: number;
}

const CATEGORY_LABELS = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "checkIn", label: "Check-in" },
  { key: "value", label: "Value" },
] as const;

type NormalizedReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  categories: {
    cleanliness?: number;
    accuracy?: number;
    communication?: number;
    location?: number;
    checkIn?: number;
    value?: number;
  };
};

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeReview(review: Review, index: number): NormalizedReview {
  return {
    id: review.id ?? `review-${index}`,
    name: "Guest",
    rating: review.overall_rating ?? 0,
    comment: review.comment ?? review.title ?? "",
    createdAt: review.created_at ?? "",
    categories: {
      cleanliness: review.cleanliness_rating,
      accuracy: review.accuracy_rating,
      communication: review.communication_rating,
      location: review.location_rating,
      checkIn: review.checkin_rating,
      value: review.value_rating,
    },
  };
}

function formatReviewDate(date: string): string {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function ReviewsSection({
  propertyId,
  rating,
  totalReviews,
  maxVisible = 3,
}: ReviewsSectionProps) {
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [paginationState, setPaginationState] = useState({
    page: 1,
    forPropertyId: propertyId,
    forRating: undefined as number | undefined,
  });

  // Derived: automatically resets to page 1 when filters change (no effect needed)
  const page =
    paginationState.forPropertyId === propertyId && paginationState.forRating === selectedRating
      ? paginationState.page
      : 1;

  const setPage = (newPage: number | ((prev: number) => number)) =>
    setPaginationState((prev) => {
      const next = typeof newPage === "function" ? newPage(prev.page) : newPage;
      return { page: next, forPropertyId: propertyId, forRating: selectedRating };
    });

  const { data, isLoading, isError } = useServiceReviews(
    propertyId,
    page,
    maxVisible
  );

  const reviews = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((item, index) => normalizeReview(item, index));
  }, [data]);

  const filteredReviews = useMemo(() => {
    if (!selectedRating) return reviews;
    return reviews.filter((reviewItem) => Math.round(reviewItem.rating) === selectedRating);
  }, [reviews, selectedRating]);

  const reviewCount = data?.total ?? totalReviews ?? filteredReviews.length;
  const pages = data?.pages ?? 1;
  const currentPage = data?.page ?? page;

  const breakdown = useMemo(() => {
    const byRating: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const reviewItem of filteredReviews) {
      const rounded = Math.max(1, Math.min(5, Math.round(reviewItem.rating)));
      byRating[rounded] += 1;
    }

    return byRating;
  }, [filteredReviews]);

  const categoryAverages = useMemo(() => {
    const totals = {
      cleanliness: 0,
      accuracy: 0,
      communication: 0,
      location: 0,
      checkIn: 0,
      value: 0,
    };

    const counts = {
      cleanliness: 0,
      accuracy: 0,
      communication: 0,
      location: 0,
      checkIn: 0,
      value: 0,
    };

    for (const reviewItem of filteredReviews) {
      for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
        const value = reviewItem.categories[key];
        if (typeof value === "number") {
          totals[key] += value;
          counts[key] += 1;
        }
      }
    }

    const fallback =
      filteredReviews.length > 0
        ? roundToOneDecimal(
            filteredReviews.reduce((sum, reviewItem) => sum + reviewItem.rating, 0) /
              filteredReviews.length
          )
        : typeof rating === "string"
          ? Number(rating)
          : typeof rating === "number"
            ? rating
            : 0;

    return Object.fromEntries(
      (Object.keys(totals) as Array<keyof typeof totals>).map((key) => {
        const average = counts[key] > 0 ? totals[key] / counts[key] : fallback;
        return [key, roundToOneDecimal(average)];
      })
    ) as Record<keyof typeof totals, number>;
  }, [filteredReviews, rating]);

  const averageRating = useMemo(() => {
    if (filteredReviews.length > 0) {
      const sum = filteredReviews.reduce((acc, reviewItem) => acc + reviewItem.rating, 0);
      return roundToOneDecimal(sum / filteredReviews.length);
    }

    if (typeof rating === "string") return roundToOneDecimal(Number(rating) || 0);
    if (typeof rating === "number") return roundToOneDecimal(rating);
    return 0;
  }, [filteredReviews, rating]);

  const totalForBreakdown = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return (
    <section className="bg-white rounded-2xl p-4 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h2 className="text-ganitel-text-title text-base sm:text-lg font-bold">Ratings and Reviews</h2>
          <span className="text-ganitel-text-label text-sm sm:text-base font-normal whitespace-nowrap">
            · <span className="text-ganitel-primary">★</span>
            {averageRating.toFixed(1)} ({reviewCount} Reviews)
          </span>
        </div>

        <select
          aria-label="Filter reviews by rating"
          value={selectedRating ?? "all"}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedRating(value === "all" ? undefined : Number(value));
          }}
          className="h-10 rounded-lg border border-ganitel-neutral-3 bg-white px-3 text-sm text-ganitel-text-title focus:outline-none focus:ring-2 focus:ring-ganitel-primary"
        >
          <option value="all">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = breakdown[score];
            const width = totalForBreakdown > 0 ? (count / totalForBreakdown) * 100 : 0;

            return (
              <div key={score} className="flex items-center gap-2">
                <span className="w-8 text-xs font-semibold text-ganitel-text-title">{score}★</span>
                <div className="h-2 flex-1 rounded-full bg-ganitel-neutral-2 overflow-hidden">
                  <div className="h-full rounded-full bg-ganitel-primary" style={{ width: `${width}%` }} />
                </div>
                <span className="w-6 text-right text-xs text-ganitel-text-label">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {CATEGORY_LABELS.map((category) => {
            const value = categoryAverages[category.key];
            return (
              <div key={category.key} className="flex items-center justify-between text-xs font-semibold">
                <span className="text-ganitel-text-title">{category.label}</span>
                <span className="text-ganitel-text-title">{value.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-ganitel-primary" />
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-ganitel-text-label">Unable to load reviews at the moment.</p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="flex flex-col gap-6">
          {filteredReviews.length === 0 ? (
            <p className="text-sm text-ganitel-text-label">No reviews for this rating yet.</p>
          ) : (
            filteredReviews.map((reviewItem) => (
              <article key={reviewItem.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-ganitel-neutral-2 border border-ganitel-neutral-3 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-ganitel-text-label" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-ganitel-text-title text-sm font-bold leading-tight">{reviewItem.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            className={`w-3.5 h-3.5 ${
                              value <= Math.round(reviewItem.rating)
                                ? "fill-ganitel-primary text-ganitel-primary"
                                : "text-ganitel-neutral-3"
                            }`}
                          />
                        ))}
                      </div>
                      {reviewItem.createdAt ? (
                        <span className="text-xs text-ganitel-text-label">{formatReviewDate(reviewItem.createdAt)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="text-ganitel-text-label text-sm leading-relaxed">
                  {reviewItem.comment || "No additional comment."}
                </p>
              </article>
            ))
          )}
        </div>
      ) : null}

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="h-10 px-4 rounded-lg border border-ganitel-neutral-3 text-sm font-semibold text-ganitel-text-title disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-ganitel-text-label">
            Page {currentPage} / {pages}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
            disabled={currentPage >= pages || isLoading}
            className="h-10 px-4 rounded-lg border border-ganitel-neutral-3 text-sm font-semibold text-ganitel-text-title disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
