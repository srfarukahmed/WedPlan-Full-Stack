import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("button", {
  variants: {
    variant: { default: "button-primary", outline: "button-outline", ghost: "button-ghost", danger: "button-danger" },
    size: { default: "", icon: "button-icon" },
  },
  defaultVariants: { variant: "default" },
});

export function Button({ asChild = false, className, variant, size, ...props }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}