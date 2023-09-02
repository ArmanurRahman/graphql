import {
    ApolloClient,
    ApolloLink,
    concat,
    createHttpLink,
    gql,
    InMemoryCache,
} from "@apollo/client";
// import { GraphQLClient } from "graphql-request";
import { getAccessToken } from "../auth";

// const client = new GraphQLClient("http://localhost:9000/graphql", {
//     headers: () => {
//         const accessToken = getAccessToken();
//         if (accessToken) {
//             return {
//                 Authorization: `Bearer ${accessToken}`,
//             };
//         }
//         return {};
//     },
// });

const httpLink = createHttpLink({ uri: "http://localhost:9000/graphql" });
const authLink = new ApolloLink((operation, forward) => {
    const accessToken = getAccessToken();
    if (accessToken) {
        operation.setContext({
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    }
    return forward(operation);
});
export const apolloClient = new ApolloClient({
    link: concat(authLink, httpLink),
    cache: new InMemoryCache(),
});

const jobDetailsFragment = gql`
    fragment JobDetails on Job {
        id
        date
        title
        description
        company {
            id
            name
        }
    }
`;
export const jobByIdQuery = gql`
    query getByJobId($id: ID!) {
        job(id: $id) {
            ...JobDetails
        }
    }
    ${jobDetailsFragment}
`;
export const companyByIdQuery = gql`
    query getCompanyById($id: ID!) {
        company(id: $id) {
            id
            name
            description
            jobs {
                id
                title
                date
            }
        }
    }
`;
export const getJobQuery = gql`
    query jobs($limit: Int, $offset: Int) {
        jobs(limit: $limit, offset: $offset) {
            items {
                id
                date
                title
                company {
                    id
                }
            }
            totalCount
        }
    }
`;
export const createJobMutation = gql`
    mutation createJob($input: CreateJobInput!) {
        job: createJob(input: $input) {
            ...JobDetails
        }
    }
    ${jobDetailsFragment}
`;
export async function createJob({ title, description }) {
    // const { job } = await client.request(mutation, {
    //     input: {
    //         title,
    //         description,
    //     },
    // });

    // return job;
    const { data } = await apolloClient.mutate({
        mutation: createJobMutation,
        variables: {
            input: {
                title,
                description,
            },
        },
        update: (cache, { data }) => {
            cache.writeQuery({
                query: jobByIdQuery,
                variables: { id: data.job.id },
                data,
            });
        },
    });
    return data.job;
}

export async function getJobs() {
    // const { jobs } = await client.request(query);
    // return jobs;
    const { data } = await apolloClient.query({
        query: getJobQuery,
        fetchPolicy: "network-only",
    });
    return data.jobs;
}

export async function getJob(id) {
    // const { job } = await client.request(query, { id });
    // return job;
    const { data } = await apolloClient.query({
        query: jobByIdQuery,
        variables: { id },
    });
    return data.job;
}
export async function getCompany(id) {
    // const { company } = await client.request(query, { id });
    // return company;
    const { data } = await apolloClient.query({
        query: companyByIdQuery,
        variables: { id },
    });
    return data.company;
}
