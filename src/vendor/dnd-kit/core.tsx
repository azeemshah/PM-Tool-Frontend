import React from 'react';

export const DndContext: React.FC<any> = ({ children }) => {
  return <>{children}</>;
};

export const closestCenter = () => {};

export const PointerSensor = function PointerSensor() { return {}; };
export const useSensor = (Sensor: any, options?: any) => ({ Sensor, options });
export const useSensors = (...sensors: any[]) => sensors;





