import {SESSION_CREATE_START} from '../../session/constants';

export const OPERATIONS_PROPS_LOAD_START = 'operationsProps/LOAD_START';
export const OPERATIONS_PROPS_LOAD_SUCCESS = 'operationsProps/LOAD_SUCCESS';

const initialState = {
    isFetching: false,
    error: null,
    isNeedReload: false
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case SESSION_CREATE_START:
            return {
                ...initialState,
                isNeedReload: true
            };
        case OPERATIONS_PROPS_LOAD_START:
            return {
                ...state,
                isFetching: true,
                error: null,
                isNeedReload: false
            };
        case OPERATIONS_PROPS_LOAD_SUCCESS:
            return {
                ...state,
                isFetching: false,
                error: null,
                isNeedReload: false
            };
        default:
            return state;
    }
};

export default reducer;