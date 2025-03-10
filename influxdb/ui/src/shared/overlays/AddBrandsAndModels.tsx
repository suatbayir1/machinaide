// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Input, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
    SelectDropdown, DapperScrollbars, Table, BorderType, ComponentSize, ConfirmationButton,
    FlexBox, Appearance, Panel,
} from '@influxdata/clockface'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    pleaseFillInTheFormCompletely,
    addBrandSuccessfully,
    addBrandFailure,
    deleteBrandSuccessfully,
    deleteBrandFailure,
} from 'src/shared/copy/notifications'

// Services
import BrandService from "src/shared/services/BrandService";

interface OwnProps {
    visible: boolean
    onDismiss: () => void
    selectedPart: object
    brands: object[]
    getBrands: () => void
}

interface State {
    brandName: string
    modelName: string
    price: string
    country: string
    countryList: string[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

class AddBrandsAndModels extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            brandName: "",
            modelName: "",
            price: "",
            country: "Select Country",
            countryList: ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Anguilla", "Antigua & Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas"
                , "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia & Herzegovina", "Botswana", "Brazil", "British Virgin Islands"
                , "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Cape Verde", "Cayman Islands", "Chad", "Chile", "China", "Colombia", "Congo", "Cook Islands", "Costa Rica"
                , "Cote D Ivoire", "Croatia", "Cruise Ship", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea"
                , "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Polynesia", "French West Indies", "Gabon", "Gambia", "Georgia", "Germany", "Ghana"
                , "Gibraltar", "Greece", "Greenland", "Grenada", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India"
                , "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyz Republic", "Laos", "Latvia"
                , "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania"
                , "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Namibia", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia"
                , "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal"
                , "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Saint Pierre & Miquelon", "Samoa", "San Marino", "Satellite", "Saudi Arabia", "Senegal", "Serbia", "Seychelles"
                , "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "St Kitts & Nevis", "St Lucia", "St Vincent", "St. Lucia", "Sudan"
                , "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor L'Este", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia"
                , "Turkey", "Turkmenistan", "Turks & Caicos", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Virgin Islands (US)"
                , "Yemen", "Zambia", "Zimbabwe"],
        };
    }

    validate = () => {
        const { brandName, modelName, price, country } = this.state;

        if (brandName.trim() === "" || modelName.trim() === "" || price.trim() === "" || country.trim() === "Select Country") {
            this.props.notify(pleaseFillInTheFormCompletely("Brand Name, Model Name, Price and Country"));
            return false;
        }

        return true;
    }

    add = async () => {
        const { brandName, modelName, price, country } = this.state;
        const { selectedPart, getBrands } = this.props;

        if (this.validate()) {
            const payload = {
                brandName,
                modelName,
                price,
                country,
                "type": selectedPart["type"],
            }

            const result = await BrandService.add(payload);

            if (result.success) {
                this.props.notify(addBrandSuccessfully(result.message.text));
                getBrands();
            } else {
                this.props.notify(addBrandFailure(result.message.text));
            }
        }
    }

    delete = async (brand) => {
        const { notify, getBrands } = this.props;

        const payload = {
            "brandId": brand
        }

        const result = await BrandService.delete(payload);

        if (result.success) {
            notify(deleteBrandSuccessfully(result.message.text));
            getBrands();
        } else {
            notify(deleteBrandFailure(result.message.text));
        }
    }

    render() {
        const { visible, onDismiss, brands } = this.props;
        const { brandName, modelName, price, country, countryList } = this.state;

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={"Add Brand & Model"}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element label="Brand Name" required={true}>
                                            <Input
                                                onChange={(e) => { this.setState({ brandName: e.target.value }) }}
                                                value={brandName}
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element label="Model Name" required={true}>
                                            <Input
                                                onChange={(e) => { this.setState({ modelName: e.target.value }) }}
                                                value={modelName}
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element label="Price" required={true}>
                                            <Input
                                                onChange={(e) => { this.setState({ price: e.target.value }) }}
                                                value={price}
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element label="The Place of Production" required={true}>
                                            <SelectDropdown
                                                options={countryList}
                                                selectedOption={country}
                                                onSelect={(e) => this.setState({ country: e })}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row>
                                    <div style={{ float: 'right' }}>
                                        {
                                            <Button
                                                style={{ marginRight: '8px' }}
                                                text="Add"
                                                icon={IconFont.Plus}
                                                onClick={this.add}
                                                type={ButtonType.Button}
                                                color={ComponentColor.Primary}
                                            />
                                        }
                                    </div>
                                </Grid.Row>

                                <Grid.Row>
                                    <h6>Brands & Models</h6>
                                    {
                                        brands.length > 0 ? (
                                            <Panel>
                                                <DapperScrollbars
                                                    autoHide={false}
                                                    autoSizeHeight={true}
                                                    style={{ maxHeight: '300px' }}
                                                    className="data-loading--scroll-content"
                                                >
                                                    <Table
                                                        borders={BorderType.Vertical}
                                                        fontSize={ComponentSize.ExtraSmall}
                                                        cellPadding={ComponentSize.ExtraSmall}
                                                    >
                                                        <Table.Header>
                                                            <Table.Row>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Brand Name</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Model Name</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Country</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Price</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                                            </Table.Row>
                                                        </Table.Header>
                                                        <Table.Body>
                                                            {
                                                                brands.map(row => {
                                                                    let recordId = row["_id"]["$oid"];
                                                                    return (
                                                                        <Table.Row key={recordId}>
                                                                            <Table.Cell>{row["brandName"]}</Table.Cell>
                                                                            <Table.Cell>{row["modelName"]}</Table.Cell>
                                                                            <Table.Cell>{row["country"]}</Table.Cell>
                                                                            <Table.Cell>{row["price"]}</Table.Cell>
                                                                            <Table.Cell>
                                                                                <FlexBox margin={ComponentSize.Medium} >
                                                                                    <ConfirmationButton
                                                                                        icon={IconFont.Remove}
                                                                                        onConfirm={() => { this.delete(recordId) }}
                                                                                        text={""}
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        popoverColor={ComponentColor.Danger}
                                                                                        popoverAppearance={Appearance.Outline}
                                                                                        color={ComponentColor.Danger}
                                                                                        confirmationLabel="Do you want to delete ?"
                                                                                        confirmationButtonColor={ComponentColor.Danger}
                                                                                        confirmationButtonText="Yes"
                                                                                    />
                                                                                </FlexBox>
                                                                            </Table.Cell>
                                                                        </Table.Row>
                                                                    )
                                                                })
                                                            }
                                                        </Table.Body>
                                                    </Table>
                                                </DapperScrollbars>
                                            </Panel>
                                        ) : (
                                            <p>No previously created brand and model records found.</p>
                                        )
                                    }
                                </Grid.Row>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay >
            </>
        );
    }
}


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(AddBrandsAndModels);
