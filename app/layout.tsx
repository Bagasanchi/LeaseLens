import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Гэрээ шалгагч",
  description: "Түрээсийн болон хөдөлмөрийн гэрээг AI-аар шинжилж, хуульч баталгаажуулна",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased"><aside style={{padding:"8px 16px",background:"#f0f4ff",color:"#182947",textAlign:"center"}}>Курсын демо · Жишээ өгөгдөл · <a href="/checker/index.html">LeaseLens шалгагч ба миний сан</a></aside>{children}</body>
    </html>
  );
}

