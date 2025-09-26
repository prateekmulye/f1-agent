import { createTheme, alpha } from '@mui/material/styles';

// F1 Team Colors with Alpha Variants
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
      main: f1Colors.ferrari.main,
      light: f1Colors.ferrari.light,
      dark: f1Colors.ferrari.dark,
    },
    secondary: {
      main: f1Colors.mercedes.main,
      light: f1Colors.mercedes.light,
      dark: f1Colors.mercedes.dark,
    },
    background: {
      default: '#000000',
      paper: alpha('#1a1a1a', 0.8),
    },
    text: {
      primary: '#ffffff',
      secondary: alpha('#ffffff', 0.7),
    },
    divider: alpha('#ffffff', 0.1),
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
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#1a1a1a', 0.6),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#ffffff', 0.2)}`,
        },
        contained: {
          backgroundColor: alpha('#E8002D', 0.2),
          color: '#ffffff',
          '&:hover': {
            backgroundColor: alpha('#E8002D', 0.4),
          },
        },
        outlined: {
          borderColor: alpha('#ffffff', 0.3),
          color: '#ffffff',
          '&:hover': {
            backgroundColor: alpha('#ffffff', 0.05),
            borderColor: alpha('#ffffff', 0.5),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#ffffff', 0.05),
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: alpha('#ffffff', 0.1),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#1a1a1a', 0.4),
            backdropFilter: 'blur(10px)',
            '& fieldset': {
              borderColor: alpha('#ffffff', 0.2),
            },
            '&:hover fieldset': {
              borderColor: alpha('#ffffff', 0.4),
            },
            '&.Mui-focused fieldset': {
              borderColor: f1Colors.ferrari.main,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#1a1a1a', 0.4),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#ffffff', 0.1),
          color: '#ffffff',
          backdropFilter: 'blur(10px)',
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