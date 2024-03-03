const { client } = require("./db");

const mockData = {
    products: [
        {
            vintage: '2020',
            name: 'Cabernet Sauvignon',
            producerId: '101',
        },
        {
            vintage: '2019',
            name: 'Chardonnay',
            producerId: '102',
        },
    ],
    producers: [
        {
            name: 'Winery USA',
            country: 'USA',
            region: 'California'
        },
        {
            name: 'Winery France',
            country: 'France',
            region: 'Bordeaux'
        },
        {
            name: 'Winery UK',
            country: 'UK',
            region: 'Shouthampton'
        }
    ]
};

const seedData = async() => {
    const db = client.db('finerare')
    const producers = db.collection('Producers')

    await producers.insertMany(mockData.producers);

    const products = db.collection('Products')

    await products.insertMany(mockData.products);
}

(async() => await seedData())()

export {
    mockData,
    seedData
};
