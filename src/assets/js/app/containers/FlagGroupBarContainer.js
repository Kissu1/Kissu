import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import FlagGroupBar from '../components/FlagGroupBar';
import { setFlagGroupOptions } from '../redux/modules/flagGroup';

const mapStateToProps = state => ({
    options: state.flagGroup
});

const matchDispatchToProps = dispatch => bindActionCreators({
    setOptions: setFlagGroupOptions
}, dispatch);

export default connect(mapStateToProps, matchDispatchToProps)(FlagGroupBar);