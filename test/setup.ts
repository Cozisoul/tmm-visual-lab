import '@testing-library/jest-dom';

// JSDOM doesn't implement Worker or ResizeObserver in some environments used by CI/tests.
// Provide lightweight mocks so components that rely on them can be tested.

if (typeof (global as any).Worker === 'undefined') {
  (global as any).Worker = class {
    onmessage: any = null;
    constructor(_: any) {}
    postMessage(_: any) {}
    terminate() {}
  } as any;
}

if (typeof (global as any).ResizeObserver === 'undefined') {
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as any;
}

