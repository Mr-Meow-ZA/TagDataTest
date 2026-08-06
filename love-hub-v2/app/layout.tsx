import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Love You Most +1",
  description: "Rapha and Minette's private shared home.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
