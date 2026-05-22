/**
 * Machine Registry: Centralized catalog of all visualization machines
 */

import { Machine, MachineDepartment } from '../types';

interface MachineRegistry {
  [key: string]: Machine;
}

const machineRegistry: MachineRegistry = {};

/**
 * Register a machine in the global registry
 */
export const registerMachine = (machine: Machine): void => {
  machineRegistry[machine.id] = machine;
};

/**
 * Register multiple machines at once
 */
export const registerMachines = (machines: Machine[]): void => {
  machines.forEach(m => registerMachine(m));
};

/**
 * Get a machine by ID
 */
export const getMachine = (id: string): Machine | undefined => {
  return machineRegistry[id];
};

/**
 * Get all machines
 */
export const getAllMachines = (): Machine[] => {
  return Object.values(machineRegistry);
};

/**
 * Get machines by department
 */
export const getMachinesByDepartment = (dept: MachineDepartment): Machine[] => {
  return Object.values(machineRegistry).filter(m => m.department === dept);
};

/**
 * Get all departments with their machines
 */
export const getMachinesByDepartments = (): Record<MachineDepartment, Machine[]> => {
  const result: Record<MachineDepartment, Machine[]> = {} as any;

  Object.values(MachineDepartment).forEach(dept => {
    result[dept] = getMachinesByDepartment(dept);
  });

  return result;
};

/**
 * Get machine count
 */
export const getMachineCount = (): number => {
  return Object.keys(machineRegistry).length;
};

export default {
  registerMachine,
  registerMachines,
  getMachine,
  getAllMachines,
  getMachinesByDepartment,
  getMachinesByDepartments,
  getMachineCount,
};
