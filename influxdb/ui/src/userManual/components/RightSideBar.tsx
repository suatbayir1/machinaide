import React, { PureComponent } from "react";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import IconButton from '@material-ui/core/IconButton';
import { Link } from "react-router-dom";
import {
    Grid,
    Icon,
    IconFont,
} from '@influxdata/clockface'

const drawerWidth = 300;

const styles = theme => ({
    root: {
        display: "flex"
    },
    paper: {
        background: '#202028'
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    menuButton: {
        marginLeft: 12,
        marginRight: 36
    },
    menuButtonIconClosed: {
        transition: theme.transitions.create(["transform"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        transform: "rotate(0deg)"
    },
    menuButtonIconOpen: {
        transition: theme.transitions.create(["transform"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        transform: "rotate(180deg)"
    },
    hide: {
        display: "none"
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: "nowrap"
    },
    drawerOpen: {
        width: drawerWidth,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    drawerClose: {
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        overflowX: "hidden",
        width: theme.spacing.unit * 7 + 1,
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing.unit * 9 + 1
        }
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        marginTop: theme.spacing.unit,
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3
    },
    grow: {
        flexGrow: 1
    }
});

interface Props {
    orgID: string
    changeActivePage: (item) => void
}
interface State {
    open: boolean
    anchorEl: string
    openCollapse: boolean
    selectedLink: string
    linkList: object[]
}

class RightSideBar extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
            anchorEl: null,
            openCollapse: false,
            selectedLink: "Maintenance",
            linkList: [
                { id: 'maintenancePage', name: 'Maintenance', icon: IconFont.TextBlock },
                { id: 'failurePage', name: 'Failure', icon: IconFont.Capacitor },
                { id: 'deneme1', name: 'Deneme 1', icon: IconFont.Duplicate },
                { id: 'deneme2', name: 'Deneme 2', icon: IconFont.Erlenmeyer },
                { id: 'deneme3', name: 'Deneme 3', icon: IconFont.BarChart },
                { id: 'deneme4', name: 'Deneme 4', icon: IconFont.Bell },
            ],
        };
    }

    handleDrawerStatus = () => {
        this.setState({
            open: !this.state.open,
        })
    }

    handleChangeListItem = (item) => {
        this.props.changeActivePage(item);
        this.setState({ selectedLink: item["name"] });
    }

    render() {
        const { classes, theme } = this.props;
        const { anchorEl } = this.state;
        const open = Boolean(anchorEl);

        return (
            <Grid>
                <Drawer
                    variant="permanent"
                    className={classNames(classes.drawer, {
                        [classes.drawerOpen]: this.state.open,
                        [classes.drawerClose]: !this.state.open
                    })}
                    classes={{
                        paper: classNames({
                            [classes.drawerOpen]: this.state.open,
                            [classes.drawerClose]: !this.state.open,
                            [classes.paper]: this.state.open || !this.state.open
                        })
                    }}
                    anchor="right"
                    open={this.state.open}
                >
                    <div className={classes.drawerHeader}>
                        <IconButton onClick={this.handleDrawerStatus}>
                            {this.state.open ? <ChevronRightIcon style={{ color: '#a4a8b6' }} /> : <ChevronLeftIcon style={{ color: '#a4a8b6' }} />}
                        </IconButton>
                    </div>
                    <List>
                        {
                            this.state.linkList.map(item => (
                                <>
                                    <ListItem
                                        key={item["name"]}
                                        style={{
                                            color: this.state.selectedLink === item["name"] ? "#FFFFFF" : '#a4a8b6',
                                            backgroundColor: this.state.selectedLink === item["name"] ? "#066FC5" : "#202028"
                                        }}
                                        button
                                        onClick={() => { this.handleChangeListItem(item) }}
                                        classes={{ selected: 'red' }}
                                    >
                                        <ListItemIcon>
                                            <Icon style={{
                                                fontSize: '20px',
                                                color: this.state.selectedLink === item["name"] ? "#FFFFFF" : '#a4a8b6',
                                            }} glyph={item["icon"]} />
                                        </ListItemIcon>
                                        <ListItemText primary={item["name"]} />
                                    </ListItem>
                                    <Divider />
                                </>
                            ))
                        }
                    </List>
                </Drawer>
            </Grid>
        )
    }
}

export default withStyles(styles, { withTheme: true })(RightSideBar);