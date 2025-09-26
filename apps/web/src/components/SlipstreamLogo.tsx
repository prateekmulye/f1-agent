'use client';

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { f1Colors } from '@/theme/f1Theme';

interface SlipstreamLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'text';
  color?: 'primary' | 'white' | 'gradient';
}

export default function SlipstreamLogo({
  size = 'medium',
  variant = 'full',
  color = 'gradient'
}: SlipstreamLogoProps) {
  const theme = useTheme();

  const sizes = {
    small: {
      logoSize: 32,
      fontSize: '1.2rem',
      iconScale: 0.7,
      spacing: 1
    },
    medium: {
      logoSize: 48,
      fontSize: '1.8rem',
      iconScale: 1,
      spacing: 1.5
    },
    large: {
      logoSize: 64,
      fontSize: '2.5rem',
      iconScale: 1.3,
      spacing: 2
    },
  };

  const currentSize = sizes[size];

  const getTextColor = () => {
    switch (color) {
      case 'white':
        return '#ffffff';
      case 'primary':
        return f1Colors.ferrari.main;
      case 'gradient':
      default:
        return `linear-gradient(45deg, ${f1Colors.ferrari.main}, ${f1Colors.mercedes.main}, ${f1Colors.mclaren.main})`;
    }
  };

  const textColor = getTextColor();
  const isGradient = color === 'gradient';

  // Modern streamlined logo icon
  const LogoIcon = () => (
    <Box
      sx={{
        position: 'relative',
        width: currentSize.logoSize,
        height: currentSize.logoSize,
        transform: `scale(${currentSize.iconScale})`,
      }}
    >
      {/* Main speed lines */}
      <svg
        width={currentSize.logoSize}
        height={currentSize.logoSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="slipstreamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={f1Colors.ferrari.main} />
            <stop offset="50%" stopColor={f1Colors.mercedes.main} />
            <stop offset="100%" stopColor={f1Colors.mclaren.main} />
          </linearGradient>
          <linearGradient id="slipstreamGradient2" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={alpha(f1Colors.ferrari.main, 0.8)} />
            <stop offset="100%" stopColor={alpha(f1Colors.mercedes.main, 0.6)} />
          </linearGradient>
        </defs>

        {/* Dynamic speed lines representing slipstream */}
        <path
          d="M8 14 L40 14 C42 14 44 16 44 18 C44 20 42 22 40 22 L8 22 Z"
          fill={color === 'white' ? '#ffffff' : 'url(#slipstreamGradient)'}
          opacity="0.9"
        />
        <path
          d="M4 20 L36 20 C38 20 40 22 40 24 C40 26 38 28 36 28 L4 28 Z"
          fill={color === 'white' ? alpha('#ffffff', 0.8) : 'url(#slipstreamGradient2)'}
          opacity="0.7"
        />
        <path
          d="M12 26 L42 26 C43 26 44 27 44 28 C44 29 43 30 42 30 L12 30 Z"
          fill={color === 'white' ? alpha('#ffffff', 0.6) : f1Colors.mclaren.main}
          opacity="0.5"
        />

        {/* Central dynamic element */}
        <circle
          cx="38"
          cy="22"
          r="3"
          fill={color === 'white' ? '#ffffff' : f1Colors.ferrari.main}
          opacity="0.9"
        />
        <circle
          cx="36"
          cy="24"
          r="2"
          fill={color === 'white' ? alpha('#ffffff', 0.7) : f1Colors.mercedes.main}
          opacity="0.7"
        />
      </svg>
    </Box>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  if (variant === 'text') {
    return (
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          fontSize: currentSize.fontSize,
          letterSpacing: '-0.02em',
          ...(isGradient ? {
            background: textColor,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : {
            color: textColor,
          }),
        }}
      >
        SLIPSTREAM
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: currentSize.spacing,
      }}
    >
      <LogoIcon />
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          fontSize: currentSize.fontSize,
          letterSpacing: '-0.02em',
          ...(isGradient ? {
            background: textColor,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : {
            color: textColor,
          }),
        }}
      >
        SLIPSTREAM
      </Typography>
    </Box>
  );
}