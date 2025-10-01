import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartData } from '../types/visualization';

interface ChartComponentProps {
  chartData: ChartData;
  chartType: 'bar' | 'pie';
  title: string;
  dataType: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ChartComponent: React.FC<ChartComponentProps> = ({ chartData, chartType, title, dataType }) => {
  // Transform data for Recharts
  const transformedData = Object.entries(chartData).map(([key, value], index) => ({
    name: key,
    count: value.count,
    yards: value.yards,
    avgYards: value.count > 0 ? Math.round((value.yards / value.count) * 100) / 100 : 0,
    fill: COLORS[index % COLORS.length]
  }));

  if (chartType === 'pie') {
    return (
      <div style={{ width: '100%', height: '400px' }}>
        <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>{title}</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={transformedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, count, yards }) => `${name}: ${count} plays, ${yards} yds`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="yards"
            >
              {transformedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name === 'yards' ? 'Total Yards' : name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="yards" fill="#8884d8" name="Total Yards" />
          <Bar dataKey="count" fill="#82ca9d" name="Play Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;