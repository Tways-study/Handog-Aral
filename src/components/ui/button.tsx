import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Pad-paper buttons: sunrise (the one primary action), ink, and paper-with-line. 44px+ everywhere.
// Disabled is a neutral paper button (muted fill, muted text, no sunrise) so it never reads as a live CTA.
const buttonVariants = cva(
  "pressable inline-flex shrink-0 items-center justify-center gap-2 font-bold whitespace-nowrap outline-none select-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:border-[1.5px] disabled:border-line disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-cta hover:bg-primary/90 active:shadow-pressed",
        ink: "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80",
        secondary:
          "border-[1.5px] border-border bg-background text-foreground hover:bg-secondary active:bg-secondary",
        outline:
          "border-[1.5px] border-input bg-transparent text-foreground hover:bg-secondary active:bg-secondary",
        ghost: "text-foreground hover:bg-secondary active:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        link: "min-h-11 text-foreground underline underline-offset-4 hover:text-foreground/80 active:translate-y-0",
      },
      size: {
        default: "h-12 rounded-[0.875rem] px-5 text-base",
        sm: "h-11 rounded-[0.875rem] px-4 text-[0.9375rem]",
        lg: "h-14 rounded-2xl px-6 text-[1.0625rem]",
        xl: "h-[3.75rem] rounded-[1.125rem] px-6 font-heading text-xl font-extrabold [&_svg:not([class*='size-'])]:size-6",
        icon: "size-11 rounded-[0.875rem]",
        "icon-lg": "size-14 rounded-[1.125rem] [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
