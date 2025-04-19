const sum = require('../sum.js');

describe('sum function', () => {
    test('adds 1 + 2 to equal 3', () => {
        expect(sum(1, 2)).toBe(3);
    });

    test('adds positive numbers', () => {
        expect(sum(5, 3)).toBe(8);
    });

    test('adds negative numbers', () => {
        expect(sum(-5, -3)).toBe(-8);
    });

    test('adds zero', () => {
        expect(sum(5, 0)).toBe(5);
    });

    test('adds decimals', () => {
        expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
    });
});
