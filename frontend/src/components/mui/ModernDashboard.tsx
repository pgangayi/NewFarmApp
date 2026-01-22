import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Agriculture,
  Inventory,
  ShoppingCart,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  MoreVert,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';

interface DashboardStats {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface TaskItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string;
  progress: number;
}

export const ModernDashboard: React.FC = () => {
  const stats: DashboardStats[] = [
    {
      title: 'Total Crops',
      value: '24',
      change: 12.5,
      icon: <Agriculture />,
      color: 'success',
    },
    {
      title: 'Inventory Items',
      value: '156',
      change: -3.2,
      icon: <Inventory />,
      color: 'warning',
    },
    {
      title: 'Active Orders',
      value: '8',
      change: 25.0,
      icon: <ShoppingCart />,
      color: 'info',
    },
    {
      title: 'Revenue',
      value: '$45,280',
      change: 18.7,
      icon: <Assessment />,
      color: 'success',
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'Irrigation',
      description: 'Field A irrigation completed',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      id: '2',
      type: 'Planting',
      description: 'Corn planting in Field B',
      time: '4 hours ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'Fertilizer',
      description: 'Fertilizer application scheduled',
      time: '6 hours ago',
      status: 'pending',
    },
    {
      id: '4',
      type: 'Harvest',
      description: 'Wheat harvest overdue',
      time: '1 day ago',
      status: 'overdue',
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: '1',
      title: 'Check soil moisture levels',
      priority: 'high',
      dueDate: 'Today',
      assignee: 'John Doe',
      progress: 75,
    },
    {
      id: '2',
      title: 'Order new seeds',
      priority: 'medium',
      dueDate: 'Tomorrow',
      assignee: 'Jane Smith',
      progress: 30,
    },
    {
      id: '3',
      title: 'Maintain irrigation system',
      priority: 'low',
      dueDate: 'Next Week',
      assignee: 'Mike Johnson',
      progress: 0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Farm Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's an overview of your farm operations.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stat.change > 0 ? (
                    <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                  )}
                  <Typography
                    variant="body2"
                    color={stat.change > 0 ? 'success.main' : 'error.main'}
                  >
                    {Math.abs(stat.change)}% from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activities
                </Typography>
                <Button size="small" variant="outlined">
                  View All
                </Button>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {recentActivities.map(activity => (
                  <Paper
                    key={activity.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: 'grey.50',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `${getStatusColor(activity.status)}.main`,
                        width: 32,
                        height: 32,
                        mr: 2,
                      }}
                    >
                      {activity.status === 'completed' && <CheckCircle />}
                      {activity.status === 'pending' && <Schedule />}
                      {activity.status === 'overdue' && <Warning />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.type} • {activity.time}
                      </Typography>
                    </Box>
                    <Chip
                      label={activity.status}
                      color={getStatusColor(activity.status)}
                      size="small"
                    />
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Active Tasks
                </Typography>
                <Button startIcon={<Add />} size="small" variant="outlined">
                  Add Task
                </Button>
              </Box>
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.assignee} • {task.dueDate}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={task.progress}
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="caption">{task.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Add />}
                    sx={{ p: 2, height: '100%' }}
                  >
                    Add New Crop
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ShoppingCart />}
                    sx={{ p: 2, height: '100%' }}
                  >
                    Create Order
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Assessment />}
                    sx={{ p: 2, height: '100%' }}
                  >
                    Generate Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Schedule />}
                    sx={{ p: 2, height: '100%' }}
                  >
                    Schedule Task
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModernDashboard;
