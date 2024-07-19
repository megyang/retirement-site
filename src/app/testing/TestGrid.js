"use client";
import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';

const TestGrid = () => {
    const [rows, setRows] = useState([
        { id: 1, year2024: 100, year2025: 200 },
        { id: 2, year2024: 300, year2025: 400 },
    ]);

    const columns = [
        { field: 'id', headerName: 'ID', width: 100, editable: false },
        { field: 'year2024', headerName: '2024', width: 150, editable: true },
        { field: 'year2025', headerName: '2025', width: 150, editable: true },
    ];

    const handleEditCommit = (params) => {
        console.log("Cell edited:", params);
    };

    return (
        <div style={{ height: 300, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                pageSize={5}
                onCellEditCommit={handleEditCommit}
            />
        </div>
    );
};

export default TestGrid;
