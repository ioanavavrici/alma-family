import React from 'react';
import { useTotemLogic } from './useTotemLogic';
import TotemView from './TotemView';

export default function TotemInterface() {
  const logic = useTotemLogic();
  return <TotemView {...logic} />;
}