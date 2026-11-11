import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export function RatingStars({
  rating,
  max = 5,
  size = "sm",
  showNumber = true,
}: RatingStarsProps) {
  const starSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const isHalf = !filled && i < rating;
          return (
            <Star
              key={i}
              className={`${starSizes[size]} ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : isHalf
                  ? "fill-amber-200 text-amber-400"
                  : "text-zinc-300 dark:text-zinc-700"
              }`}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
