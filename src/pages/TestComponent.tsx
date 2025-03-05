/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// TypeScript interfaces
interface SortConfig {
  key: string | null;
  direction: 'ascending' | 'descending';
}

interface SeatPopularityData {
  seat: string;
  count: number;
}

const BoardingPassVisualization = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://reandata-api.istad.co:443/rpc/get_boarding_statistics');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        
        setData(Array.isArray(result) ? result : [result]);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = sortConfig.key ? a[sortConfig.key] : '';
      const bValue = sortConfig.key ? b[sortConfig.key] : '';
      
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  };

  const aggregateSeats = () => {
    const seatCounts: { [key: string]: number } = {};
  
    data.forEach(item => {
      if (item.popular_seat) {
        seatCounts[item.popular_seat] = (seatCounts[item.popular_seat] || 0) + item.seat_count;
      }
    });
  
    return Object.keys(seatCounts).map(seat => ({
      seat,
      count: seatCounts[seat],
    }));
  };
  

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center">Loading boarding pass data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (data.length === 0) return <div>No data available</div>;

  const sortedData = getSortedData();
  const seatPopularityData = aggregateSeats();

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Boarding Pass Data</h2>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(data[0]).map(key => (
                <th 
                  key={key}
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => requestSort(key)}
                >
                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.keys(data[0]).map(key => (
                  <td key={`${index}-${key}`} className="px-4 py-2 border">
                    {typeof item[key] === 'boolean' ? 
                      String(item[key]) : 
                      key.includes('date') || key.includes('time') ? 
                        formatDate(item[key]) : 
                        item[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seats Distribution Chart */}
        <div className="bg-white p-4 shadow-md rounded">
          <h3 className="text-lg font-bold mb-2">The Most Popular Seats Among 1000 Records On Boarding_Pass</h3>
          {seatPopularityData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={seatPopularityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="seat" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        

        {/* Precheck Status Chart */}
        <div className="bg-white p-4 shadow-md rounded">
          <img src="https://i.imgur.com/4ESVFCb.png" alt="" />
          <h3 className="text-lg font-bold mb-2">Precheck Status</h3>
          {sortedData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pass_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="precheck" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardingPassVisualization;
