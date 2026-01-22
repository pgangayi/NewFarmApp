import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Avatar,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocationOn,
  Grass,
  CheckCircle,
  Inventory,
  Group,
  Agriculture,
  AttachMoney,
  TrendingUp,
  BarChart,
  Storage,
  Wifi,
  Smartphone,
  LocalFlorist,
  Favorite,
  Settings,
  Download,
} from '@mui/icons-material';

const PRIMARY_ACCENT = 'primary.main';
const TEXT_PRIMARY = 'text.primary';

export function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <LocationOn />,
      title: 'Farm Management',
      description:
        'Organize and monitor multiple farms with detailed mapping, location tracking, and comprehensive farm data management.',
    },
    {
      icon: <LocalFlorist />,
      title: 'Field Management',
      description:
        'Track field details, soil analysis, crop planning, irrigation systems, and field-specific activities with precision.',
    },
    {
      icon: <Favorite />,
      title: 'Livestock Management',
      description:
        'Keep detailed records of your livestock, health treatments, breeding cycles, pedigree tracking, and production monitoring.',
    },
    {
      icon: <Grass />,
      title: 'Crop Management',
      description:
        'Plan crop cycles, track growth stages, manage activities, record observations, and monitor yields for optimal productivity.',
    },
    {
      icon: <CheckCircle />,
      title: 'Task Management',
      description:
        'Schedule and track farm tasks, assign responsibilities, monitor progress, and ensure timely completion of agricultural activities.',
    },
    {
      icon: <Inventory />,
      title: 'Inventory Control',
      description:
        'Track supplies, equipment, and resources with real-time inventory management, low stock alerts, and automated reorder points.',
    },
    {
      icon: <AttachMoney />,
      title: 'Financial Management',
      description:
        'Track income, expenses, budgets, and profitability with comprehensive financial reporting and analytics tools.',
    },
    {
      icon: <Storage />,
      title: 'Smart Data Import/Export',
      description:
        'Seamlessly import data from CSV files with intelligent field mapping, validation, and export capabilities for easy data management.',
    },
    {
      icon: <Group />,
      title: 'Team Collaboration',
      description:
        'Coordinate with your team, assign roles, manage permissions, and work together efficiently on farm operations.',
    },
    {
      icon: <Wifi />,
      title: 'Offline Support',
      description:
        'Work seamlessly even without internet connection with our PWA technology. Sync data when connection is restored.',
    },
    {
      icon: <Smartphone />,
      title: 'Mobile Optimized',
      description:
        'Access your farm data from anywhere with our responsive design. Works perfectly on tablets and smartphones.',
    },
    {
      icon: <BarChart />,
      title: 'Analytics & Reports',
      description:
        'Get insights into your farm operations with detailed analytics, customizable reports, and data-driven decision making.',
    },
  ];

  const keyFeatures = [
    {
      icon: <Download />,
      title: 'Easy Data Migration',
      description:
        'Import your existing data seamlessly with our smart CSV import system that automatically maps fields and validates data.',
    },
    {
      icon: <TrendingUp />,
      title: 'Boost Productivity',
      description:
        'Streamline your workflows with intelligent task management, automated reminders, and efficient resource allocation.',
    },
    {
      icon: <Settings />,
      title: 'Customizable & Flexible',
      description:
        'Adapt the system to your specific farming needs with customizable fields, workflows, and reporting options.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: PRIMARY_ACCENT, width: 40, height: 40 }}>
                <Agriculture />
              </Avatar>
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 600, color: TEXT_PRIMARY }}
              >
                Farmers Boot
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ color: TEXT_PRIMARY }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/signup')}
                sx={{ bgcolor: 'grey.900', '&:hover': { bgcolor: 'grey.800' } }}
              >
                Get Started
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box textAlign="center">
          <Typography
            variant={isMobile ? 'h3' : 'h2'}
            component="h1"
            sx={{ fontWeight: 700, mb: 3, color: TEXT_PRIMARY }}
          >
            Welcome to Farmers Boot
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
            A comprehensive farm management platform designed to streamline your agricultural
            operations. Manage farms, fields, animals, crops, tasks, inventory, and finances all in
            one place.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                px: 4,
                py: 2,
                bgcolor: 'grey.900',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ px: 4, py: 2 }}
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h4"
          component="h2"
          textAlign="center"
          sx={{ fontWeight: 600, mb: 6, color: TEXT_PRIMARY }}
        >
          Complete Farm Management Solution for Farmers
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: PRIMARY_ACCENT,
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: TEXT_PRIMARY }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Key Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            sx={{ fontWeight: 600, mb: 6, color: TEXT_PRIMARY }}
          >
            Why Choose Farmers Boot?
          </Typography>
          <Grid container spacing={4}>
            {keyFeatures.map((feature, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      bgcolor: PRIMARY_ACCENT,
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: TEXT_PRIMARY }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box textAlign="center">
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 600, mb: 3, color: TEXT_PRIMARY }}
          >
            Ready to Transform Your Farm Management?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
            Join thousands of farmers who have already streamlined their operations with Farmers
            Boot.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              px: 4,
              py: 2,
              bgcolor: 'grey.900',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            Get Started Today
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: PRIMARY_ACCENT, width: 32, height: 32 }}>
                  <Agriculture fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_PRIMARY }}>
                  Farmers Boot
                </Typography>
              </Stack>
              <Typography color="text.secondary">
                Comprehensive farm management solution for modern agriculture.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: TEXT_PRIMARY }}>
                Features
              </Typography>
              <Stack spacing={2}>
                {[
                  'Farm & Field Management',
                  'Livestock Tracking',
                  'Crop Management',
                  'Financial Analytics',
                ].map(item => (
                  <Typography
                    key={item}
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { color: PRIMARY_ACCENT } }}
                  >
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: TEXT_PRIMARY }}>
                Support
              </Typography>
              <Stack spacing={2}>
                {['Documentation', 'Help Center', 'Contact Support', 'Community Forum'].map(
                  item => (
                    <Typography
                      key={item}
                      color="text.secondary"
                      sx={{ cursor: 'pointer', '&:hover': { color: PRIMARY_ACCENT } }}
                    >
                      {item}
                    </Typography>
                  )
                )}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: TEXT_PRIMARY }}>
                Company
              </Typography>
              <Stack spacing={2}>
                {['About Us', 'Careers', 'Press', 'Blog'].map(item => (
                  <Typography
                    key={item}
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { color: PRIMARY_ACCENT } }}
                  >
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Typography textAlign="center" color="text.secondary">
            © 2025 Farmers Boot. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
