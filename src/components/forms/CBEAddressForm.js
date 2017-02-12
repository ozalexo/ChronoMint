import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form/immutable';
import {TextField} from 'redux-form-material-ui'

const validate = values => {
    const errors = {};

    if (!values.get('address')) {
        errors.address = 'Required'
    } else if (!/^0x[0-9a-f]{40}$/i.test(values.get('address'))) {
        errors.address = 'Should be valid ethereum account address'
    }

    if (!values.get('name')) {
        errors.name = 'Required'
    } else if (values.get('name').length < 3) {
        errors.name = 'Member name should have length more than 3 symbols'
    }

    return errors;
};

class CBEAddressForm extends Component {
    render() {
        const {handleSubmit} = this.props;
        return (
            <form onSubmit={handleSubmit}>
                <Field component={TextField}
                       name="address"
                       style={{width: '100%'}}
                       floatingLabelText="Ethereum account"
                />
                <Field component={TextField}
                       name="name"
                       style={{width: '100%'}}
                       floatingLabelText="Member name"
                />
            </form>
        );
    }
}

CBEAddressForm = reduxForm({
        form: 'CBEAddressForm',
        validate,
    },
)(CBEAddressForm);

export default CBEAddressForm;