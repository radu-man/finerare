async function processBatch(coll, batch) {
  try {
    batch.map(async (item) => {
      const { vintage, name, producer } = item;
      const filter = { vintage, name, producer };
      await coll.updateOne(filter, { $set: item }, { upsert: true });
    });

    await Promise.all(operations);
  } catch (error) {
    console.error("Error processing batch:", error);
  }
}

(async () => {
  const csv = require("csv-parser");
  const axios = require("axios");
  const { isMainThread, parentPort } = require("worker_threads");
  const { client } = require("./db.ts");

  const batchSize = 100;

  const getStreamFromURL = async (url) => {
    try {
      const response = await axios.get(url, { responseType: "stream" });
      return response.data.pipe(csv());
    } catch (error) {
      console.error("Error fetching stream from URL:", error);
      throw error;
    }
  };
  if (!isMainThread) {
    const db = client.db("finerare");
    const coll = db.collection("csv_data");

    let batch = [];

    const stream = await getStreamFromURL("https://api.frw.co.uk/feeds/all_listings.csv");

    stream.on("data", async (row) => {
      batch.push(row);

      if (batch.length >= batchSize) {
        console.log("Processing batch...");
        await processBatch(coll, batch);
        batch = []
      }
    });

    stream.on("end", async () => {
      if (batch.length > 0) {
        console.log("Processing remaining batch...");
        await processBatch(coll, batch);
      }
      parentPort?.postMessage("Worker finished");
    });

    stream.on("error", async (error) => {
      const logColl = db.collection("logs");
      await logColl.insertOne({ aborted: new Date() });
      console.error("Stream aborted:", error);
    });
  }
})();
