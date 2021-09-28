import * as React from 'react';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import isEqual from 'lodash/isEqual'
import 'src/ml/components/index.scss'

interface OwnProps {
  data: any[]
}

interface OwnState {
  data: any[]
}

export default class DropdownContainer extends React.Component<OwnProps, OwnState> {
  constructor(props){
    super(props)
    this.state = { data: props.data }
  }

  componentWillReceiveProps = (nextProps) => {
    if(!isEqual(nextProps.data, this.state.data)) {
      
      this.setState({ data: nextProps.data })
    }
  }

  shouldComponentUpdate = (nextProps) => {
    return !isEqual(nextProps.data, this.state.data)
  }

  render() {
    // const { data, ...rest } = this.props
    const {data, ...rest } = this.props
    // console.log(data, "trick")
    // const dd = 
    // console.log(data)
    return (
      <DropdownTreeSelect data={data} {...rest} />
    )
  }
}
