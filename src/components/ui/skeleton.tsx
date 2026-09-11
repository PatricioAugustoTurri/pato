import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.269_0_0)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
