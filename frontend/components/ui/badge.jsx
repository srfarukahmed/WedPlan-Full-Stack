import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva("badge", {
  variants: { tone: { neutral: "", warning: "badge-warning", success: "badge-success", danger: "badge-danger" } },
  defaultVariants: { tone: "neutral" },
});

const tones = {
  pending: "warning", premium: "warning",
  accepted: "success", active: "success", approved: "success", paid: "success",
  rejected: "danger", blocked: "danger", cancelled: "danger", failed: "danger",
};

export function Badge({ value, children, className }) {
  return <span className={cn(variants({ tone: tones[value] }), className)}>{children ?? value}</span>;
}