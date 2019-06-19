const store = require('../src/store');

describe('store', () => {
  it('should be defined', () => {
    expect(store).toBeDefined();
  });

  it('should set and get values', () => {
    store.set('test', 123);

    expect(store.get('test')).toBe(123);
  })

  it('should return undefined for unknown values', () => {
    expect(store.get('test2')).toBeUndefined();
  })
});
