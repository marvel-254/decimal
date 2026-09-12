"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// product state = simple path routing (context §6.3).
function productOf(pathname: string): "tuition" | "school" {
  return pathname.startsWith("/tuition") ? "tuition" : "school";
}

const PRODUCTS: { id: "school" | "tuition"; label: string; href: string }[] = [
  { id: "school", label: "School Management", href: "/dashboard" },
  { id: "tuition", label: "Tuition", href: "/tuition" },
];

export function ProductSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const active = PRODUCTS.find((p) => p.id === productOf(pathname));

  const switchTo = (href: string) => {
    try {
      localStorage.setItem("decimal:lastProduct", productOf(href));
    } catch {
      // ignore storage errors
    }
    router.push(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted transition-colors data-popup-open:bg-muted">
        <Image
          src="/logo.jpeg"
          alt="Decimal"
          width={24}
          height={24}
          className="rounded-md"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-medium text-muted-foreground">
            Decimal
          </span>
          <span className="block truncate text-sm font-semibold text-foreground">
            {active?.label}
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch product
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRODUCTS.map((p) => (
          <DropdownMenuItem
            key={p.id}
            className="cursor-pointer"
            onClick={() => switchTo(p.href)}
          >
            <span className="flex-1">{p.label}</span>
            {p.id === active?.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}