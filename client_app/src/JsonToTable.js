// src/JsonToTable.js
import React from 'react';
import { useTable } from 'react-table';
import { Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';

const JsonToTable = ({ data }) => {
  console.log(data)
  const columns = React.useMemo(
    () =>
      data
        ? Object.keys(data).map((key) => ({
            Header: key,
            accessor: key,
          }))
        : [],
    [data]
  );

  
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data: [data] });

  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map((headerGroup) => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <TableCell {...column.getHeaderProps()}>{column.render('Header')}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map((cell) => (
                <TableCell {...cell.getCellProps()}>{cell.render('Cell')}</TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default JsonToTable;
