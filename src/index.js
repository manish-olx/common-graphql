const { ApolloServer } = require('apollo-server')
const resolvers = require(__dirname + '/resolvers')
const typeDefs = require(__dirname + '/typedefs')

async function startServer() {
    const server = new ApolloServer({ typeDefs, resolvers, context: ({ req }) => {
            const token = req.headers.authorization || '';
            const chatToken = req.headers.chat_token || '';
            const origin = req.headers.origin_panamera || '';
            const userAgent = req.headers.user_agent || 'GraphQL 1.0';

            return { "authorization": token, "x-access-token": chatToken, "x-origin-panamera": origin, "user-agent": userAgent };
        } });
    return await server.listen(process.env.GRAPHQL_PORT || 8080);
}

startServer().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

