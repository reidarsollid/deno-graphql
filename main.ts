import {Application, Router} from "./deps.ts";
import {applyGraphQL, gql, GQLError} from "./deps.ts";

//https://github.com/aaronwlee/oak-graphql

const app = new Application();

app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

const types = gql`

    type Dino {
        name: String,
        image: String
    }

    input DinoInput {
        name: String,
        image: String
    }

    type ResolveType {
        done: Boolean
    }

    type Query {
        getDino(name: String) : Dino
        getDinos: [Dino!]!
    }

    type Mutation {
        addDino(input: DinoInput!): ResolveType!
    }
`;

const dinos = [
    {
        name: "Tyrannosaurus Rex",
        image: "🦖",
    },
];

const resolvers = {
    Query: {
        getDino: (_: any, {name}: any) => {
            const dino = dinos.find((dino) => dino.name.includes(name));
            if (!dino) {
                throw new GQLError("No dino name includes ${name}");
            }
            return dino;
        },
        getDinos: () => {
            return dinos;
        },
    },
    Mutation: {
        addDino: (_: any, {input: {name, image}}: any) => {
            dinos.push({
                name,
                image,
            });
            return {
                done: true,
            };
        },
    },
};

const GraphQLService = await applyGraphQL<Router>({
    Router,
    typeDefs: types,
    resolvers: resolvers,
})

app.use(GraphQLService.routes(), GraphQLService.allowedMethods());

console.log("Server start at http://localhost:8080/graphql");
await app.listen({port: 8080});

//http://localhost:8080/graphql