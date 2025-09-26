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
import SlipstreamLogo from '@/components/SlipstreamLogo';
import { f1Colors } from '@/theme/f1Theme';

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
    <Box
      sx={{
        height: '100vh',
        backgroundColor: 'background.default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed Navigation Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: alpha('#000000', 0.9),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
          zIndex: 1000,
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1, minHeight: '64px' }}>
          <SlipstreamLogo size="medium" />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
            }}
          >
            2025 F1 Season • AI-Powered Analytics
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha('#ffffff', 0.05),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha('#ffffff', 0.2),
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.3),
            },
          },
        }}
      >
        {/* Hero Section */}
        <HeroSection />

        {/* Main Content Section */}
        <Box
          id="main-content"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: { xs: 2, md: 4 },
          }}
        >
          <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                mb: 3,
                fontWeight: 600,
                background: `linear-gradient(45deg, ${f1Colors.ferrari.main}, ${f1Colors.mercedes.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                flexShrink: 0,
              }}
            >
              F1 Intelligence Hub
            </Typography>

            <Grid
              container
              spacing={3}
              sx={{
                flex: 1,
                minHeight: 0, // Important for flex children
                height: { xs: 'auto', md: 'calc(100vh - 200px)' },
                maxHeight: { xs: 'none', md: 'calc(100vh - 200px)' },
              }}
            >
              {/* AI Chat Assistant */}
              <Grid
                size={{ xs: 12, lg: 6 }}
                sx={{
                  display: 'flex',
                  minHeight: { xs: '60vh', md: 'auto' },
                }}
              >
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}>
                  <F1ChatBot />
                </Box>
              </Grid>

              {/* Race Predictions */}
              <Grid
                size={{ xs: 12, lg: 6 }}
                sx={{
                  display: 'flex',
                  minHeight: { xs: '60vh', md: 'auto' },
                }}
              >
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}>
                  <RacePredictionsPanel />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Footer Section */}
        <Box
          sx={{
            py: 3,
            px: { xs: 2, md: 0 },
          }}
        >
          <Container maxWidth="xl">
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: alpha('#1a1a1a', 0.3),
                border: `1px solid ${alpha('#ffffff', 0.1)}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Powered by advanced machine learning models trained on historical F1 data
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                Live data integration with OpenF1 API • Real-time predictions • 2025 Season Ready
              </Typography>
            </Paper>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}