// Libraries
import React, { PureComponent, ChangeEvent } from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { connect, ConnectedProps } from 'react-redux'
import { get } from 'lodash'

// Components
import { Form, Input, Button, Grid } from '@influxdata/clockface'

// APIs
import { postSignin } from 'src/client'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'
import { getDTThunk } from 'src/dt/actions/dtActions';

// Services
import LoginService from 'src/onboarding/services/LoginService';

// Constants
import * as copy from 'src/shared/copy/notifications'

// Types
import { Links } from 'src/types/links'
import { AppState } from 'src/types'
import {
  Columns,
  InputType,
  ButtonType,
  ComponentSize,
  ComponentColor,
} from '@influxdata/clockface'

// Decorators
import { ErrorHandling } from 'src/shared/decorators/errors'

export interface OwnProps {
  links: Links
  notify: typeof notifyAction
}

interface State {
  username: string
  password: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

@ErrorHandling
class SigninForm extends PureComponent<Props, State> {
  public state: State = {
    username: '',
    password: '',
  }

  public render() {
    const { username, password } = this.state
    return (
      <Form onSubmit={this.handleSignIn}>
        <Grid>
          <Grid.Row>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Username">
                <Input
                  name="username"
                  value={username}
                  onChange={this.handleUsername}
                  size={ComponentSize.Medium}
                  autoFocus={true}
                  testID="username"
                />
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Password">
                <Input
                  name="password"
                  value={password}
                  onChange={this.handlePassword}
                  size={ComponentSize.Medium}
                  type={InputType.Password}
                  testID="password"
                />
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Footer>
                <Button
                  color={ComponentColor.Primary}
                  text="Sign In"
                  size={ComponentSize.Medium}
                  type={ButtonType.Submit}
                />
              </Form.Footer>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Form>
    )
  }

  private handleUsername = (e: ChangeEvent<HTMLInputElement>): void => {
    const username = e.target.value
    this.setState({ username })
  }
  private handlePassword = (e: ChangeEvent<HTMLInputElement>): void => {
    const password = e.target.value
    this.setState({ password })
  }

  private handleSignIn = async (): Promise<void> => {
    const { notify } = this.props
    const { username, password } = this.state
    const { INFLUX_USERNAME, INFLUX_PASSWORD } = process.env;

    try {
      const tokenResp = await LoginService.loginWithLDAP({ username, password });

      if (!tokenResp) {
        notify({
          ...copy.SigninError,
          message: 'Login failed: username or password is invalid',
        })
        return;
      }
      
      const resp = await postSignin({ auth: { username: INFLUX_USERNAME, password: INFLUX_PASSWORD } })

      localStorage.setItem("userRole", tokenResp[0]["role"]);
      localStorage.setItem("token", tokenResp[0]["token"]);
      localStorage.setItem("userInfo", JSON.stringify(tokenResp[0]["userInfo"]));

      if (resp.status !== 204) {
        throw new Error(resp.data.message)
      }

      this.props.getDTThunk();
      this.handleRedirect();
    } catch (error) {
      const message = get(error, 'response.data.msg', '')
      const status = get(error, 'response.status', '')

      if (status === 401) {
        notify({
          ...copy.SigninError,
          message: 'Login failed: username or password is invalid',
        })
        return
      }

      if (!message) {
        notify(copy.SigninError)
        return
      }

      notify({ ...copy.SigninError, message })
    }
  }

  private handleRedirect() {
    const { history, location } = this.props
    const params = new URLSearchParams(location.search)
    const returnTo = params.get('returnTo')

    if (returnTo) {
      history.replace(returnTo)
    } else {
      history.push('/')
    }
  }
}

const mstp = ({ links }: AppState) => ({
  links,
})

const mdtp = {
  notify: notifyAction,
  getDTThunk: getDTThunk,
}

const connector = connect(mstp, mdtp)

export default connector(withRouter(SigninForm))
