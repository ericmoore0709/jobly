"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let jobId;

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "New Job",
        salary: 50000,
        equity: '0.05',
        companyHandle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: expect.any(Number),
            title: "New Job",
            salary: 50000,
            equity: '0.05',
            companyHandle: "c1",
        });

        // add job id to file constant
        const getId = await db.query(`SELECT id FROM jobs WHERE title = 'New Job' LIMIT 1`);
        jobId = getId.rows[0].id;

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'New Job'`
        );
        expect(result.rows).toEqual([
            {
                title: "New Job",
                salary: 50000,
                equity: '0.05',
                company_handle: "c1",
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "title1",
                salary: 50000,
                equity: '0',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title2",
                salary: 60000,
                equity: '0.04',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title3",
                salary: 70000,
                equity: '0.06',
                companyHandle: 'c2'
            }
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get(jobId - 3);
        expect(job).toEqual({
            id: expect.any(Number),
            title: "title1",
            salary: 50000,
            equity: '0',
            companyHandle: "c1",
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(jobId + 999);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "Updated Job",
        salary: 150000,
        equity: '0.15',
    };

    test("works", async function () {
        let job = await Job.update(jobId - 3, updateData);
        expect(job).toEqual({
            id: expect.any(Number),
            title: "Updated Job",
            salary: 150000,
            equity: '0.15',
            companyHandle: "c1",
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
       FROM jobs
       WHERE id = $1`, [jobId - 3]
        );
        expect(result.rows).toEqual([
            {
                title: "Updated Job",
                salary: 150000,
                equity: '0.15',
                company_handle: "c1",
            },
        ]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "Updated Job",
            salary: null,
            equity: null,
        };

        let job = await Job.update(jobId - 3, updateDataSetNulls);
        expect(job).toEqual({
            id: expect.any(Number),
            title: "Updated Job",
            salary: null,
            equity: null,
            companyHandle: "c1",
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
       FROM jobs
       WHERE id = $1`, [jobId - 3]
        );
        expect(result.rows).toEqual([
            {
                title: "Updated Job",
                salary: null,
                equity: null,
                company_handle: "c1",
            },
        ]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(jobId + 999, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(jobId - 3, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(jobId - 3);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", [jobId - 3]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(jobId + 999);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** findFiltered */

describe("findFiltered", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findFiltered();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "title1",
                salary: 50000,
                equity: '0',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title2",
                salary: 60000,
                equity: '0.04',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title3",
                salary: 70000,
                equity: '0.06',
                companyHandle: 'c2'
            }
        ]);
    });

    test("works: title filter", async function () {
        let jobs = await Job.findFiltered({ title: "title1" });
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "title1",
                salary: 50000,
                equity: '0',
                companyHandle: "c1",
            },
        ]);
    });

    test("works: minSalary filter", async function () {
        let jobs = await Job.findFiltered({ minSalary: 60000 });
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "title2",
                salary: 60000,
                equity: '0.04',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title3",
                salary: 70000,
                equity: '0.06',
                companyHandle: 'c2'
            }
        ]);
    });

    test("works: hasEquity filter", async function () {
        let jobs = await Job.findFiltered({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "title2",
                salary: 60000,
                equity: '0.04',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title3",
                salary: 70000,
                equity: '0.06',
                companyHandle: 'c2'
            },
        ]);
    });

    test("works: combined filters", async function () {
        let jobs = await Job.findFiltered({ minSalary: 50000, hasEquity: true });
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "title2",
                salary: 60000,
                equity: '0.04',
                companyHandle: "c1",
            },
            {
                id: expect.any(Number),
                title: "title3",
                salary: 70000,
                equity: '0.06',
                companyHandle: 'c2'
            },
        ]);
    });
});
