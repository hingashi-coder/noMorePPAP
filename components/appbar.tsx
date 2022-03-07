import {
  AppBar, Divider,
  Drawer,
  IconButton, Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import {useEffect, useState} from "react";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

export default function Appbar() {
  const [drawerStatus, setDrawer] = useState(false)
  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{mr: 2}}
            onClick={() => {
              setDrawer(true)
            }}
          >
            <MenuIcon/>
          </IconButton>
          <Link underline="none" color="white" href={"/"}>
            <Typography variant="h6" color="inherit" component="div">
              No More PPAP
            </Typography>
          </Link>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerStatus}
        onClose={() => {
          setDrawer(false)
        }}
      >
        <Box
          sx={{width: 250}}
          role="presentation"
        >
          <Divider/>
          <List>
            <Link underline="none" color="gray" href={"/encrypt"}>
              <ListItem button>
                <ListItemIcon>
                  <LockIcon/>
                </ListItemIcon>

                <ListItemText primary="暗号化"/>

              </ListItem>
            </Link>
            <Link underline="none" color="gray" href={"/decrypt"}>
              <ListItem button>
                <ListItemIcon>
                  <LockOpenIcon/>
                </ListItemIcon>
                <ListItemText primary="複合化"/>
              </ListItem>
            </Link>
            <Link underline="none" color="gray" href={"/keygen"}>
              <ListItem button>
                <ListItemIcon>
                  <RocketLaunchIcon/>
                </ListItemIcon>
                <ListItemText primary="暗号化キー生成"/>
              </ListItem>
            </Link>
          </List>
        </Box>
      </Drawer>
    </>
  )
}
