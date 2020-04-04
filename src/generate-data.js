const csv = require("csvtojson");
const fs = require("fs").promises;
const { LTD } = require("downsample");

// World http://www.msci.com/eqb/esg/performance/106.0.all.xls
// ACWI http://www.msci.com/eqb/esg/performance/2591.0.all.xls
// ACWI IMI http://www.msci.com/eqb/esg/performance/73562.0.all.xls

const dataDir = "index-data";

const calculateChartData = (data, sampleRate) => {
  const newData = data.map(({ price, date }) => ({ x: date, y: price }));
  const numPointsInDownsampledData = sampleRate;
  const downsampledData = LTD(newData, numPointsInDownsampledData);

  return [
    {
      id: "sampled",
      data: downsampledData,
    },
  ];
};

const parseFile = async (fileName) =>
  csv({
    colParser: {
      Price: (item) => parseFloat(item.replace(",", "")),
      Date: (item) => new Date(item),
    },
  }).fromFile(fileName);

const processIndex = async (index) => {
  const msciData = await parseFile(`./data-sources/msci/${index}.csv`);
  const investingData = (
    await parseFile(`./data-sources/investing/${index}.csv`)
  ).reverse();

  const indexData = msciData
    .concat(investingData)
    .map(({ Date: date, Price: price }) => ({ date, price: price.toFixed(2) }));

  await fs.writeFile(
    `./${dataDir}/${index}.json`,
    JSON.stringify({ data: indexData }, null, 2)
  );

  const chartData = calculateChartData(
    indexData.map(({ date, price }) => ({
      date: new Date(date),
      price: parseFloat(price),
    })),
    5000
  );

  await fs.writeFile(
    `./${dataDir}/chart-${index}.json`,
    JSON.stringify({ data: chartData }, null, 2)
  );
};

(async () => {
  await fs.mkdir(dataDir, { recursive: true });

  for (const index of ["msci-world", "msci-acwi", "msci-acwi-imi"]) {
    await processIndex(index);
  }
})();