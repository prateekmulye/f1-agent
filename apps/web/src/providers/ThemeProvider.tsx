'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { f1Theme } from '@/theme/f1Theme';

interface F1ThemeProviderProps {
  children: React.ReactNode;
}

export default function F1ThemeProvider({ children }: F1ThemeProviderProps) {
  return (
    <ThemeProvider theme={f1Theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}