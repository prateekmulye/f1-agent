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
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha('#000000', 0.9)} 0%, ${alpha('#1a1a1a', 0.8)} 50%, ${alpha('#000000', 0.9)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${alpha(f1Colors.ferrari.main, 0.1)} 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${alpha(f1Colors.mercedes.main, 0.08)} 0%, transparent 50%),
                       radial-gradient(circle at 40% 80%, ${alpha(f1Colors.mclaren.main, 0.06)} 0%, transparent 50%)`,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <SlipstreamLogo size="large" />
        </Box>
        <Typography
          variant="h2"
          sx={{
            color: 'text.primary',
            fontWeight: 600,
            mb: 3,
            fontSize: { xs: '1.5rem', md: '2rem' },
            opacity: 0.9,
          }}
        >
          Formula 1 AI Intelligence Platform
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'text.secondary',
            fontWeight: 400,
            maxWidth: '600px',
            mx: 'auto',
            mb: 6,
            lineHeight: 1.6,
          }}
        >
          Chat with our AI assistant for real-time predictions and explore detailed race analytics
          powered by advanced machine learning models.
        </Typography>

        {/* Stats */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
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
                }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}


export default function HomePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: alpha('#000000', 0.9),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
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

      <HeroSection />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            mb: 4,
            fontWeight: 600,
            background: `linear-gradient(45deg, ${f1Colors.ferrari.main}, ${f1Colors.mercedes.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '2.5rem' }
          }}
        >
          F1 Intelligence Hub
        </Typography>

        <Grid container spacing={3} sx={{ minHeight: { xs: 'auto', md: '700px' } }}>
          {/* AI Chat Assistant */}
          <Grid size={{ xs: 12, lg: 6 }} sx={{ display: 'flex' }}>
            <Box sx={{ flex: 1, minHeight: { xs: '500px', md: '700px' } }}>
              <F1ChatBot />
            </Box>
          </Grid>

          {/* Race Predictions */}
          <Grid size={{ xs: 12, lg: 6 }} sx={{ display: 'flex' }}>
            <Box sx={{ flex: 1, minHeight: { xs: '500px', md: '700px' } }}>
              <RacePredictionsPanel />
            </Box>
          </Grid>
        </Grid>

        {/* Footer Info */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
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
  );
}