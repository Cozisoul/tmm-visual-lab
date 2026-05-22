export type ControlType = 
  | 'number' 
  | 'color' 
  | 'boolean' 
  | 'select' 
  | 'text'
  | 'range'      // Dual-value range input (min/max)
  | 'angle'      // Angle input with visual indicator (0-360)
  | 'multiselect' // Multiple selection dropdown
  | 'slider'     // Enhanced slider with marks/ticks
  | 'vector2'    // X/Y coordinate pair
  | 'vector3';   // X/Y/Z coordinate triple

export interface ControlDef {
  id: string;
  label: string;
  type: ControlType;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for select/multiselect
  defaultValue: any;
  // Enhanced options
  marks?: { value: number; label: string }[]; // For slider with marks
  unit?: string; // Display unit (px, %, deg, etc.)
  description?: string; // Help text
}

export interface SketchParams {
  [key: string]: any;
}
