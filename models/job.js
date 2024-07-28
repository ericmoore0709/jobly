"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be title, salary, equity, companyHandle
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY company_handle`);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns { title, salary, equity, companyHandle }
     *   where jobs is [{ title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: { title, salary, equity, company_handle}
     *
     * Returns {title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle",
            });
        const IDVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${IDVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        console.log(job);

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * 
     **/

    static async remove(id) {

        const exists = await db.query(
            `SELECT *
            FROM jobs
            WHERE id = $1`,
            [id]);

        if (!exists.rowCount) throw new NotFoundError(`No job: ${id}`);

        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1`,
            [id]);
    }

    /** Find all jobs that match the filter criteria.
   *
   * Accepts filter criteria as an object { title, minSalary, hasEquity }
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
    static async findFiltered(filters = {}) {
        let query = `SELECT id, title, salary, equity, company_handle AS "companyHandle"
               FROM jobs`;
        let whereExpressions = [];
        let queryValues = [];

        const { title, minSalary, hasEquity } = filters;

        // For each existing filter, add clause to whereExpressions and variable value to queryValues
        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (hasEquity) {
            queryValues.push(0);
            whereExpressions.push(`equity > $${queryValues.length}`);
        }

        // if filters were added, append where clauses to query string 
        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        // order by companyHandle because that's what the findAll did.
        query += " ORDER BY company_handle";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }

    /** Given a company handle, returns a list of jobs.
     *
     * Returns [{ title, salary, equity, companyHandle }, ...]
     *
     **/

    static async findByCompanyHandle(companyHandle) {
        const jobsRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE company_handle = $1`,
            [companyHandle]);

        return jobsRes.rows;
    }
}


module.exports = Job;
