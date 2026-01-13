import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brownWarm/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 版本3主CTA（温暖棕色，全圆角）
        default:
          "bg-brownWarm text-white shadow-lg hover:bg-brownDark rounded-full",
        // 版本3次要按钮（描边）
        outline:
          "border-2 border-brownWarm text-brownWarm bg-transparent hover:bg-brownWarm hover:text-white rounded-full",
        // 深色按钮
        dark:
          "bg-brownDark text-white shadow-lg hover:bg-brownDark/90 rounded-full",
        // 幽灵按钮
        ghost: "hover:bg-brownWarm/10 hover:text-brownWarm rounded-lg",
        // 链接样式
        link: "text-brownWarm underline-offset-4 hover:underline",
        // 次要按钮（浅色背景）
        secondary:
          "bg-cream text-brownDark shadow-sm hover:bg-brownWarm/10 rounded-full",
        // 危险操作
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 rounded-full",
      },
      size: {
        // 版本3标准尺寸
        default: "h-12 px-6 py-3 text-base",
        // 小尺寸
        sm: "h-9 px-4 py-2 text-sm",
        // 版本3大按钮（56px高度）
        lg: "h-14 px-8 py-4 text-base font-semibold",
        // 图标按钮
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
