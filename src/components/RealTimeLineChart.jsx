import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const generateData = (existingData) => {
  const data = existingData || [];
  if (data.length === 0) {
    for (let i = 0; i < 30; i++) {
      data.push({ name: `Day ${i + 1}`, value: Math.floor(Math.random() * 100) });
    }
  }
  return data;
};

const RealTimeLineChart = ({ initialData }) => {
  const [data, setData] = useState(generateData(initialData));

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = prevData.slice(1);
        newData.push({ name: `Day ${prevData.length + 1}`, value: Math.floor(Math.random() * 100) });
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RealTimeLineChart;