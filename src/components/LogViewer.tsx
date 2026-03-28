import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

interface Log {
  message: string;
  type: 'info' | 'error' | 'warning';
  timestamp: string;
}

const socket = io();

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    socket.on('log', (log: Log) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('log');
    };
  }, []);

  return (
    <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl h-64 overflow-y-auto font-mono text-xs">
      <h3 className="text-zinc-400 mb-2 uppercase tracking-wider">System Logs</h3>
      {logs.map((log, index) => (
        <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-zinc-300'}`}>
          <span className="text-zinc-500">[{log.timestamp}]</span> {log.message}
        </div>
      ))}
    </div>
  );
};
