(async () => {
  const csv = require("csv-parser");
  const axios = require("axios");
  const { isMainThread, parentPort } = require("worker_threads");
  const { client } = require("./db.ts");
  const { Transform } = require('stream');

  const batchSize = 100;

  const batchTransform = () => {
    let batch = [];
    let index = 0;
  
    return new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        batch.push(row);
        index++;
  
        if (index >= batchSize) {
          this.push(batch);
          batch = [];
          index = 0;
        }
  
        callback();
      },
      flush(callback) {
        if (batch.length > 0) {
          this.push(batch);
        }
        callback();
      }
    });
  };

  const getStreamFromURL = async (url) => {
    try {
      console.log('Downloading file from: ', url);
      
      const response = await axios.get(url, { responseType: "stream" });
      return response.data.pipe(csv()).pipe(batchTransform());
    } catch (error) {
      console.error("Error fetching stream from URL:", error);
      throw error;
    }
  };

  if (!isMainThread) {
    const colletionName = 'csv_data';
    const db = await client.db("finerare");
    const collectionExists = await db.listCollections({ name: colletionName }).hasNext();
    
    if (!collectionExists){
      await db.createCollection(colletionName);
    }

    const coll = await db.collection(colletionName)

    const indexToCreate = {
      ['Vintage']: 1,
      ['Product Name']: 1,
      ['Producer']: 1,
    };

    const indexExists = await coll.indexExists("vpp");

    if (!indexExists) {
      await coll.createIndex(indexToCreate, { name: "vpp" });

      console.log("Index created successfully");
    } else {
      console.log("Index already exists");
    }

    let batchNr = 0;

    async function processBatch(data) {
      try {
        const operations = data.map(async (item) =>  {
          // Perform upsert operation
          return coll.updateOne({
            ['Vintage']: item['Vintage'],
            ['Product Name']: item['Product Name'],
            ['Producer']: item['Producer'],
          }, { $set: item }, { upsert: true });
        });

        await Promise.allSettled(operations);
      } catch (error) {
        console.error("Error processing batch:", error);
      }
    }

    const stream = await getStreamFromURL("https://api.frw.co.uk/feeds/all_listings.csv")

    stream.on("data", async (batchData) => {
      batchNr++
      
      // You can check with this for an error in the stream Tamas
      // if (batchNr === 267){
      //   throw new Error('stream disconnected')
      // }

      console.log("Processing batch nr :", batchNr);
      stream.pause()
      await processBatch(batchData);
      stream.resume()
    });

    stream.on("end", async () => {
      parentPort?.postMessage("Worker finished");
    });

    stream.on("error", async (error) => {
      const logColl = db.collection("logs");
      await logColl.insertOne({ aborted: new Date() });
      console.error("Stream aborted:", error);
    });
  }
})();
