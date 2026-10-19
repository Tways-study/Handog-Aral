"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useResolvedTheme } from "@/components/ThemeSync"

// Toasts are paper cards with a line border; the theme follows the app theme, not next-themes.
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="top-center"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 motion-safe:animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-[1.5px] !shadow-md !font-body !text-[0.9375rem]",
          actionButton: "!min-h-11 !rounded-[0.875rem] !bg-primary !px-4 !text-[0.9375rem] !font-bold !text-primary-foreground",
          cancelButton: "!min-h-11 !rounded-[0.875rem] !bg-secondary !px-4 !text-[0.9375rem] !font-bold !text-secondary-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
