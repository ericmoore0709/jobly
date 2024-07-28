"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let jobId;

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: 'New Job 1',
        salary: 90000,
        equity: 0.04,
        companyHandle: 'c1'
    };

    test("ok for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: 'New Job 1',
                salary: 90000,
                equity: '0.04',
                companyHandle: 'c1'
            },
        });

        console.log(resp.body.job.id);
        jobId = resp.body.job.id;

    });

    test("not ok for non-admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: 'Incomplete Job',
                salary: 100000
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                random: "randomstring",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: "Job 1",
                        salary: 100000,
                        equity: '0.01',
                        companyHandle: "c1"
                    },
                    {
                        id: expect.any(Number),
                        title: "Job 2",
                        salary: 200000,
                        equity: '0.02',
                        companyHandle: "c2"
                    },
                    {
                        id: expect.any(Number),
                        title: "Job 3",
                        salary: 300000,
                        equity: '0.03',
                        companyHandle: "c3"
                    },
                ],
        });
    });

    test("fails: test next() idr", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-idr works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/${jobId - 3}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "Job 1",
                salary: 100000,
                equity: '0.01',
                companyHandle: "c1"
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/${jobId + 999}`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId - 3}`)
            .send({
                title: "Job 1 new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "Job 1 new",
                salary: 100000,
                equity: '0.01',
                companyHandle: "c1"
            },
        });
    });

    test("not for non-admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId - 3}`)
            .send({
                title: "job-new",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId - 3}`)
            .send({
                title: "job-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId + 999}`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId - 3}`)
            .send({
                id: jobId + 1,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId - 3}`)
            .send({
                something: "something",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobId - 3}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: `${jobId - 3}` });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobId - 3}`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobId - 3}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobId + 999}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});

describe("GET /jobs", function () {
    test("works: no filter", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "Job 1",
                    salary: 100000,
                    equity: '0.01',
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "Job 2",
                    salary: 200000,
                    equity: '0.02',
                    companyHandle: "c2"
                },
                {
                    id: expect.any(Number),
                    title: "Job 3",
                    salary: 300000,
                    equity: '0.03',
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("works: title filter", async function () {
        const resp = await request(app).get("/jobs?title=Job 1");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "Job 1",
                    salary: 100000,
                    equity: '0.01',
                    companyHandle: "c1"
                },
            ],
        });
    });

    test("works: minSalary filter", async function () {
        const resp = await request(app).get("/jobs?minSalary=200000");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "Job 2",
                    salary: 200000,
                    equity: '0.02',
                    companyHandle: "c2"
                },
                {
                    id: expect.any(Number),
                    title: "Job 3",
                    salary: 300000,
                    equity: '0.03',
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("works: equity filter", async function () {
        const resp = await request(app).get("/jobs?hasEquity=true");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "Job 1",
                    salary: 100000,
                    equity: '0.01',
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "Job 2",
                    salary: 200000,
                    equity: '0.02',
                    companyHandle: "c2"
                },
                {
                    id: expect.any(Number),
                    title: "Job 3",
                    salary: 300000,
                    equity: '0.03',
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("fails: invalid filter field", async function () {
        const resp = await request(app).get("/jobs?invalidField=test");
        expect(resp.statusCode).toEqual(400);
    });
});