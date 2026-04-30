import React, { useRef } from "react";
import {
  render,
  Box,
  Text,
  Sparkline,
  Gauge,
  LineChart,
  BarChart,
  Badge,
  Divider,
  Spinner,
  useInput,
  useTerminal,
  useTui,
  useTick,
} from "../src/index.js";

function Dashboard() {
  const { width, height } = useTerminal();
  const { exit } = useTui();
  useInput((e) => {
    if (e.key === "c" && e.ctrl) exit();
  });

  const cpuRef = useRef(
    Array.from({ length: 30 }, () => 20 + Math.random() * 40),
  );
  const memRef = useRef(55);
  const ioRef = useRef(28);
  const netRef = useRef(34);

  useTick(500, () => {
    const arr = cpuRef.current;
    arr.push(
      Math.max(
        5,
        Math.min(95, arr[arr.length - 1] + (Math.random() - 0.5) * 15),
      ),
    );
    if (arr.length > 30) arr.shift();
    memRef.current = Math.max(
      30,
      Math.min(85, memRef.current + (Math.random() - 0.45) * 3),
    );
    ioRef.current = Math.max(
      10,
      Math.min(92, ioRef.current + (Math.random() - 0.5) * 9),
    );
    netRef.current = Math.max(
      8,
      Math.min(88, netRef.current + (Math.random() - 0.48) * 7),
    );
  });

  const cpu = Math.round(cpuRef.current[cpuRef.current.length - 1]);
  const mem = Math.round(memRef.current);
  const io = Math.round(ioRef.current);
  const net = Math.round(netRef.current);
  const chartWidth = Math.max(24, width - 36);
  const sideWidth = Math.max(20, Math.min(32, Math.floor(width / 3)));
  const chartHeight = Math.max(5, Math.min(10, height - 10));
  const barData = [
    { label: "CPU", value: cpu, color: cpu > 70 ? "#F7768E" : "#9ECE6A" },
    { label: "MEM", value: mem, color: mem > 70 ? "#E0AF68" : "#9ECE6A" },
    { label: "I/O", value: io, color: io > 70 ? "#BB9AF7" : "#7DCFFF" },
    { label: "NET", value: net, color: net > 70 ? "#E0AF68" : "#82AAFF" },
  ];

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box height={1} paddingX={1}>
        <Spinner type="dots" color="#82AAFF" />
        <Text bold color="#82AAFF">
          {" Storm Dashboard"}
        </Text>
        <Box flex={1} />
        <Badge
          label={`CPU ${cpu}%`}
          variant={cpu > 70 ? "error" : "success"}
        />
        <Text> </Text>
        <Badge
          label={`MEM ${mem}%`}
          variant={mem > 70 ? "warning" : "success"}
        />
      </Box>
      <Divider style="line" color="#565F89" />
      <Box flex={1} flexDirection="row" paddingX={1} gap={2}>
        <Box flex={1} flexDirection="column">
          <Text bold color="#82AAFF">
            CPU Line Plot
          </Text>
          <LineChart
            series={[{ data: cpuRef.current, name: "CPU", color: "#82AAFF" }]}
            width={chartWidth}
            height={chartHeight}
            yMin={0}
            yMax={100}
            showLegend={false}
            showGrid
          />
          <Text bold color="#82AAFF">
            Sparkline
          </Text>
          <Sparkline
            data={cpuRef.current}
            width={Math.max(10, chartWidth)}
            height={2}
            color="#82AAFF"
          />
        </Box>
        <Box width={sideWidth} flexDirection="column">
          <Text bold color="#82AAFF">
            Bar Plot
          </Text>
          <BarChart
            bars={barData}
            orientation="horizontal"
            width={sideWidth}
            showValues
            showAxes={false}
          />
          <Box height={1} />
          <Text bold color="#82AAFF">
            Memory Gauge
          </Text>
          <Gauge
            value={mem}
            width={Math.max(10, sideWidth - 8)}
            color={mem > 70 ? "#E0AF68" : "#9ECE6A"}
            label={`${mem}%`}
          />
        </Box>
      </Box>
    </Box>
  );
}

render(<Dashboard />).waitUntilExit();
