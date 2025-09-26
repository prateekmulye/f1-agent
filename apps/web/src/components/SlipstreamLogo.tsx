'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import Image from 'next/image';

// New Slipstream color palette based on the logo
export const slipstreamColors = {
  primary: '#0C1522',    // Main dark navy from logo
  secondary: '#0F1E2F',  // Medium navy from logo
  tertiary: '#173245',   // Lighter navy from logo
  accent: '#2A4A5C',     // Complementary blue-gray
  light: '#3A5A70',      // Lighter accent
  surface: '#1A2B38',    // Surface color
  border: '#243541',     // Border color
  text: {
    primary: '#FFFFFF',
    secondary: '#B8C5D1',
    muted: '#8A9BA8'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #0C1522 0%, #173245 100%)',
    secondary: 'linear-gradient(135deg, #0F1E2F 0%, #2A4A5C 100%)',
    accent: 'linear-gradient(45deg, #173245 0%, #3A5A70 100%)'
  }
};

interface SlipstreamLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'full' | 'icon' | 'text';
  color?: 'default' | 'white' | 'monochrome';
  className?: string;
}

export default function SlipstreamLogo({
  size = 'medium',
  variant = 'full',
  color = 'default',
  className
}: SlipstreamLogoProps) {
  const theme = useTheme();

  const sizes = {
    small: {
      logoSize: 28,
      fontSize: '1.1rem',
      spacing: 0.8
    },
    medium: {
      logoSize: 42,
      fontSize: '1.6rem',
      spacing: 1.2
    },
    large: {
      logoSize: 56,
      fontSize: '2.2rem',
      spacing: 1.6
    },
    xlarge: {
      logoSize: 72,
      fontSize: '2.8rem',
      spacing: 2
    },
  };

  const currentSize = sizes[size];

  const getTextColor = () => {
    switch (color) {
      case 'white':
        return '#ffffff';
      case 'monochrome':
        return slipstreamColors.text.secondary;
      case 'default':
      default:
        return slipstreamColors.gradients.accent;
    }
  };

  const textColor = getTextColor();
  const isGradient = color === 'default';

  // SVG Logo Component using the actual logo
  const LogoIcon = () => (
    <Box
      sx={{
        position: 'relative',
        width: currentSize.logoSize,
        height: currentSize.logoSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& img': {
          filter: color === 'white' ? 'brightness(0) invert(1)' :
                  color === 'monochrome' ? 'grayscale(1) opacity(0.8)' : 'none',
          transition: 'all 0.3s ease',
        }
      }}
    >
      <Image
        src="/logo.svg"
        alt="Slipstream Logo"
        width={currentSize.logoSize}
        height={currentSize.logoSize}
        priority
        style={{
          width: currentSize.logoSize,
          height: currentSize.logoSize,
          objectFit: 'contain'
        }}
      />
    </Box>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  if (variant === 'text') {
    return (
      <Typography
        variant="h6"
        className={className}
        sx={{
          fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
          fontWeight: 700,
          fontSize: currentSize.fontSize,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
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
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: currentSize.spacing,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
        }
      }}
    >
      <LogoIcon />
      <Typography
        variant="h6"
        sx={{
          fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
          fontWeight: 700,
          fontSize: currentSize.fontSize,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
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