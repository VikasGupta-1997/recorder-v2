import ReactSelect, { components, type ActionMeta } from 'react-select'
import { CameraInOptions, CameraOff, Mic, MicOff } from '~utils/Icons';

const customStyles = {
    menu: (provided) => ({
        ...provided,
        marginTop: 0, // Remove margin between menu and control
    }),
    control: (provided) => ({
        ...provided,
        border: '1px solid #E2E5ED', // Add custom border if needed
        boxShadow: 'none', // Remove box shadow
        borderRadius: '12px', // Make borders rounded (adjust as needed)
        height: '42px'
    }),
};

const GetIcon = ({ data }) => {
    if (data?.type === 'micRecording') {
        if (data?.disable) return <MicOff />
        else return <Mic />
    }
    if (data?.type === 'cameraRecording') {
        if (data?.disable) return <CameraOff />
        else return <CameraInOptions />
    }
}


const CustomSingleValue = (props) => {
    const { data } = props;

    return (
        <components.SingleValue {...props}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className='mr-2'><GetIcon data={data} /></span>
                {data.label}
            </div>
        </components.SingleValue>
    );
};

const CustomOption = (props) => {
    const { data, innerRef, innerProps } = props;

    return (
        <components.Option {...props} innerRef={innerRef} innerProps={innerProps}>
            <div className='flex items-center'>
                <span className='mr-2'><GetIcon data={data} /></span>
                {data.label}
            </div>
        </components.Option>
    );
};

interface ISelect {
    options: selectOption[],
    onChange: (newValue: selectOption | null, actionMeta: ActionMeta<selectOption>) => void,
    isSearchable?: boolean,
    value: selectOption,
    isDisabled?: boolean,
    isCamOnlyDisable?: boolean
}

const Select = ({ options, onChange, isSearchable, value, isDisabled, isCamOnlyDisable }: ISelect) => {
    let isDisabledT = false
    if (isDisabled) {
        isDisabledT = true
    }
    return (
        <ReactSelect
            className="basic-single cursor-pointer"
            classNamePrefix="select"
            defaultValue={options[0]}
            isSearchable={isSearchable}
            name="color"
            isDisabled={isDisabledT}
            options={options}
            onChange={onChange}
            value={value}
            components={{
                Option: CustomOption,
                SingleValue: CustomSingleValue,
                IndicatorSeparator: () => null
            }}
            styles={customStyles}
        />
    )
}

export default Select