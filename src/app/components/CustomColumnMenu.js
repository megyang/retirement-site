import React from 'react';

const CustomColumnMenu = (props) => {
    return (
        <div style={{ background: props.background }}>
            <div>Counter: {props.counter}</div>
            {/* Add more customizations as needed */}
        </div>
    );
};

export default CustomColumnMenu;
