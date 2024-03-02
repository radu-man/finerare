import { GraphQLBoolean, GraphQLID, GraphQLInputObjectType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { addProducts, deleteProducts, getProducerById, getProductById, getProductsByProducerId, syncData, updateProduct } from "./resolvers";

const Product = new GraphQLObjectType({
    name: 'Product',
    fields: () => ({
        id: { type: GraphQLID },
        vintage: { type: GraphQLString },
        name: { type: GraphQLString },
        producerId: { type: GraphQLString },
        producer: {
            type: Producer,
            resolve(parent, args) {
              return getProducerById(parent.producerId);
            },
          },
    })
})

const ProductWithoutProducer = new GraphQLObjectType({
    name: 'ProductNoProducer',
    fields: () => ({
        id: { type: GraphQLID },
        vintage: { type: GraphQLString },
        name: { type: GraphQLString },
        producerId: { type: GraphQLString }
    })
})

const Producer = new GraphQLObjectType({
    name: 'Producer',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        country: { type: GraphQLString },
        region: { type: GraphQLString },
    })
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        getSingleProduct: {
            type: Product,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
              return getProductById(args.id);
            },
          },
        getProductsByProducerId: {
            type: GraphQLList(ProductWithoutProducer),
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
              return getProductsByProducerId(args.id);
            },
        }
    }
})

const ProductInputType = new GraphQLInputObjectType({
    name: 'ProductInput',
    fields: () => ({
        vintage: { type: GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLNonNull(GraphQLString) },
        producerId: { type: GraphQLNonNull(GraphQLString) },
    })
});

const RootMutation = new GraphQLObjectType({
    name: 'RootMutation',
    fields: {
        addMultipleProducts: {
            type: GraphQLList(Product),
            args: {
                products: { type: GraphQLList(ProductInputType) },
            },
            resolve(parent, args) {
                addProducts(args.products)
            }
          },
        updateProduct: {
            type: Product,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) },
                name: { type: GraphQLString },
                vintage: { type: GraphQLString },
                producerId: { type: GraphQLID },
             },
            resolve(parent, args) {
              const { id, ...updateData } = args;

              return updateProduct(id, updateData);
            },
        },
        deleteProducts: {
            type: Product,
            args: { productsToDelete: { type: GraphQLList(GraphQLID) } },
            resolve(parent, args) {
                return deleteProducts(args.productsToDelete)
            }
        },
        syncProducts: {
            type: GraphQLBoolean,
            resolve: async () => {
                syncData();

                return true;
            }
        },
    }
})
  

export default new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
});
