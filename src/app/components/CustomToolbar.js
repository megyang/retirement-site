import React from 'react';
import { GridToolbarContainer, GridToolbarExport, GridToolbarDensitySelector, GridToolbarColumnsButton, GridToolbarFilterButton } from '@mui/x-data-grid';

const CustomToolbar = ({ onMultiEdit, onRowEdit }) => {
    return (
        <GridToolbarContainer>
            {/*<GridToolbarColumnsButton/>
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector slotProps={{tooltip: {title: 'Change density'}}} />
            */}

            <button
                onClick={onMultiEdit}
                style={{
                    marginLeft: 8,
                    padding: '6px 16px',
                    background: '#e2785b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4
                }}
            >
                Edit Multiple Cells
            </button>
            <button
                onClick={onRowEdit}
                style={{
                    marginLeft: 8,
                    padding: '6px 16px',
                    background: '#e2785b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4
                }}
            >
                Edit Row
            </button>
            {/*<GridToolbarExport slotProps={{tooltip: {title: 'Export data'}, button: {variant: 'outlined'}}}/>
            */}
        </GridToolbarContainer>
    );
};

export default CustomToolbar;
