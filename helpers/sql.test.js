// Import the necessary modules
const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

describe('sqlForPartialUpdate', () => {
    test('transforms data to SQL fragments and values', () => {
        const dataToUpdate = { firstName: 'Aliya', age: 32 };
        const jsToSql = { firstName: 'first_name' };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result.setCols).toEqual('"first_name"=$1, "age"=$2');
        expect(result.values).toEqual(['Aliya', 32]);
    });

    test('throws BadRequestError if no data is provided', () => {
        const dataToUpdate = {};
        const jsToSql = { firstName: 'first_name' };

        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql))
            .toThrow(BadRequestError);
    });

    test('handles data without jsToSql mapping', () => {
        const dataToUpdate = { lastName: 'Smith', age: 40 };
        const jsToSql = { firstName: 'first_name' };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result.setCols).toEqual('"lastName"=$1, "age"=$2');
        expect(result.values).toEqual(['Smith', 40]);
    });

    test('uses jsToSql mapping when available', () => {
        const dataToUpdate = { firstName: 'Aliya', age: 32 };
        const jsToSql = { firstName: 'first_name', age: 'age_years' };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result.setCols).toEqual('"first_name"=$1, "age_years"=$2');
        expect(result.values).toEqual(['Aliya', 32]);
    });

    test('works with one field', () => {
        const dataToUpdate = { age: 32 };
        const jsToSql = { age: 'age_years' };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result.setCols).toEqual('"age_years"=$1');
        expect(result.values).toEqual([32]);
    });
});
