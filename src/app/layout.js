// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LAEF UFDPar",
  description: "Liga Acadêmica de Educação Financeira",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="./public/favicon/favicon.ico" />
        {/* mais metadados */}
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
