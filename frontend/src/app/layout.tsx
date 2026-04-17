'use client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
