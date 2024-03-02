export interface Producer {
    id: string,
    name: string,
    country?: string,
    region?: string
}

export interface Product {
    id: string,
    vintage: string,
    name: string,
    producerId: string,
    producer?: Producer
}