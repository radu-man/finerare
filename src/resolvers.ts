import { ObjectId } from 'mongodb'
const { client } = require("./db");
import { Product } from "./types";
import { Worker } from 'worker_threads';


const getProductById = async(id: string) => {
    const db = await client.db('finerare')
    const products = db.collection('Products')

    return await products.findOne({ _id: new ObjectId(id) })
}


const getProducerById = async(id: string) => {
    const db = await client.db('finerare')
    const producers = db.collection('Producers')

    return await producers.findOne({ _id: new ObjectId(id) })
}


const getProductsByProducerId = async(id: string): Promise<Array<Product>> => {
    const db = await client.db('finerare')
    const products = db.collection('Products')
    
    const result = await products.find({ producerId: new ObjectId(id) }).toArray()
    
    return result
}


const addProducts = async(products: Array<Product>) => {
    const db = client.db('finerare')
    const coll = db.collection('Products')
    
    const result = await coll.insertMany(products.map((product: Product) => ({
        ...product,
        producerId: new ObjectId(product.producerId)
    })))
    
    return result.ops;
}

const updateProduct = async(id: string, updateData: { name?: string, vintage?: string, producerId?: string }) => {
    const db = client.db('finerare')
    const coll = db.collection('Products')
    
    const result = await coll.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        {
            returnNewDocument: true,
            returnDocument: 'after'
        }
    )
    
    return result
}


const deleteProducts = async(productsToDelete: Array<string>) => {
    const db = client.db('finerare')
    const coll = db.collection('Products')

    const result = await coll.deleteMany({ _id: { $in: productsToDelete.map((id: string) => new ObjectId(id)) } });

    return result.deletedCount > 0
}

const syncData = async() => {
    const syncWorker = new Worker('./src/syncDataWorker.ts');

    syncWorker.on('message', (message) => {
        console.log('Worker message: ', message)
    })

    syncWorker.on('error', async(error) => {
        const db = client.db('finerare')
        const coll = db.collection('logs')

        await coll.insertOne({
            error: 'Worker failed to sync Data',
            date: new Date(),
            minute: new Date().getMinutes(),
            errorName: error.name,
            errorMessage: error.message
        })
    })
}

export {
    getProductById,
    getProductsByProducerId,
    addProducts,
    updateProduct,
    getProducerById,
    deleteProducts,
    syncData
};