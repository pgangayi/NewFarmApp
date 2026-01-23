import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Popover,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Search,
  Notifications,
  Settings,
  Logout,
  AccountCircle,
  Agriculture,
  LocationOn,
  Add,
  BarChart,
  ExpandMore,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/AuthContext';
import GlobalSearch from '../GlobalSearch';

interface Farm {
  id: string;
  name: string;
  location?: string;
}

interface HeaderProps {
  farms?: Farm[];
  currentFarm?: Farm;
  onFarmChange?: (farmId: string) => void;
  onAddCrop?: () => void;
}

export const ModernHeader: React.FC<HeaderProps> = ({
  farms = [],
  currentFarm,
  onFarmChange,
  onAddCrop,
}) => {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [farmAnchorEl, setFarmAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFarmMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFarmAnchorEl(event.currentTarget);
  };

  const handleFarmMenuClose = () => {
    setFarmAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut();
    handleUserMenuClose();
  };

  const handleFarmSelect = (farm: Farm) => {
    onFarmChange?.(farm.id);
    handleFarmMenuClose();
  };

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {/* Logo Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0, mr: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                <Agriculture />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  FarmManager
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Professional Farm Management
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Farm Selector */}
          {farms.length > 0 && (
            <Box sx={{ flexGrow: 0, mr: 3 }}>
              <Button
                onClick={handleFarmMenuOpen}
                variant="outlined"
                size="small"
                endIcon={<ExpandMore />}
                sx={{ textTransform: 'none', minWidth: 200 }}
              >
                <Box sx={{ textAlign: 'left', mr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {currentFarm?.name || 'Select Farm'}
                  </Typography>
                  {currentFarm?.location && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <LocationOn sx={{ fontSize: 12, mr: 0.5 }} />
                      {currentFarm.location}
                    </Typography>
                  )}
                </Box>
              </Button>

              <Popover
                open={Boolean(farmAnchorEl)}
                anchorEl={farmAnchorEl}
                onClose={handleFarmMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: { width: 320, maxHeight: 400 },
                }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Select Farm
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Choose a farm to manage
                  </Typography>
                </Box>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {farms.map(farm => (
                    <ListItem key={farm.id} disablePadding>
                      <ListItemButton onClick={() => handleFarmSelect(farm)}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                            <Agriculture sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={farm.name}
                          secondary={
                            farm.location ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ fontSize: 12, mr: 0.5 }} />
                                {farm.location}
                              </Box>
                            ) : null
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Popover>
            </Box>
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Quick Actions - Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Search />}
              onClick={() => setShowGlobalSearch(true)}
            >
              Search
            </Button>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={onAddCrop}>
              Add Crop
            </Button>
            <Button variant="text" size="small" startIcon={<BarChart />}>
              Reports
            </Button>
          </Box>

          {/* Mobile Search */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}>
            <IconButton onClick={() => setShowGlobalSearch(true)}>
              <Search />
            </IconButton>
          </Box>

          {/* Notifications */}
          <Box sx={{ mr: 1 }}>
            <IconButton onClick={handleNotificationMenuOpen}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Popover
              open={Boolean(notificationAnchorEl)}
              anchorEl={notificationAnchorEl}
              onClose={handleNotificationMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: { width: 320, maxHeight: 400 },
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Notifications
                </Typography>
              </Box>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                <ListItem>
                  <ListItemText
                    primary="Low stock alert"
                    secondary="Fertilizer inventory is running low"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip label="Urgent" color="error" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Task due soon"
                    secondary="Irrigation scheduled for tomorrow"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip label="Reminder" color="warning" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Weather alert"
                    secondary="Heavy rain expected in 2 days"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip label="Weather" color="info" size="small" />
                </ListItem>
              </List>
            </Popover>
          </Box>

          {/* User Menu */}
          <Box>
            <Button
              onClick={handleUserMenuOpen}
              variant="outlined"
              size="small"
              startIcon={
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                  <AccountCircle sx={{ fontSize: 16 }} />
                </Avatar>
              }
              endIcon={<ExpandMore />}
              sx={{ textTransform: 'none', minWidth: 160 }}
            >
              <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: { width: 200 },
              }}
            >
              <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sign out</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        currentFarmId={currentFarm ? parseInt(currentFarm.id) : undefined}
      />
    </>
  );
};

export default ModernHeader;
