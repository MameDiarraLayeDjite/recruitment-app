import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Work,
  People,
  Schedule,
  Check,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_application':
        return <People color="primary" />;
      case 'status_update':
        return <Work color="info" />;
      case 'interview_scheduled':
        return <Schedule color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'new_application':
        return `Nouvelle candidature pour ${notification.payload.jobTitle}`;
      case 'status_update':
        return `Statut mis à jour: ${notification.payload.status}`;
      case 'interview_scheduled':
        return `Entretien programmé avec ${notification.payload.candidateName}`;
      default:
        return notification.type;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleMenuOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 440 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </Box>

        <Divider />

        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Aucune notification"
                secondary="Vous serez notifié des nouvelles activités"
              />
            </ListItem>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleMarkAsRead(notification._id)}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={getNotificationText(notification)}
                  secondary={new Date(notification.createdAt).toLocaleDateString()}
                />
                {!notification.read && (
                  <Check color="success" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))
          )}
        </List>

        {notifications.length > 5 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button size="small">
                Voir toutes les notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu;