"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-[background-color,color,box-shadow,transform] duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Ink pill: near-black on light sections, warm white on dark ones.
        default: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12)] hover:bg-primary/88 hover:shadow-[0_10px_30px_-12px_hsl(var(--foreground)/0.45)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-foreground/15 bg-transparent text-foreground hover:border-foreground/30 hover:bg-foreground/[0.04]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
        link: "rounded-none text-foreground underline-offset-4 hover:underline active:scale-100",
        // Brand red, reserved for the primary call to action on a surface.
        accent: "bg-accent text-accent-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2)] hover:shadow-[0_12px_32px_-12px_hsl(var(--accent)/0.7)] hover:brightness-110",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }