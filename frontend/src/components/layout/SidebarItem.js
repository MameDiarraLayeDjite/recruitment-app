import React from 'react';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarItem = ({ text, icon, path }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === path;

  const handleClick = () => {
    navigate(path);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isActive}
        onClick={handleClick}
        sx={{
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'primary.dark',
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isActive ? 'white' : 'inherit',
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText primary={text} />
      </ListItemButton>
    </ListItem>
  );
};

export default SidebarItem;