import type { Metadata, Viewport } from "next";
import "./styles/base.css";
import "./styles/dashboard.css";
import "./styles/features.css";
import "./styles/story-settings.css";
import "./styles/responsive.css";

export const metadata: Metadata = {
  title: {
    default: "Love You Most +1",
    template: "%s · Love You Most +1",
  },
  description: "Rapha and Minette's private shared home for memories, plans, notes and adventures.",
  applicationName: "Love Hub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Love Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#153a31",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
