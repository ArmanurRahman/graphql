import { getCompany } from "./db/companies.js";
import {
    createJob,
    deleteJob,
    getJob,
    getJobs,
    getJobsByCompanyId,
    getJobsCount,
    updateJob,
} from "./db/jobs.js";
import { GraphQLError } from "graphql";

export const resolvers = {
    Query: {
        company: async (_root, { id }) => {
            const company = await getCompany(id);
            if (!company) {
                throw notFoundError("No Company found with id + " + id);
            }
            return company;
        },
        job: async (_root, { id }) => {
            const job = await getJob(id);
            if (!job) {
                throw notFoundError("No Job found with id + " + id);
            }
            return job;
        },
        jobs: async (_root, { limit, offset }) => {
            const items = await getJobs(limit, offset);
            const totalCount = await getJobsCount();
            return { items, totalCount };
        },
    },
    Mutation: {
        createJob: (_root, { input: { title, description } }, { user }) => {
            if (!user) {
                throw unauthorizeError("Missing authentication");
            }
            return createJob({ companyId: user.companyId, title, description });
        },
        deleteJob: async (_root, { id }, { user }) => {
            if (!user) {
                throw unauthorizeError("Missing authentication");
            }
            const job = await deleteJob(id, user.companyId);
            if (!job) {
                throw notFoundError("No job found with id " + id);
            }
            return job;
        },
        updateJob: async (
            _root,
            { input: { id, title, description } },
            { user }
        ) => {
            if (!user) {
                throw unauthorizeError("Missing authentication");
            }
            const job = await updateJob({
                id,
                companyId: user.companyId,
                title,
                description,
            });
            if (!job) {
                throw notFoundError("No job found with id " + id);
            }
            return job;
        },
    },
    Job: {
        company: (job) => getCompany(job.companyId),
        date: (job) => toIsoDate(job.createdAt),
    },
    Company: {
        jobs: (company) => getJobsByCompanyId(company.id),
    },
};

function toIsoDate(value) {
    return value.slice(0, "yyyy-mm-dd".length);
}

function notFoundError(message) {
    return new GraphQLError(message, {
        extensions: {
            code: "NOT_FOUND",
        },
    });
}

function unauthorizeError(message) {
    return new GraphQLError(message, {
        extensions: {
            code: "UNAUTHORIZE",
        },
    });
}
