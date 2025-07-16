import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
}

const Accordion = React.forwardRef<
  HTMLDivElement,
  AccordionProps
>(({ className, type, collapsible, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
))
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  AccordionItemProps
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean
  }
>(({ className, children, isOpen, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className={cn(
      "h-4 w-4 shrink-0 transition-transform duration-200",
      isOpen && "rotate-180"
    )} />
  </button>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
  }
>(({ className, children, isOpen, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden transition-all duration-200",
      isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
    )}
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>
      {children}
    </div>
  </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } 