import { createTheme, alpha } from '@mui/material/styles';

// Slipstream Brand Colors (from logo)
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
    accent: 'linear-gradient(45deg, #173245 0%, #3A5A70 100%)',
    hero: 'linear-gradient(135deg, #0C1522 0%, #0F1E2F 25%, #173245 50%, #2A4A5C 75%, #3A5A70 100%)'
  }
};

// F1 Team Colors with Alpha Variants (for data visualization)
export const f1Colors = {
  ferrari: {
    main: '#E8002D',
    light: alpha('#E8002D', 0.3),
    dark: alpha('#E8002D', 0.8),
  },
  mercedes: {
    main: '#27F4D2',
    light: alpha('#27F4D2', 0.3),
    dark: alpha('#27F4D2', 0.8),
  },
  redBull: {
    main: '#3671C6',
    light: alpha('#3671C6', 0.3),
    dark: alpha('#3671C6', 0.8),
  },
  mclaren: {
    main: '#FF8000',
    light: alpha('#FF8000', 0.3),
    dark: alpha('#FF8000', 0.8),
  },
  astonMartin: {
    main: '#229971',
    light: alpha('#229971', 0.3),
    dark: alpha('#229971', 0.8),
  },
  alpine: {
    main: '#0093CC',
    light: alpha('#0093CC', 0.3),
    dark: alpha('#0093CC', 0.8),
  },
  williams: {
    main: '#64C4FF',
    light: alpha('#64C4FF', 0.3),
    dark: alpha('#64C4FF', 0.8),
  },
  rb: {
    main: '#6692FF',
    light: alpha('#6692FF', 0.3),
    dark: alpha('#6692FF', 0.8),
  },
  kickSauber: {
    main: '#52C41A',
    light: alpha('#52C41A', 0.3),
    dark: alpha('#52C41A', 0.8),
  },
  haas: {
    main: '#B6BABD',
    light: alpha('#B6BABD', 0.3),
    dark: alpha('#B6BABD', 0.8),
  },
};

export const f1Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: slipstreamColors.accent,
      light: slipstreamColors.light,
      dark: slipstreamColors.primary,
    },
    secondary: {
      main: slipstreamColors.tertiary,
      light: alpha(slipstreamColors.tertiary, 0.6),
      dark: alpha(slipstreamColors.tertiary, 0.8),
    },
    background: {
      default: slipstreamColors.primary,
      paper: alpha(slipstreamColors.surface, 0.8),
    },
    text: {
      primary: slipstreamColors.text.primary,
      secondary: slipstreamColors.text.secondary,
    },
    divider: alpha(slipstreamColors.border, 0.3),
    error: {
      main: f1Colors.ferrari.main,
    },
    warning: {
      main: f1Colors.mclaren.main,
    },
    info: {
      main: f1Colors.mercedes.main,
    },
    success: {
      main: f1Colors.astonMartin.main,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: slipstreamColors.gradients.hero,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha(slipstreamColors.surface, 0.7),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.3s ease',
        },
        contained: {
          background: slipstreamColors.gradients.accent,
          color: slipstreamColors.text.primary,
          border: `1px solid ${alpha(slipstreamColors.light, 0.3)}`,
          '&:hover': {
            background: slipstreamColors.gradients.secondary,
            transform: 'translateY(-1px)',
            boxShadow: `0 8px 32px ${alpha(slipstreamColors.accent, 0.3)}`,
          },
        },
        outlined: {
          borderColor: alpha(slipstreamColors.border, 0.6),
          color: slipstreamColors.text.secondary,
          backgroundColor: alpha(slipstreamColors.surface, 0.3),
          '&:hover': {
            backgroundColor: alpha(slipstreamColors.surface, 0.6),
            borderColor: alpha(slipstreamColors.light, 0.8),
            color: slipstreamColors.text.primary,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(slipstreamColors.surface, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
          '&:hover': {
            backgroundColor: alpha(slipstreamColors.surface, 0.8),
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha(slipstreamColors.surface, 0.6),
            backdropFilter: 'blur(10px)',
            '& fieldset': {
              borderColor: alpha(slipstreamColors.border, 0.5),
            },
            '&:hover fieldset': {
              borderColor: alpha(slipstreamColors.light, 0.7),
            },
            '&.Mui-focused fieldset': {
              borderColor: slipstreamColors.accent,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(slipstreamColors.surface, 0.5),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 40px ${alpha(slipstreamColors.primary, 0.4)}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(slipstreamColors.accent, 0.3),
          color: slipstreamColors.text.primary,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
          '&:hover': {
            backgroundColor: alpha(slipstreamColors.accent, 0.5),
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(slipstreamColors.primary, 0.95),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
        },
      },
    },
  },
});

export const getTeamColorByConstructor = (constructor: string) => {
  const colorMap: Record<string, typeof f1Colors.ferrari> = {
    'Ferrari': f1Colors.ferrari,
    'Mercedes': f1Colors.mercedes,
    'Red Bull Racing': f1Colors.redBull,
    'McLaren': f1Colors.mclaren,
    'Aston Martin': f1Colors.astonMartin,
    'Alpine': f1Colors.alpine,
    'Williams': f1Colors.williams,
    'RB': f1Colors.rb,
    'Kick Sauber': f1Colors.kickSauber,
    'Haas': f1Colors.haas,
  };
  return colorMap[constructor] || f1Colors.haas;
};