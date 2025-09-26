'use client';
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
} from '@mui/material';
import F1ChatBot from '@/components/F1ChatBot';
import RacePredictionsPanel from '@/components/RacePredictionsPanel';
import RaceCalendar from '@/components/RaceCalendar';
import SlipstreamLogo from '@/components/SlipstreamLogo';
import { f1Colors, slipstreamColors } from '@/theme/f1Theme';

function HeroSection() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha('#000000', 0.95)} 0%, ${alpha('#1a1a1a', 0.8)} 50%, ${alpha('#000000', 0.95)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${alpha(f1Colors.ferrari.main, 0.15)} 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${alpha(f1Colors.mercedes.main, 0.12)} 0%, transparent 50%),
                       radial-gradient(circle at 40% 80%, ${alpha(f1Colors.mclaren.main, 0.08)} 0%, transparent 50%)`,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <SlipstreamLogo size="large" />
        </Box>

        <Typography
          variant="h2"
          sx={{
            color: 'text.primary',
            fontWeight: 600,
            mb: 3,
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            opacity: 0.95,
          }}
        >
          Formula 1 AI Intelligence Platform
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            fontWeight: 400,
            maxWidth: '600px',
            mx: 'auto',
            mb: 5,
            lineHeight: 1.6,
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          Advanced AI-powered predictions and real-time race analytics for the 2025 F1 season
        </Typography>

        {/* Stats */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 3, md: 6 },
            flexWrap: 'wrap',
            mb: 4,
          }}
        >
          {[
            { value: '2025', label: 'Season' },
            { value: '24', label: 'Races' },
            { value: '20', label: 'Drivers' },
            { value: '10', label: 'Teams' },
          ].map((stat, index) => (
            <Box key={index} sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  color: f1Colors.ferrari.main,
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Scroll indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            animation: 'bounce 2s infinite',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateX(-50%) translateY(0)',
              },
              '40%': {
                transform: 'translateX(-50%) translateY(-10px)',
              },
              '60%': {
                transform: 'translateX(-50%) translateY(-5px)',
              },
            },
          }}
          onClick={() => {
            document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
            Explore Features
          </Typography>
          <Box
            sx={{
              width: 2,
              height: 20,
              background: `linear-gradient(to bottom, ${f1Colors.ferrari.main}, transparent)`,
              mx: 'auto',
            }}
          />
        </Box>
      </Container>
    </Box>
  );
}


export default function HomePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Fixed Navigation Bar */}
      <AppBar
        position="sticky"
        top={0}
        elevation={0}
        sx={{
          backgroundColor: alpha(slipstreamColors.primary, 0.95),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <SlipstreamLogo size="medium" color="white" />
          <Typography
            variant="body2"
            sx={{
              color: slipstreamColors.text.secondary,
              fontSize: '0.85rem',
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            2025 F1 Season • AI Analytics
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Compact Hero Section */}
      <Box
        sx={{
          minHeight: { xs: '50vh', md: '60vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: slipstreamColors.gradients.hero,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 40%, ${alpha(slipstreamColors.accent, 0.4)} 0%, transparent 60%),
                         radial-gradient(circle at 70% 60%, ${alpha(slipstreamColors.tertiary, 0.3)} 0%, transparent 50%),
                         radial-gradient(circle at 50% 20%, ${alpha(slipstreamColors.light, 0.2)} 0%, transparent 40%)`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, ${alpha(slipstreamColors.primary, 0.1)} 0%, transparent 50%)`,
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <SlipstreamLogo size="xlarge" />
          </Box>
          <Typography
            variant="h3"
            sx={{
              color: slipstreamColors.text.primary,
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Formula 1 AI Intelligence Platform
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: slipstreamColors.text.secondary,
              maxWidth: '600px',
              mx: 'auto',
              mb: 4,
              fontSize: { xs: '1rem', md: '1.25rem' },
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Advanced AI predictions, real-time analytics, and comprehensive race insights for the 2025 Formula 1 season
          </Typography>

          {/* Improved Stats Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 4, md: 8 },
              flexWrap: 'wrap',
              mt: 4,
            }}
          >
            {[
              { value: '2025', label: 'Season', icon: '🏁' },
              { value: '24', label: 'Races', icon: '🏎️' },
              { value: '20', label: 'Drivers', icon: '👤' },
              { value: '10', label: 'Teams', icon: '🏢' },
            ].map((stat, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: 'center',
                  padding: 2,
                  backgroundColor: alpha(slipstreamColors.surface, 0.3),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
                  minWidth: '100px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    backgroundColor: alpha(slipstreamColors.surface, 0.5),
                  }
                }}
              >
                <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>
                  {stat.icon}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: slipstreamColors.text.primary,
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: { xs: '1.5rem', md: '2rem' },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: slipstreamColors.text.secondary,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            mb: 4,
            fontWeight: 700,
            background: slipstreamColors.gradients.accent,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '2.5rem' },
            letterSpacing: '-0.01em',
          }}
        >
          F1 Intelligence Hub
        </Typography>

        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          sx={{
            minHeight: { xs: 'auto', md: '70vh' },
          }}
        >
          {/* AI Chat Assistant */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{
              height: { xs: '50vh', md: '70vh' },
              minHeight: '400px',
            }}>
              <F1ChatBot />
            </Box>
          </Grid>

          {/* Race Predictions */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{
              height: { xs: '50vh', md: '70vh' },
              minHeight: '400px',
            }}>
              <RacePredictionsPanel />
            </Box>
          </Grid>
        </Grid>

        {/* Race Calendar Section */}
        <Box sx={{ mt: 6 }}>
          <RaceCalendar />
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 4, mt: 6 }}>
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: alpha(slipstreamColors.surface, 0.4),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(slipstreamColors.border, 0.3)}`,
              borderRadius: 3,
            }}
          >
            <SlipstreamLogo size="medium" variant="full" color="monochrome" />
            <Typography
              variant="body2"
              sx={{
                color: slipstreamColors.text.secondary,
                fontSize: '0.9rem',
                mt: 2,
                fontWeight: 500,
              }}
            >
              Powered by ML models • OpenF1 API • 2025 Season Ready
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: slipstreamColors.text.muted,
                fontSize: '0.75rem',
                mt: 1,
              }}
            >
              © 2025 Slipstream. Formula 1 data analysis and AI predictions.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}