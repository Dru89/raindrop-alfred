const freeGlobal =
  typeof global === 'object' &&
  global !== null &&
  // eslint-disable-next-line eqeqeq
  global.Object == Object &&
  global;

const freeGlobalThis =
  typeof globalThis === 'object' &&
  globalThis !== null &&
  // eslint-disable-next-line eqeqeq
  globalThis.Object == Object &&
  globalThis;

const freeSelf =
  // eslint-disable-next-line no-restricted-globals, eqeqeq
  typeof self === 'object' && self !== null && self.Object == Object && self;

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const root: any =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  freeGlobalThis || freeGlobal || freeSelf || Function('return this')();

export default root;
