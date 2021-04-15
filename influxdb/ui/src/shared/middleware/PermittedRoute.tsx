import React from 'react'
import { Redirect, Route } from 'react-router-dom'

const PrivateRoute = ({ component: Component, allowedRoles: allowedRoles, ...rest }) => {
    const isPermitted = allowedRoles.includes(window.localStorage.getItem("userRole")) ? true : false;

    return (
        <Route
            {...rest}
            render={props =>
                isPermitted ? (
                    <Component {...props} />
                ) : (
                        <Redirect to={{ pathname: 'errors/401', state: { from: props.location } }} />
                    )
            }
        />
    )
}

export default PrivateRoute;